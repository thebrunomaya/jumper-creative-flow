import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers para invocação web
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IDs dos databases do Notion
const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c"; // Managers

// Helpers para extrair dados das propriedades do Notion
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

function extractEmail(prop: any): string {
  if (!prop) return "";
  if (prop.email) return String(prop.email).toLowerCase();
  return extractText(prop).toLowerCase();
}

function extractPhone(prop: any): string {
  if (!prop) return "";
  if (prop.phone_number) return String(prop.phone_number);
  return extractText(prop);
}

function extractUrl(prop: any): string {
  if (!prop) return "";
  if (prop.url) return String(prop.url);
  return extractText(prop);
}

function extractDate(prop: any): string {
  if (!prop) return "";
  if (prop.date && prop.date.start) return String(prop.date.start);
  return extractText(prop);
}

function extractMultiSelect(prop: any): string {
  if (!prop) return "";
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((s: any) => String(s?.name)).filter(Boolean).join(", ");
  }
  return extractText(prop);
}

function extractRelation(prop: any): string {
  if (!prop) return "";
  if (prop.relation && Array.isArray(prop.relation)) {
    return prop.relation.map((r: any) => r.id).filter(Boolean).join(", ");
  }
  return extractText(prop);
}

// Função para processar uma página de gerente do Notion
function processManagerPage(page: any): any {
  const notion_id: string = page.id;
  const props = page.properties || {};
  
  // Mapeamento usando EXATAMENTE os nomes das colunas da tabela
  return {
    notion_id,
    
    // Usar os nomes EXATOS das colunas da tabela
    "Nome": extractText(props["Nome"]),
    "E-Mail": extractEmail(props["E-Mail"]),
    "Telefone": extractPhone(props["Telefone"]),
    "Função": extractMultiSelect(props["Função"]),
    "Contas": extractRelation(props["Contas"]),
    "Organização": extractRelation(props["Organização"]),
    "Senha": extractText(props["Senha"]),
    "Softr Link": extractUrl(props["Softr Link"]),
    "Softr Date Created": extractDate(props["Softr Date Created"]),
    "Softr Last Login": extractDate(props["Softr Last Login"]),
  };
}

// Função para buscar todas as páginas de um database do Notion
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

    // Client do usuário para verificar auth e role
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é admin
    const { data: isAdmin, error: roleErr } = await userClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Log do início da sincronização
    const syncStartTime = new Date().toISOString();
    await service.from('j_hub_notion_sync_logs').insert({
      sync_type: 'complete_managers_sync',
      status: 'started',
      message: 'Complete Managers sync started',
      timestamp: syncStartTime
    });

    // Buscar dados do Notion
    console.log('Fetching managers from Notion...');
    const managerPages = await fetchAllFromNotionDatabase(DB_GERENTES_ID, NOTION_TOKEN);
    console.log(`Fetched ${managerPages.length} manager pages`);

    // Processar gerentes
    const managersData: any[] = [];
    for (const page of managerPages) {
      try {
        const managerData = processManagerPage(page);
        if (managerData["E-Mail"]) { // Só inclui se tem email
          managersData.push(managerData);
        }
      } catch (error) {
        console.error('Error processing manager page:', page.id, error);
        // Continua com as outras páginas
      }
    }

    console.log(`Processed ${managersData.length} valid managers`);

    // Fazer upsert na tabela
    let upsertResult;
    if (managersData.length > 0) {
      const { data, error: upsertErr } = await service
        .from('j_hub_notion_db_managers')
        .upsert(managersData, { onConflict: 'notion_id' });
      
      if (upsertErr) {
        console.error('Upsert error:', upsertErr);
        throw upsertErr;
      }
      upsertResult = data;
    }

    // Log do sucesso
    const syncEndTime = new Date().toISOString();
    await service.from('j_hub_notion_sync_logs').insert({
      sync_type: 'complete_managers_sync',
      status: 'completed',
      message: `Managers sync completed: ${managersData.length} managers processed`,
      timestamp: syncEndTime,
      managers_processed: managersData.length
    });

    const result = {
      ok: true,
      synced: {
        managers: managersData.length,
        total_properties: 10,
        start_time: syncStartTime,
        end_time: syncEndTime
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Complete managers sync error:', err?.message || err);
    
    // Log do erro
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        await service.from('j_hub_notion_sync_logs').insert({
          sync_type: 'complete_managers_sync',
          status: 'error',
          message: err?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
    }
    
    return new Response(JSON.stringify({ ok: false, error: err?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});