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

    // Default: list pending submissions
    const { data: pending, error: listErr } = await supabase
      .from("creative_submissions")
      .select("id, client, platform, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (listErr) {
      return new Response(JSON.stringify({ error: listErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, pending }), {
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