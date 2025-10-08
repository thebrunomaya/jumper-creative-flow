import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers para invocação web
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IDs dos databases do Notion (fornecidos pelo usuário)
const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c"; // Managers
const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1";    // Accounts

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
  // Handle unique_id type
  if (prop.unique_id && typeof prop.unique_id.number === "number") {
    return `JS${prop.unique_id.number}`;
  }
  return "";
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

function extractNumber(prop: any): number | null {
  if (!prop) return null;
  if (typeof prop.number === "number") return prop.number;
  const txt = extractText(prop);
  const num = parseFloat(txt);
  return isNaN(num) ? null : num;
}

function extractMultiSelect(prop: any): string {
  if (!prop) return "";
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((s: any) => String(s?.name)).filter(Boolean).join(", ");
  }
  return extractText(prop);
}

function extractPeople(prop: any): string {
  if (!prop) return "";
  if (prop.people && Array.isArray(prop.people)) {
    // Extract names for display purposes
    // Notion returns: { id, name, person: { email } }
    return prop.people
      .map((p: any) => {
        // Use name for display
        return p.name || p.person?.email || p.id;
      })
      .filter(Boolean)
      .join(", ");
  }
  return extractText(prop);
}

// NEW: Extract emails separately for OAuth matching
function extractPeopleEmails(prop: any): string {
  if (!prop) return "";
  if (prop.people && Array.isArray(prop.people)) {
    return prop.people
      .map((p: any) => p.person?.email)
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function extractRelation(prop: any): string {
  if (!prop) return "";
  if (prop.relation && Array.isArray(prop.relation)) {
    // Return IDs - will be resolved to names later
    return prop.relation.map((r: any) => r.id).filter(Boolean).join(", ");
  }
  return extractText(prop);
}

// Helper to fetch page names from Notion by IDs
async function resolveRelationNames(relationIds: string, notionToken: string): Promise<string> {
  if (!relationIds) return "";

  const ids = relationIds.split(",").map(id => id.trim()).filter(Boolean);
  if (ids.length === 0) return "";

  const names: string[] = [];

  for (const pageId of ids) {
    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      });

      if (response.ok) {
        const page = await response.json();
        // Extract title from page properties
        const titleProp = Object.values(page.properties || {}).find((prop: any) => prop?.type === 'title');
        if (titleProp && titleProp.title && Array.isArray(titleProp.title) && titleProp.title[0]?.plain_text) {
          names.push(titleProp.title[0].plain_text);
        } else {
          // Fallback: keep the ID if we can't find the title
          names.push(pageId);
        }
      } else {
        console.error(`Failed to fetch page ${pageId}: ${response.status} ${response.statusText}`);
        names.push(pageId); // Fallback to ID
      }
    } catch (error) {
      console.error(`Error fetching page ${pageId}:`, error);
      names.push(pageId); // Fallback to ID on error
    }
  }

  return names.join(", ");
}

function extractEmail(prop: any): string {
  if (!prop) return "";
  if (prop.email) return String(prop.email).toLowerCase();
  return extractText(prop).toLowerCase();
}

function extractUrl(prop: any): string {
  if (!prop) return "";
  if (prop.url) return String(prop.url);
  return extractText(prop);
}

function extractCheckbox(prop: any): boolean {
  if (!prop) return false;
  if (typeof prop.checkbox === "boolean") return prop.checkbox;
  return false;
}

function extractDate(prop: any): string {
  if (!prop) return "";
  if (prop.date && prop.date.start) return String(prop.date.start);
  return extractText(prop);
}

function extractTasksAsJson(prop: any): string {
  if (!prop) return "";
  // Se for rich_text, retorna como string
  const text = extractText(prop);
  if (text) {
    try {
      // Tenta parsear como JSON, se não conseguir, retorna como texto
      JSON.parse(text);
      return text;
    } catch {
      return text;
    }
  }
  // Se for outro tipo de propriedade, tenta extrair o conteúdo
  if (Array.isArray(prop.rich_text)) {
    return prop.rich_text.map((rt: any) => rt?.plain_text || "").join("");
  }
  return "";
}

