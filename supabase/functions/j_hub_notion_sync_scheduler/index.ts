import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for web invocation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Notion database ID for complete accounts sync
const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1";

// Helper functions for extracting data from Notion properties
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

function extractMultiSelect(prop: any): string {
  if (!prop) return "";
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((s: any) => String(s?.name)).filter(Boolean).join(", ");
  }
  const txt = extractText(prop);
  return txt;
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
  if (prop.formula && typeof prop.formula.number === "number") return prop.formula.number;
  return null;
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

function processNotionAccount(page: any): any {
  const props = page.properties || {};

  return {
    // Usar nomes EXATOS das colunas da tabela (que coincidem com CSV)
    "ID": extractText(props["ID"]),
    "Conta": extractText(props["Conta"]),
    "Status": extractSelectName(props["Status"]),
    "Tier": extractNumber(props["Tier"]),
    "Nicho": extractMultiSelect(props["Nicho"]),
    "Objetivos": extractMultiSelect(props["Objetivos"]),
    "Plataformas": extractMultiSelect(props["Plataformas"]),
    "Rastreamento": extractMultiSelect(props["Rastreamento"]),
    "Gestor": extractText(props["Gestor"]),
    "Supervisor": extractText(props["Supervisor"]),
    "Parceiro": extractText(props["Parceiro"]),
    "Gerente": extractText(props["Gerente"]),
    "Canal SoWork": extractText(props["Canal SoWork"]), // *** CAMPO CRÍTICO ***
    "Método de Pagamento": extractSelectName(props["Método de Pagamento"]),
    "META: Verba Mensal": extractText(props["META: Verba Mensal"]),
    "G-ADS: Verba Mensal": extractText(props["G-ADS: Verba Mensal"]),
    "TIK: Verba Mensal": extractText(props["TIK: Verba Mensal"]),
    "ID Meta Ads": extractText(props["ID Meta Ads"]),
    "ID Google Ads": extractText(props["ID Google Ads"]),
    "ID Tiktok Ads": extractText(props["ID Tiktok Ads"]),
    "ID Google Analytics": extractText(props["ID Google Analytics"]),
    "Link Meta": extractText(props["Link Meta"]),

    // Campos avançados (usando nomes exatos)
    "Canal Slack": extractText(props["Canal Slack"]),
    "✅ Tarefas": extractText(props["✅ Tarefas"]),
    "Woo Consumer Secret": extractText(props["Woo Consumer Secret"]),
    "Woo Consumer Key": extractText(props["Woo Consumer Key"]),
    
    // Campos de projeto/responsável
    "(Projeto) E-mail profissional do responsável pelo projeto.": extractText(props["(Projeto) E-mail profissional do responsável pelo projeto."]),
    "(Projeto) Telefone ou WhatsApp do responsável pelo projeto.": extractText(props["(Projeto) Telefone ou WhatsApp do responsável pelo projeto."]),
    "(Projetos) Cargo do responsável pelo projeto.": extractText(props["(Projetos) Cargo do responsável pelo projeto."]),
    "(Projetos) Nome do responsável pelo projeto.": extractText(props["(Projetos) Nome do responsável pelo projeto."]),
    
    // Campos de vendas/comercial  
    "(Venda)E-mail profissional do responsável pela área comercial/vendas.": extractText(props["(Venda)E-mail profissional do responsável pela área comercial/vendas."]),
    "(Vendas) Cargo do responsável pela área comercial/vendas.": extractText(props["(Vendas) Cargo do responsável pela área comercial/vendas."]),
    "(Vendas) Nome do responsável pela área comercial/vendas.": extractText(props["(Vendas) Nome do responsável pela área comercial/vendas."]),
    "(Vendas)Telefone ou WhatsApp do responsável pela área comercial/vendas.": extractText(props["(Vendas)Telefone ou WhatsApp do responsável pela área comercial/vendas."]),
    
    // Campos de briefing estratégico
    "Como os clientes pesquisam esses produtos/serviços no Google?": extractText(props["Como os clientes pesquisam esses produtos/serviços no Google?"]),
    "Endereço da Empresa.": extractText(props["Endereço da Empresa."]),
    "Existem perfis de clientes diferentes para cada produto/serviço? Quais?": extractText(props["Existem perfis de clientes diferentes para cada produto/serviço? Quais?"]),
    "Existem perfis diferentes para cada produto/serviço? Quais?": extractText(props["Existem perfis diferentes para cada produto/serviço? Quais?"]),
    "História e Propósito": extractText(props["História e Propósito"]),
    "Já anunciaram antes? Onde e como foi?": extractText(props["Já anunciaram antes? Onde e como foi?"]),
    "Já possuem banco de imagens, vídeos ou portfólio?": extractText(props["Já possuem banco de imagens, vídeos ou portfólio?"]),
    "Já possuem identidade visual e logo?": extractText(props["Já possuem identidade visual e logo?"]),
    "Link da logo ": extractText(props["Link da logo "]),
    "Link da pasta do Google Drive com criativos e materiais.": extractText(props["Link da pasta do Google Drive com criativos e materiais."]),
    "Link do Instagram da empresa.": extractText(props["Link do Instagram da empresa."]),
    "O que normalmente impede esse cliente de fechar com você?": extractText(props["O que normalmente impede esse cliente de fechar com você?"]),
    "Possuem lista de contatos para remarketing ou e-mail marketing?": extractText(props["Possuem lista de contatos para remarketing ou e-mail marketing?"]),
    "Principais concorrentes (Nomes ou links)": extractText(props["Principais concorrentes (Nomes ou links)"]),
    "Quais estratégias anteriores funcionaram melhor?": extractText(props["Quais estratégias anteriores funcionaram melhor?"]),
    "Quais são as maiores dores e objeções desses clientes?": extractText(props["Quais são as maiores dores e objeções desses clientes?"]),
    "Quais são os produtos/serviços que deseja divulgar?": extractText(props["Quais são os produtos/serviços que deseja divulgar?"]),
    "Qual a principal meta da empresa para os próximos 12 meses?": extractText(props["Qual a principal meta da empresa para os próximos 12 meses?"]),
    "Qual o investimento mensal disponível para anúncios?": extractText(props["Qual o investimento mensal disponível para anúncios?"]),
    "Qual é a transformação ou resultado que esse cliente busca ao contratar você?": extractText(props["Qual é a transformação ou resultado que esse cliente busca ao contratar você?"]),
    "Quem é o cliente ideal? (Persona)": extractText(props["Quem é o cliente ideal? (Persona)"]),
    "Regiões onde deseja atrair clientes?": extractText(props["Regiões onde deseja atrair clientes?"]),
    "Segmento de atuação": extractText(props["Segmento de atuação"]),
    "Seus principais diferenciais competitivos.": extractText(props["Seus principais diferenciais competitivos."]),
    "Site Oficial": extractText(props["Site Oficial"]),
    "Tem alguma meta de marketing clara (KPIs)?": extractText(props["Tem alguma meta de marketing clara (KPIs)?"]),
    "Ticket médio atual (valor médio por venda ou contrato).": extractText(props["Ticket médio atual (valor médio por venda ou contrato)."]),
    "Vocês usam alguma ferramenta de CRM ou automação de marketing? Qual?": extractText(props["Vocês usam alguma ferramenta de CRM ou automação de marketing? Qual?"]),
    
    // Campos financeiros/orçamentários
    "G-ADS: Fim do Saldo": extractText(props["G-ADS: Fim do Saldo"]),
    "G-ADS: Saldo": extractText(props["G-ADS: Saldo"]),
    "G-ADS: Saldo Em Dias": extractText(props["G-ADS: Saldo Em Dias"]),
    "G-ADS: Última Checagem": extractText(props["G-ADS: Última Checagem"]),
    "META: Fim do Saldo": extractText(props["META: Fim do Saldo"]),
    "META: Fim do Saldo (1)": extractText(props["META: Fim do Saldo (1)"]),
    "META: Saldo": extractText(props["META: Saldo"]),
    "META: Saldo Em Dias": extractText(props["META: Saldo Em Dias"]),
    "META: Última Checagem": extractText(props["META: Última Checagem"]),
    "Antecedência (Boleto)": extractText(props["Antecedência (Boleto)"]),
    "Meta do Mês": extractText(props["Meta do Mês"]),
    "Vencimento Ideal (Boleto)": extractText(props["Vencimento Ideal (Boleto)"])
  };
}

