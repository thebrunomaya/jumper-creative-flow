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
  const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c"; // same DB used elsewhere

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
    const action = body?.action || "listMy";

    // JWT-based authentication and role check (manager or admin)
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
    const { data: isManager } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'manager' });
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isManager && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const managerId = user.id as string;
    const supabase = adminClient;

    if (action === "listMy") {
      const { data, error } = await supabase
        .from("creative_submissions")
        .select("id, client, manager_id, status, created_at, updated_at, result")
        .eq("manager_id", managerId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Best-effort enrichment of client names
      const clientIds = Array.from(new Set((data || []).map((r: any) => r.client).filter(Boolean))).slice(0, 30);
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
        } catch (_) {}
      }

      const enriched = (data || []).map((r: any) => ({ ...r, client_name: r.client ? clientMap[r.client] || null : null }));
      return new Response(JSON.stringify({ success: true, items: enriched }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      const submissionId = body?.submissionId as string | undefined;
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase
        .from("creative_submissions")
        .select("id, manager_id, payload, status")
        .eq("id", submissionId)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: error?.message || "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (data.manager_id !== managerId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, item: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "saveDraft") {
      const submissionId = body?.submissionId as string | undefined;
      const draft = body?.draft || {};

      // sanitize draft (avoid storing gigantic files or base64)
      if (draft && draft.files) delete draft.files;
      if (draft && draft.validatedFiles) draft.validatedFiles = [];
      if (draft && draft.mediaVariations) {
        try {
          draft.mediaVariations = (draft.mediaVariations || []).map((v: any) => ({
            id: v?.id,
            squareEnabled: v?.squareEnabled,
            verticalEnabled: v?.verticalEnabled,
            horizontalEnabled: v?.horizontalEnabled,
            squareFile: undefined,
            verticalFile: undefined,
            horizontalFile: undefined,
          }));
        } catch (_) {}
      }

      const baseRow = {
        user_id: managerId,
        manager_id: managerId,
        client: draft?.client ?? null,
        partner: draft?.partner ?? null,
        platform: draft?.platform ?? null,
        creative_type: draft?.creativeType ?? null,
        campaign_objective: draft?.campaignObjective ?? null,
        payload: draft ?? {},
        status: "draft" as const,
      };

      if (!submissionId) {
        // Try to find existing draft by creativeName for this manager
        const creativeName = (draft?.creativeName || '').trim();
        let targetId: string | null = null;
        if (creativeName) {
          const { data: existing } = await supabase
            .from('creative_submissions')
            .select('id')
            .eq('manager_id', managerId)
            .eq('status', 'draft')
            .filter('payload->>creativeName', 'eq', creativeName)
            .maybeSingle();
          if (existing?.id) targetId = existing.id as string;
        }

        if (targetId) {
          const { error } = await supabase
            .from('creative_submissions')
            .update(baseRow as any)
            .eq('id', targetId)
            .eq('manager_id', managerId);
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ success: true, submissionId: targetId }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const { data, error } = await supabase
            .from('creative_submissions')
            .insert(baseRow as any)
            .select('id')
            .single();
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ success: true, submissionId: data.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        const { error } = await supabase
          .from('creative_submissions')
          .update(baseRow as any)
          .eq('id', submissionId)
          .eq('manager_id', managerId);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true, submissionId }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manager-actions error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