// Função para processar uma página de conta do Notion
function processAccountPage(page: any): any {
  const notion_id: string = page.id;
  const props = page.properties || {};
  
  // Mapeamento usando EXATAMENTE os nomes das colunas da tabela
  return {
    notion_id,
    
    // Usar os nomes EXATOS das colunas da tabela
    "ID": extractText(props["ID"]),
    "Conta": extractText(props["Conta"]),
    "Status": extractSelectName(props["Status"]),
    "Tier": extractNumber(props["Tier"]),
    "Nicho": extractMultiSelect(props["Nicho"]),
    "Objetivos": extractMultiSelect(props["Objetivos"]),
    "Plataformas": extractMultiSelect(props["Plataformas"]),
    "Rastreamento": extractMultiSelect(props["Rastreamento"]),
    "Gestor": extractPeople(props["Gestor"]), // Names for display
    "Gestor Email": extractPeopleEmails(props["Gestor"]), // Emails for OAuth matching
    "Supervisor": extractPeople(props["Supervisor"]), // Names for display
    "Supervisor Email": extractPeopleEmails(props["Supervisor"]), // Emails for OAuth matching
    "Parceiro": extractRelation(props["Parceiro"]),
    "Gerente": extractRelation(props["Gerente"]),
    "Canal SoWork": extractText(props["Canal SoWork"]),
    "Método de Pagamento": extractSelectName(props["Método de Pagamento"]),
    "META: Verba Mensal": extractText(props["META: Verba Mensal"]),
    "G-ADS: Verba Mensal": extractText(props["G-ADS: Verba Mensal"]),
    "TIK: Verba Mensal": extractText(props["TIK: Verba Mensal"]),
    "ID Meta Ads": extractText(props["ID Meta Ads"]),
    "ID Google Ads": extractText(props["ID Google Ads"]),
    "ID Tiktok Ads": extractText(props["ID Tiktok Ads"]),
    "ID Google Analytics": extractText(props["ID Google Analytics"]),
    "Link Meta": extractText(props["Link Meta"]),
    "Canal Slack": extractText(props["Canal Slack"]),
    "✅ Tarefas": extractTasksAsJson(props["✅ Tarefas"]),
    "Woo Consumer Secret": extractText(props["Woo Consumer Secret"]),
    "Woo Consumer Key": extractText(props["Woo Consumer Key"]),
    "Antecedência (Boleto)": extractText(props["Antecedência (Boleto)"]),
    "Vencimento Ideal (Boleto)": extractText(props["Vencimento Ideal (Boleto)"]),
    "Site Oficial": extractUrl(props["Site Oficial"]),
    "Link da pasta do Google Drive com criativos e materiais.": extractUrl(props["Link da pasta do Google Drive com criativos e materiais."]),
    "Link da logo ": extractUrl(props["Link da logo "]),
    "Link do Instagram da empresa.": extractUrl(props["Link do Instagram da empresa."]),
    "Segmento de atuação": extractText(props["Segmento de atuação"]),
    "História e Propósito": extractText(props["História e Propósito"]),
    "Quais são os produtos/serviços que deseja divulgar?": extractText(props["Quais são os produtos/serviços que deseja divulgar?"]),
    "Quem é o cliente ideal? (Persona)": extractText(props["Quem é o cliente ideal? (Persona)"]),
    "Existem perfis diferentes para cada produto/serviço? Quais?": extractText(props["Existem perfis diferentes para cada produto/serviço? Quais?"]),
    "Existem perfis de clientes diferentes para cada produto/serviç": extractText(props["Existem perfis de clientes diferentes para cada produto/serviç"]),
    "Regiões onde deseja atrair clientes?": extractText(props["Regiões onde deseja atrair clientes?"]),
    "Como os clientes pesquisam esses produtos/serviços no Google?": extractText(props["Como os clientes pesquisam esses produtos/serviços no Google?"]),
    "Qual é a transformação ou resultado que esse cliente busca a": extractText(props["Qual é a transformação ou resultado que esse cliente busca a"]),
    "Quais são as maiores dores e objeções desses clientes?": extractText(props["Quais são as maiores dores e objeções desses clientes?"]),
    "O que normalmente impede esse cliente de fechar com você?": extractText(props["O que normalmente impede esse cliente de fechar com você?"]),
    "Seus principais diferenciais competitivos.": extractText(props["Seus principais diferenciais competitivos."]),
    "Principais concorrentes (Nomes ou links)": extractText(props["Principais concorrentes (Nomes ou links)"]),
    "Ticket médio atual (valor médio por venda ou contrato).": extractText(props["Ticket médio atual (valor médio por venda ou contrato)."]),
    "Qual o investimento mensal disponível para anúncios?": extractText(props["Qual o investimento mensal disponível para anúncios?"]),
    "Qual a principal meta da empresa para os próximos 12 meses?": extractText(props["Qual a principal meta da empresa para os próximos 12 meses?"]),
    "Meta do Mês": extractText(props["Meta do Mês"]),
    "Tem alguma meta de marketing clara (KPIs)?": extractText(props["Tem alguma meta de marketing clara (KPIs)?"]),
    "Já anunciaram antes? Onde e como foi?": extractText(props["Já anunciaram antes? Onde e como foi?"]),
    "Quais estratégias anteriores funcionaram melhor?": extractText(props["Quais estratégias anteriores funcionaram melhor?"]),
    "Já possuem identidade visual e logo?": extractText(props["Já possuem identidade visual e logo?"]),
    "Já possuem banco de imagens, vídeos ou portfólio?": extractText(props["Já possuem banco de imagens, vídeos ou portfólio?"]),
    "Vocês usam alguma ferramenta de CRM ou automação de marketin": extractText(props["Vocês usam alguma ferramenta de CRM ou automação de marketin"]),
    "Possuem lista de contatos para remarketing ou e-mail marketing?": extractText(props["Possuem lista de contatos para remarketing ou e-mail marketing?"]),
    "Endereço da Empresa.": extractText(props["Endereço da Empresa."]),
    "(Projeto) E-mail profissional do responsável pelo projeto.": extractText(props["(Projeto) E-mail profissional do responsável pelo projeto."]),
    "(Projeto) Telefone ou WhatsApp do responsável pelo projeto.": extractText(props["(Projeto) Telefone ou WhatsApp do responsável pelo projeto."]),
    "(Projetos) Cargo do responsável pelo projeto.": extractText(props["(Projetos) Cargo do responsável pelo projeto."]),
    "(Projetos) Nome do responsável pelo projeto.": extractText(props["(Projetos) Nome do responsável pelo projeto."]),
    "(Venda)E-mail profissional do responsável pela área comercial": extractText(props["(Venda)E-mail profissional do responsável pela área comercial"]),
    "(Vendas) Cargo do responsável pela área comercial/vendas.": extractText(props["(Vendas) Cargo do responsável pela área comercial/vendas."]),
    "(Vendas) Nome do responsável pela área comercial/vendas.": extractText(props["(Vendas) Nome do responsável pela área comercial/vendas."]),
    "(Vendas)Telefone ou WhatsApp do responsável pela área comerci": extractText(props["(Vendas)Telefone ou WhatsApp do responsável pela área comerci"]),
    "META: Saldo": extractText(props["META: Saldo"]),
    "META: Saldo Em Dias": extractText(props["META: Saldo Em Dias"]),
    "META: Fim do Saldo": extractText(props["META: Fim do Saldo"]),
    "META: Fim do Saldo (1)": extractText(props["META: Fim do Saldo (1)"]),
    "META: Última Checagem": extractText(props["META: Última Checagem"]),
    "G-ADS: Saldo": extractText(props["G-ADS: Saldo"]),
    "G-ADS: Saldo Em Dias": extractText(props["G-ADS: Saldo Em Dias"]),
    "G-ADS: Fim do Saldo": extractText(props["G-ADS: Fim do Saldo"]),
    "G-ADS: Última Checagem": extractText(props["G-ADS: Última Checagem"]),
    "Contexto para Otimização": extractText(props["Contexto para Otimização"]),
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
    await service.from('j_ads_notion_sync_logs').insert({
      sync_type: 'complete_sync',
      status: 'started',
      message: 'Complete Notion sync started',
      timestamp: syncStartTime
    });

    // Buscar dados do Notion
    console.log('Fetching accounts from Notion...');
    const accountPages = await fetchAllFromNotionDatabase(DB_CONTAS_ID, NOTION_TOKEN);
    console.log(`Fetched ${accountPages.length} account pages`);

    // Processar contas
    const accountsData: any[] = [];
    for (const page of accountPages) {
      try {
        const accountData = processAccountPage(page);
        if (accountData.Conta) { // Só inclui se tem nome da conta
          accountsData.push(accountData);
        }
      } catch (error) {
        console.error('Error processing account page:', page.id, error);
        // Continua com as outras páginas
      }
    }

    console.log(`Processed ${accountsData.length} valid accounts`);

    // TODO: Resolve Gerente relation IDs to names
    // Disabled temporarily to avoid sync timeout
    // Will implement as separate background job
    console.log('Skipping Gerente name resolution (keeping IDs for now)');

    // Fazer upsert na tabela
    let upsertResult;
    if (accountsData.length > 0) {
      const { data, error: upsertErr } = await service
        .from('j_ads_notion_db_accounts')
        .upsert(accountsData, { onConflict: 'notion_id' });

      if (upsertErr) {
        console.error('Upsert error:', upsertErr);
        throw upsertErr;
      }
      upsertResult = data;
    }

    // Log do sucesso
    const syncEndTime = new Date().toISOString();
    await service.from('j_ads_notion_sync_logs').insert({
      sync_type: 'complete_sync',
      status: 'completed',
      message: `Sync completed: ${accountsData.length} accounts processed`,
      timestamp: syncEndTime,
      accounts_processed: accountsData.length
    });

    const result = {
      ok: true,
      synced: {
        accounts: accountsData.length,
        total_properties: 75,
        start_time: syncStartTime,
        end_time: syncEndTime
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Complete notion sync error:', err?.message || err);
    
    // Log do erro
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        await service.from('j_ads_notion_sync_logs').insert({
          sync_type: 'complete_sync',
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