async function logSyncEvent(supabase: any, type: 'start' | 'success' | 'error', message: string, details?: any) {
  try {
    await supabase
      .from('j_ads_notion_sync_logs')
      .insert({
        event_type: type,
        message,
        details: details ? JSON.stringify(details) : null,
        timestamp: new Date().toISOString()
      });
  } catch (err) {
    console.error('Failed to log sync event:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment not configured');
    }
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_API_KEY not configured');
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Log start of sync
    await logSyncEvent(service, 'start', 'Scheduled Notion sync started');

    // Check if request is from cron job or manual trigger
    const triggerType = req.headers.get('X-Trigger-Type') || 'manual';
    const userAgent = req.headers.get('User-Agent') || '';
    
    console.log(`🔄 Sync triggered: ${triggerType} (${userAgent})`);

    // Verify admin access for manual triggers
    if (triggerType === 'manual') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header for manual sync');
      }

      const userClient = createClient(SUPABASE_URL, authHeader.replace('Bearer ', ''));
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        throw new Error('Unauthorized user');
      }

      const { data: isAdmin, error: roleErr } = await userClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (roleErr || !isAdmin) {
        throw new Error('Admin access required for manual sync');
      }
    }

    // Fetch ALL accounts from Notion
    console.log('📥 Fetching accounts from Notion DB_Contas...');
    const accountPages = await fetchAllFromNotionDatabase(DB_CONTAS_ID, NOTION_TOKEN);
    console.log(`✅ Found ${accountPages.length} accounts in Notion`);

    // Process each account
    const accountsToUpsert: any[] = [];
    for (const page of accountPages) {
      try {
        const processed = processNotionAccount(page);
        // Add a unique identifier for conflict resolution
        processed['notion_page_id'] = page.id;
        accountsToUpsert.push(processed);
      } catch (error) {
        console.error(`❌ Error processing account ${page.id}:`, error);
      }
    }

    console.log(`⚙️ Processed ${accountsToUpsert.length} accounts`);

    // Clear existing data and insert fresh data
    const { error: deleteErr } = await service
      .from('j_ads_notion_db_accounts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteErr) {
      console.warn('Warning: Could not clear existing data:', deleteErr);
    }

    // Insert new data
    let insertedCount = 0;
    if (accountsToUpsert.length > 0) {
      // Insert in batches to avoid payload limits
      const batchSize = 100;
      for (let i = 0; i < accountsToUpsert.length; i += batchSize) {
        const batch = accountsToUpsert.slice(i, i + batchSize);
        const { error: insertErr, count } = await service
          .from('j_ads_notion_db_accounts')
          .insert(batch, { count: 'exact' });
        
        if (insertErr) {
          throw new Error(`Batch insert failed: ${insertErr.message}`);
        }
        insertedCount += count || batch.length;
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      ok: true,
      message: 'Scheduled Notion sync completed successfully',
      trigger_type: triggerType,
      duration_ms: duration,
      stats: {
        accounts_synced: insertedCount,
        accounts_processed: accountsToUpsert.length,
        accounts_found: accountPages.length
      },
      timestamp: new Date().toISOString()
    };

    // Log successful sync
    await logSyncEvent(service, 'success', `Sync completed in ${duration}ms`, result.stats);

    console.log('🎉 Sync completed:', result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorResult = {
      ok: false,
      error: err?.message || 'Unexpected error',
      duration_ms: duration,
      timestamp: new Date().toISOString()
    };

    // Try to log error (best effort)
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (SUPABASE_URL && SERVICE_ROLE_KEY) {
        const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        await logSyncEvent(service, 'error', err?.message || 'Sync failed', { duration_ms: duration });
      }
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    console.error('💥 Sync failed:', errorResult);
    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});