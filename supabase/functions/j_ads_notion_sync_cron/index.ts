import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c";
const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1";

function extractText(prop: any): string {
  if (!prop) return "";
  if (typeof prop === "string") return prop;
  if (prop.title && Array.isArray(prop.title) && prop.title.length > 0) return String(prop.title[0]?.plain_text || "");
  if (prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) return String(prop.rich_text[0]?.plain_text || "");
  if (prop.plain_text) return String(prop.plain_text);
  if (prop.name) return String(prop.name);
  if (typeof prop.number === "number") return String(prop.number);
  return "";
}
function extractEmail(props: any): string {
  const emailProp = props?.["E-Mail"] || props?.["Email"] || props?.["E-mail"] || props?.["email"];
  if (!emailProp) return "";
  if (emailProp.email) return String(emailProp.email).toLowerCase();
  const txt = extractText(emailProp);
  return (txt || "").toLowerCase();
}
function extractSelectName(prop: any): string {
  if (!prop) return "";
  if (prop.select?.name) return String(prop.select.name);
  if (prop.status?.name) return String(prop.status.name);
  if (Array.isArray(prop.multi_select)) return prop.multi_select.map((s: any) => s?.name).filter(Boolean).join(", ");
  return extractText(prop);
}
function extractMultiSelect(prop: any): string[] {
  if (!prop) return [];
  if (Array.isArray(prop.multi_select)) return prop.multi_select.map((s: any) => String(s?.name)).filter(Boolean);
  const txt = extractText(prop);
  return txt ? [txt] : [];
}
function extractRelations(prop: any): string[] {
  if (!prop || !Array.isArray(prop.relation)) return [];
  return prop.relation.map((r: any) => r?.id).filter(Boolean);
}
function normalizeRole(roleRaw: string): "admin" | "gestor" | "supervisor" | "gerente" | null {
  const s = (roleRaw || "").toString().trim().toLowerCase();
  if (!s) return null;
  const n = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (["admin","administrador","administradora"].includes(n)) return "admin";
  if (["gestor","gestora"].includes(n)) return "gestor";
  if (["supervisor","supervisora"].includes(n)) return "supervisor";
  if (["gerente","gerencia"].includes(n)) return "gerente";
  return (n as any);
}
async function fetchAllFromNotionDatabase(databaseId: string, notionToken: string): Promise<any[]> {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  let has_more = true; let start_cursor: string | undefined = undefined; const all: any[] = [];
  while (has_more) {
    const body: any = {}; if (start_cursor) body.start_cursor = start_cursor;
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${notionToken}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28', }, body: JSON.stringify(body) });
    if (!res.ok) { const t = await res.text(); throw new Error(`Notion query failed ${res.status}: ${t}`); }
    const data = await res.json(); const results = Array.isArray(data.results) ? data.results : [];
    all.push(...results); has_more = !!data.has_more; start_cursor = data.next_cursor || undefined;
  }
  return all;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY');
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const CRON_SECRET = Deno.env.get('CRON_SYNC_SECRET') || '';
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !NOTION_TOKEN || !ANON_KEY) {
      return new Response(JSON.stringify({ ok:false, error: 'Missing env configuration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cron authentication: either x-cron-secret matches, or Authorization Bearer equals the ANON key
    const headerSecret = req.headers.get('x-cron-secret') || '';
    const authHeader = req.headers.get('Authorization') || '';
    const authorized = (CRON_SECRET && headerSecret === CRON_SECRET) || (authHeader === `Bearer ${ANON_KEY}`);
    if (!authorized) {
      return new Response(JSON.stringify({ ok:false, error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const [managerPages, accountPages] = await Promise.all([
      fetchAllFromNotionDatabase(DB_GERENTES_ID, NOTION_TOKEN),
      fetchAllFromNotionDatabase(DB_CONTAS_ID, NOTION_TOKEN),
    ]);

    // Skip account processing since accounts table is not needed

    const managersUpserts: any[] = []; const links: Array<{ manager_notion_id: string; account_notion_id: string }> = [];
    for (const page of managerPages) {
      const notion_id: string = page.id; const props = page.properties || {};
      const email = extractEmail(props); const name = extractText(props['Name'] || props['Nome'] || props['Título'] || props['Title']);
      const roleProp = props['Função'] || props['Funcao'] || props['Role'] || props['Cargo'];
      const roleName = extractSelectName(roleProp); const role = normalizeRole(roleName);
      if (!email || !role) continue;
      managersUpserts.push({ notion_id, email, name: name || null, role });
      const contasRel = props['Contas'] || props['contas'] || props['Accounts'];
      const accountRelIds = extractRelations(contasRel);
      for (const accId of accountRelIds) links.push({ manager_notion_id: notion_id, account_notion_id: accId });
    }
    if (managersUpserts.length > 0) {
      const { error: manErr } = await service.from('j_ads_notion_managers').upsert(managersUpserts, { onConflict: 'notion_id' });
      if (manErr) throw manErr;
    }

    const uniqManagerNotionIds = Array.from(new Set(managersUpserts.map(m => m.notion_id)));
    const { data: managerRows, error: mapErr } = await service.from('j_ads_notion_managers').select('id, notion_id').in('notion_id', uniqManagerNotionIds);
    if (mapErr) throw mapErr;
    const managerIdByNotion: Record<string, string> = Object.fromEntries((managerRows || []).map((r: any) => [r.notion_id, r.id]));

    if (uniqManagerNotionIds.length > 0) {
      const managerIds = uniqManagerNotionIds.map(nid => managerIdByNotion[nid]).filter(Boolean);
      if (managerIds.length > 0) {
        const { error: delErr } = await service.from('j_ads_notion_accounts').delete().in('manager_id', managerIds);
        if (delErr) throw delErr;
        const linkRows = links.map(l => ({ manager_id: managerIdByNotion[l.manager_notion_id], account_notion_id: l.account_notion_id })).filter(r => !!r.manager_id && !!r.account_notion_id);
        if (linkRows.length > 0) {
          const { error: insErr } = await service.from('j_ads_notion_accounts').insert(linkRows);
          if (insErr) throw insErr;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('notion-sync-cron error:', err?.message || err);
    return new Response(JSON.stringify({ ok:false, error: err?.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
