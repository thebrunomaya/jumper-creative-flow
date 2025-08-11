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
    const credentials = body?.credentials as { email?: string; password?: string } | undefined;

    if (!credentials?.email || !credentials?.password) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate admin via Notion
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DB_GERENTES_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        page_size: 5,
        filter: {
          property: "E-Mail",
          email: { equals: credentials.email },
        },
      }),
    });

    if (!notionRes.ok) {
      const txt = await notionRes.text();
      console.error("Notion query failed:", notionRes.status, txt);
      return new Response(JSON.stringify({ error: "Failed to verify credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notionData = await notionRes.json();
    const manager = Array.isArray(notionData.results) ? notionData.results[0] : null;
    if (!manager) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const props = manager.properties || {};
    const storedPassword = getText(props["Senha"]);
    const roles = getRoles(props["Função"]).map((r) => r.toLowerCase());

    const isAdmin = roles.includes("admin");
    if (!isAdmin || !storedPassword || storedPassword !== credentials.password) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
        .from("creative_submissions")
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
        .from("creative_submissions")
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
          .from("creative_files")
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

        // Invoke submit-creative to handle Notion creation
        const { data: submitRes, error: submitErr } = await supabase.functions.invoke("submit-creative", {
          body: creativeData,
        });

        if (submitErr || !submitRes?.success) {
          const message = submitErr?.message || submitRes?.error || "Erro ao publicar";
          await supabase
            .from("creative_submissions")
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
            .from("creative_variations")
            .upsert(rows, { onConflict: "submission_id,variation_index" });
          if (upsertErr) {
            console.error("Failed to upsert creative_variations:", upsertErr);
          }
        }

        await supabase
          .from("creative_submissions")
          .update({ status: "processed", result: submitRes, processed_at: new Date().toISOString() })
          .eq("id", submissionId);

        return new Response(JSON.stringify({ success: true, result: submitRes }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const msg = e?.message || "Erro inesperado ao publicar";
        await supabase
          .from("creative_submissions")
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
        .from("creative_submissions")
        .select("id, result, payload")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !sub) {
        return new Response(JSON.stringify({ error: subErr?.message || "Submissão não encontrada" }), {
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
        .from("creative_variations")
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
        .from("creative_submissions")
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
          .from("creative_variations")
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

    // Reconcile variations directly from Notion (dry-run by default)
    if (action === "reconcile_notion") {
      const dryRun: boolean = body?.dryRun !== false; // default true
      const limit: number = Math.min(50, Math.max(1, Number(body?.limit) || 10));
      const query: string | undefined = body?.query;
      const mappings: Array<{
        submission_id: string;
        variation_index: number;
        notion_page_id: string;
        creative_id?: string;
        cta?: string | null;
      }> | undefined = Array.isArray(body?.mappings) ? body.mappings : undefined;

      async function fetchNotionPage(pageId: string): Promise<{ title: string | null; creativeId: string | null }> {
        try {
          const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${NOTION_TOKEN}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28",
            },
          });
          if (!res.ok) {
            const t = await res.text();
            console.warn("Notion page fetch failed", pageId, res.status, t);
            return { title: null, creativeId: null };
          }
          const page = await res.json();
          const title = page.properties?.["Nome do Criativo"]?.title?.[0]?.plain_text
            || page.properties?.Name?.title?.[0]?.plain_text
            || page.properties?.Nome?.title?.[0]?.plain_text
            || null;
          const number = page.properties?.ID?.unique_id?.number ?? null;
          const creativeId = number != null ? `JSC-${number}` : null;
          return { title, creativeId };
        } catch (e) {
          console.error("Error fetching Notion page", pageId, e);
          return { title: null, creativeId: null };
        }
      }

      // Helper to get CTA from submission payload when available
      const submissionCtaCache = new Map<string, string | null>();
      async function getSubmissionCta(submission_id: string): Promise<string | null> {
        if (submissionCtaCache.has(submission_id)) return submissionCtaCache.get(submission_id)!;
        const { data, error } = await supabase
          .from("creative_submissions")
          .select("payload")
          .eq("id", submission_id)
          .maybeSingle();
        const cta = (data?.payload?.cta || data?.payload?.callToAction) ?? null;
        if (error) console.warn("Could not fetch submission for CTA", submission_id, error.message);
        submissionCtaCache.set(submission_id, cta);
        return cta;
      }

      // Mode 1: Only search and suggest candidates (no DB writes)
      if (!mappings && query) {
        const searchRes = await fetch("https://api.notion.com/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({ query, page_size: limit, filter: { value: "page", property: "object" } }),
        });
        if (!searchRes.ok) {
          const t = await searchRes.text();
          return new Response(JSON.stringify({ success: false, error: `Search failed: ${t}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const searchData = await searchRes.json();
        const candidates: any[] = [];
        for (const r of (searchData.results || []).slice(0, limit)) {
          const id = r.id;
          const details = await fetchNotionPage(id);
          candidates.push({ notion_page_id: id, title: details.title, creative_id: details.creativeId });
        }
        return new Response(JSON.stringify({ success: true, dryRun: true, candidates, count: candidates.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mode 2: Apply explicit mappings with verification from Notion
      if (!mappings || mappings.length === 0) {
        return new Response(JSON.stringify({ error: "Provide 'mappings' or a 'query' to search" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows: any[] = [];
      const issues: any[] = [];

      for (const m of mappings.slice(0, limit)) {
        if (!m.submission_id || !m.variation_index || !m.notion_page_id) {
          issues.push({ mapping: m, error: "Missing required fields" });
          continue;
        }
        const details = await fetchNotionPage(m.notion_page_id);
        const creative_id = m.creative_id || details.creativeId;
        const full_creative_name = details.title || null;
        if (!creative_id) {
          issues.push({ mapping: m, error: "Could not resolve creative_id from Notion page" });
          continue;
        }
        const cta = m.cta ?? (await getSubmissionCta(m.submission_id));
        rows.push({
          submission_id: m.submission_id,
          variation_index: m.variation_index,
          notion_page_id: m.notion_page_id,
          creative_id,
          full_creative_name,
          cta,
          processed_at: new Date().toISOString(),
        });
      }

      if (dryRun) {
        return new Response(JSON.stringify({ success: true, dryRun: true, rows, issues, count: rows.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (rows.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "No valid rows to upsert", issues }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: upsertErr } = await supabase
        .from("creative_variations")
        .upsert(rows, { onConflict: "submission_id,variation_index" });
      if (upsertErr) {
        return new Response(JSON.stringify({ success: false, error: upsertErr.message, issues }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, dryRun: false, count: rows.length, issues }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: listAll submissions (latest first)
    const { data: items, error: listErr2 } = await supabase
      .from("creative_submissions")
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
    console.error("admin-actions error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});