import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers to read Notion properties safely
function getText(prop: any): string {
  if (!prop) return "";
  if (prop.title?.length) return prop.title.map((t: any) => t.plain_text).join("");
  if (prop.rich_text?.length) return prop.rich_text.map((t: any) => t.plain_text).join("");
  if (typeof prop.email === "string") return prop.email;
  if (typeof prop.plain_text === "string") return prop.plain_text;
  return "";
}

function getRoles(prop: any): string[] {
  // Try multi_select first
  if (prop?.multi_select && Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((o: any) => String(o.name || "")).filter(Boolean);
  }
  // Try select
  if (prop?.select?.name) return [String(prop.select.name)];
  // Fallback to text
  const txt = getText(prop);
  return txt ? txt.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const NOTION_TOKEN = Deno.env.get("NOTION_API_KEY");
  // Notion DB for managers (same used in notion-managers)
  const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!NOTION_TOKEN) {
    return new Response(JSON.stringify({ error: "NOTION_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";
    const submissionId = body?.submissionId as string | undefined;

    // JWT-based authentication and role check (admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: isAdmin, error: roleErr } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use admin client for privileged operations
    const supabase = adminClient;

    // Helper to fetch a public file URL and return base64 contents
    async function fetchBase64(url: string): Promise<{ base64: string; contentType?: string }> {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao baixar arquivo (${res.status})`);
      const contentType = res.headers.get("content-type") || undefined;
      const ab = await res.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      return { base64, contentType };
    }

    if (action === "queue") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("j_ads_creative_submissions")
        .update({ status: "queued" })
        .eq("id", submissionId)
        .select("id, status")
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, updated: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "publish") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load submission
      const { data: submission, error: subErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, payload, total_variations, status")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !submission) {
        return new Response(JSON.stringify({ error: subErr?.message || "Submissão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        // Load files for this submission
        const { data: files, error: filesErr } = await supabase
          .from("j_ads_creative_files")
          .select("name, type, size, format, variation_index, public_url")
          .eq("submission_id", submissionId)
          .order("variation_index", { ascending: true });

        if (filesErr) throw new Error(filesErr.message);

        // Build filesInfo with base64 from stored public_url
        const filesInfo: Array<{ name: string; type: string; size: number; variationIndex: number; base64Data: string; format?: string }> = [];

        for (const f of files || []) {
          if (!f.public_url) continue;
          const { base64, contentType } = await fetchBase64(f.public_url);
          filesInfo.push({
            name: f.name || "file",
            type: f.type || contentType || "application/octet-stream",
            size: f.size || 0,
            variationIndex: (f.variation_index as number) || 1,
            base64Data: base64,
            format: f.format || undefined,
          });
        }

        // Prepare creative data for submit-creative
        const creativeData = {
          ...(submission.payload || {}),
          filesInfo,
        };

        // Invoke new namespaced submit function (wrapper)
        const { data: submitRes, error: submitErr } = await supabase.functions.invoke("submit-creative", {
          body: creativeData,
        });

        if (submitErr || !submitRes?.success) {
          const message = submitErr?.message || submitRes?.error || "Erro ao publicar";
          await supabase
            .from("j_ads_creative_submissions")
            .update({ status: "error", error: message })
            .eq("id", submissionId);

          return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Upsert creative variations into DB for reference
        const variations = Array.isArray(submitRes?.createdCreatives) ? submitRes.createdCreatives : [];
        const ctaValue = submission?.payload?.cta || submission?.payload?.callToAction || null;
        if (variations.length > 0) {
          const rows = variations.map((v: any) => ({
            submission_id: submissionId,
            variation_index: v.variationIndex,
            notion_page_id: v.notionPageId,
            creative_id: v.creativeId,
            full_creative_name: v.fullCreativeName,
            cta: ctaValue,
            processed_at: new Date().toISOString(),
          }));
          const { error: upsertErr } = await supabase
            .from("j_ads_creative_variations")
            .upsert(rows, { onConflict: "submission_id,variation_index" });
          if (upsertErr) {
            console.error("Failed to upsert j_ads_creative_variations:", upsertErr);
          }
        }

        await supabase
          .from("j_ads_creative_submissions")
          .update({ status: "processed", result: submitRes, processed_at: new Date().toISOString() })
          .eq("id", submissionId);

        return new Response(JSON.stringify({ success: true, result: submitRes }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message || "Erro inesperado ao publicar";
        await supabase
          .from("j_ads_creative_submissions")
          .update({ status: "error", error: msg })
          .eq("id", submissionId);
        return new Response(JSON.stringify({ success: false, error: msg }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "backfill_variations") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sub, error: subErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, result, payload")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !sub) {
        return new Response(JSON.stringify({ error: subErr?.message || "Submissão não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const variations = Array.isArray(sub.result?.createdCreatives) ? sub.result.createdCreatives : [];
      const ctaValue = sub?.payload?.cta || sub?.payload?.callToAction || null;

      if (variations.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "Nada para backfill", count: 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows = variations.map((v: any) => ({
        submission_id: submissionId,
        variation_index: v.variationIndex,
        notion_page_id: v.notionPageId,
        creative_id: v.creativeId,
        full_creative_name: v.fullCreativeName,
        cta: ctaValue,
        processed_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from("j_ads_creative_variations")
        .upsert(rows, { onConflict: "submission_id,variation_index" });

      if (upsertErr) {
        return new Response(JSON.stringify({ success: false, error: upsertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, count: rows.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "backfill_all") {
      // Load many submissions and upsert all variations found in their result
      const { data: subs, error: listErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, result, payload")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let count = 0;
      const batch: any[] = [];
      for (const s of subs || []) {
        const vars = Array.isArray(s.result?.createdCreatives) ? s.result.createdCreatives : [];
        const ctaValue = s?.payload?.cta || s?.payload?.callToAction || null;
        for (const v of vars) {
          batch.push({
            submission_id: s.id,
            variation_index: v.variationIndex,
            notion_page_id: v.notionPageId,
            creative_id: v.creativeId,
            full_creative_name: v.fullCreativeName,
            cta: ctaValue,
            processed_at: new Date().toISOString(),
          });
        }
      }

      if (batch.length > 0) {
        const { error: upsertErr } = await supabase
          .from("j_ads_creative_variations")
          .upsert(batch, { onConflict: "submission_id,variation_index" });
        if (upsertErr) {
          return new Response(JSON.stringify({ success: false, error: upsertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        count = batch.length;
      }

      return new Response(JSON.stringify({ success: true, count }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: listAll submissions (latest first)
    const { data: items, error: listErr2 } = await supabase
      .from("j_ads_creative_submissions")
      .select("id, client, manager_id, status, error, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (listErr2) {
      return new Response(JSON.stringify({ error: listErr2.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Attempt to enrich client names from Notion (best-effort)
    const clientIds = Array.from(new Set((items || []).map((r: any) => r.client).filter(Boolean))).slice(0, 30);
    const clientMap: Record<string, string> = {};
    for (const clientId of clientIds) {
      try {
        const res = await fetch(`https://api.notion.com/v1/pages/${clientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
        });
        if (res.ok) {
          const page = await res.json();
          const title = page.properties?.Conta?.title?.[0]?.plain_text
            || page.properties?.Name?.title?.[0]?.plain_text
            || page.properties?.Nome?.title?.[0]?.plain_text
            || null;
          if (title) clientMap[clientId as string] = title;
        }
      } catch (_) {
        // ignore enrichment failure
      }
    }

    const enriched = (items || []).map((r: any) => ({ ...r, client_name: r.client ? clientMap[r.client] || null : null }));

    return new Response(JSON.stringify({ success: true, items: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("j_ads_admin_actions error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
