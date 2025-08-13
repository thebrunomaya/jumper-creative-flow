import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for web invocation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Notion database IDs (provided by user)
const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c"; // Managers
const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1";    // Accounts

// Helpers to extract data from Notion properties
function extractText(prop: any): string {
  if (!prop) return "";
  if (typeof prop === "string") return prop;
  if (prop.title && Array.isArray(prop.title) && prop.title.length > 0) {
    return String(prop.title[0]?.plain_text || "");
  }
  if (prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
    return String(prop.rich_text[0]?.plain_text || "");
  }
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
  if (prop.select && prop.select.name) return String(prop.select.name);
  if (prop.status && prop.status.name) return String(prop.status.name);
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((s: any) => s?.name).filter(Boolean).join(", ");
  }
  return extractText(prop);
}

function extractMultiSelect(prop: any): string[] {
  if (!prop) return [];
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((s: any) => String(s?.name)).filter(Boolean);
  }
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
  // remove accents basic
  const n = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (["admin", "administrador", "administradora"].includes(n)) return "admin";
  if (["gestor", "gestora"].includes(n)) return "gestor";
  if (["supervisor", "supervisora"].includes(n)) return "supervisor";
  if (["gerente", "gerencia"].includes(n)) return "gerente";
  return (n as any);
}

async function fetchAllFromNotionDatabase(databaseId: string, notionToken: string): Promise<any[]> {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  let has_more = true;
  let start_cursor: string | undefined = undefined;
  const all: any[] = [];

  while (has_more) {
    const body: any = {};
    if (start_cursor) body.start_cursor = start_cursor;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Notion query failed ${res.status}: ${t}`);
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    all.push(...results);
    has_more = !!data.has_more;
    start_cursor = data.next_cursor || undefined;
  }

  return all;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Supabase env not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!NOTION_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'NOTION_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User client to get auth user and check role via RPC
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Allow sync if user is Supabase admin OR Notion admin (by email)
    let canSync = false;
    let managerPagesCache: any[] | null = null;

    const { data: isAdmin, error: roleErr } = await userClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!roleErr && isAdmin) {
      canSync = true;
    } else {
      // Fallback: check Notion role by email
      managerPagesCache = await fetchAllFromNotionDatabase(DB_GERENTES_ID, NOTION_TOKEN);
      const targetEmail = (user.email || '').toLowerCase();
      const notionAdmin = managerPagesCache.find((p: any) => {
        const props = p.properties || {};
        const email = extractEmail(props);
        const roleProp = props['Função'] || props['Funcao'] || props['Role'] || props['Cargo'];
        const roleName = extractSelectName(roleProp);
        const role = normalizeRole(roleName);
        return email === targetEmail && role === 'admin';
      });
      canSync = !!notionAdmin;
    }

    if (!canSync) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch Notion data
    const [managerPages, accountPages] = await Promise.all([
      fetchAllFromNotionDatabase(DB_GERENTES_ID, NOTION_TOKEN),
      fetchAllFromNotionDatabase(DB_CONTAS_ID, NOTION_TOKEN),
    ]);

    // Prepare accounts map for quick check
    const accountsUpserts: any[] = [];
    let accountsSkipped = 0;

    for (const page of accountPages) {
      const notion_id: string = page.id;
      const props = page.properties || {};
      const name = extractText(props['Name'] || props['Nome'] || props['Título'] || props['Title']);

      // Attempt to get ad account id from common fields
      const adIdRaw = props['Ad Account ID'] || props['ad_account_id'] || props['Conta de Anúncios'] || props['ID Conta'] || props['ContaID'] || props['AdAccount'];
      let ad_account_id = extractText(adIdRaw);

      if (!ad_account_id) {
        // As a last resort, allow using the Notion ID to satisfy NOT NULL, but mark skipped if still empty
        ad_account_id = notion_id;
      }

      if (!name || !ad_account_id) {
        accountsSkipped++;
        continue;
      }

      const status = extractSelectName(props['Status'] || props['Situação']);
      const objectives = extractMultiSelect(props['Objetivos'] || props['Objectives']);
      const manager = extractText(props['Manager'] || props['Gerente'] || props['Gestor']);

      accountsUpserts.push({
        notion_id,
        name,
        ad_account_id,
        status: status || null,
        objectives: objectives?.length ? objectives : undefined,
        manager: manager || null,
      });
    }

    // Upsert accounts by notion_id
    let accountsResult: any = { count: 0 };
    if (accountsUpserts.length > 0) {
      const { error: accErr } = await service
        .from('accounts')
        .upsert(accountsUpserts, { onConflict: 'notion_id' });
      if (accErr) throw accErr;
      accountsResult.count = accountsUpserts.length;
    }

    // Prepare managers and links
    const managersUpserts: any[] = [];
    const links: Array<{ manager_notion_id: string; account_notion_id: string }> = [];

    for (const page of managerPages) {
      const notion_id: string = page.id;
      const props = page.properties || {};

      const email = extractEmail(props);
      const name = extractText(props['Name'] || props['Nome'] || props['Título'] || props['Title']);
      const roleProp = props['Função'] || props['Funcao'] || props['Role'] || props['Cargo'];
      const roleName = extractSelectName(roleProp);
      const role = normalizeRole(roleName);

      if (!email || !role) {
        // skip invalid
        continue;
      }

      managersUpserts.push({ notion_id, email, name: name || null, role });

      // relations to accounts
      const contasRel = props['Contas'] || props['contas'] || props['Accounts'];
      const accountRelIds = extractRelations(contasRel);
      for (const accId of accountRelIds) {
        links.push({ manager_notion_id: notion_id, account_notion_id: accId });
      }
    }

    // Upsert managers
    let managersResult: any = { count: 0 };
    if (managersUpserts.length > 0) {
      const { error: manErr } = await service
        .from('notion_managers')
        .upsert(managersUpserts, { onConflict: 'notion_id' });
      if (manErr) throw manErr;
      managersResult.count = managersUpserts.length;
    }

    // Build map notion_id -> id
    const uniqManagerNotionIds = Array.from(new Set(managersUpserts.map(m => m.notion_id)));
    const { data: managerRows, error: mapErr } = await service
      .from('notion_managers')
      .select('id, notion_id')
      .in('notion_id', uniqManagerNotionIds);
    if (mapErr) throw mapErr;
    const managerIdByNotion: Record<string, string> = Object.fromEntries((managerRows || []).map((r: any) => [r.notion_id, r.id]));

    // Replace links per manager
    let linksInserted = 0;
    if (uniqManagerNotionIds.length > 0) {
      const managerIds = uniqManagerNotionIds.map(nid => managerIdByNotion[nid]).filter(Boolean);
      if (managerIds.length > 0) {
        // delete existing links for these managers
        const { error: delErr } = await service
          .from('notion_manager_accounts')
          .delete()
          .in('manager_id', managerIds);
        if (delErr) throw delErr;

        // insert new links
        const linkRows = links
          .map(l => ({ manager_id: managerIdByNotion[l.manager_notion_id], account_notion_id: l.account_notion_id }))
          .filter(r => !!r.manager_id && !!r.account_notion_id);

        if (linkRows.length > 0) {
          const { error: insErr } = await service
            .from('notion_manager_accounts')
            .insert(linkRows);
          if (insErr) throw insErr;
          linksInserted = linkRows.length;
        }
      }
    }

    const result = {
      ok: true,
      synced: {
        accounts: accountsResult.count,
        managers: managersResult.count,
        links: linksInserted,
        accountsSkipped,
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('notion-sync error:', err?.message || err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
