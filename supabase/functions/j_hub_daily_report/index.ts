/**
 * j_hub_daily_report
 *
 * Edge Function that generates and sends daily performance reports via WhatsApp.
 *
 * Features:
 * - Aggregates data from WooCommerce, Meta Ads, Google Ads, and GA4
 * - Calculates KPIs: ROAS, CPA, conversion rate, ticket médio
 * - Compares with previous day and week
 * - Uses AI (Claude) to generate contextual insights
 * - Sends reports via Evolution API (WhatsApp)
 *
 * Triggered by:
 * - CRON job (daily at 8:00 BRT / 11:00 UTC)
 * - Manual POST request
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccountConfig {
  id: string;
  name: string;
  meta_ads_id: string | null;
  id_google_ads: string | null;
  id_google_analytics: string | null;
  woo_site_url: string | null;
  report_roas_target: number | null;
  report_cpa_max: number | null;
  report_conv_min: number | null;
  report_daily_target: number | null;
  report_whatsapp_numbers: string[];
}

interface DayMetrics {
  date: string;
  // Sales (WooCommerce)
  woo_sales: number;
  woo_orders: number;
  woo_avg_ticket: number;
  // Meta Ads
  meta_spend: number;
  meta_impressions: number;
  meta_clicks: number;
  meta_purchases: number;
  meta_revenue: number;
  // Google Ads
  google_spend: number;
  google_impressions: number;
  google_clicks: number;
  google_conversions: number;
  google_revenue: number;
  // GA4
  ga4_sessions: number;
  ga4_engaged_sessions: number;
  ga4_conversions: number;
  // Calculated
  total_spend: number;
  total_revenue: number;
  roas: number;
  cpa: number;
  conversion_rate: number;
  cost_per_session: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[DailyReport] Starting report generation...");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Parse optional parameters
  let specificAccountId: string | null = null;
  let testMode = false;

  try {
    if (req.method === "POST") {
      const body = await req.json();
      specificAccountId = body.account_id || null;
      testMode = body.test_mode || false;
    }
  } catch {
    // No body or invalid JSON
  }

  // 1. Fetch accounts with reports enabled
  let query = supabase
    .from("j_hub_notion_db_accounts")
    .select(`
      id,
      "Conta",
      "ID Meta Ads",
      "ID Google Ads",
      "ID Google Analytics",
      "Woo Site URL",
      report_roas_target,
      report_cpa_max,
      report_conv_min,
      report_daily_target,
      report_whatsapp_numbers
    `)
    .eq("report_enabled", true);

  if (specificAccountId) {
    query = query.eq("id", specificAccountId);
  }

  const { data: accounts, error: accountsError } = await query;

  if (accountsError) {
    console.error("[DailyReport] Error fetching accounts:", accountsError.message);
    return new Response(
      JSON.stringify({ error: accountsError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!accounts || accounts.length === 0) {
    console.log("[DailyReport] No accounts with reports enabled");
    return new Response(
      JSON.stringify({ message: "No accounts with reports enabled", results: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[DailyReport] Processing ${accounts.length} account(s)`);

  const results: any[] = [];

  // 2. Process each account
  for (const account of accounts) {
    const config: AccountConfig = {
      id: account.id,
      name: account["Conta"] || account.id,
      meta_ads_id: account["ID Meta Ads"],
      id_google_ads: account["ID Google Ads"],
      id_google_analytics: account["ID Google Analytics"],
      woo_site_url: account["Woo Site URL"],
      report_roas_target: account.report_roas_target,
      report_cpa_max: account.report_cpa_max,
      report_conv_min: account.report_conv_min,
      report_daily_target: account.report_daily_target,
      report_whatsapp_numbers: account.report_whatsapp_numbers || [],
    };

    console.log(`[DailyReport] Processing: ${config.name}`);

    try {
      // Get yesterday's date (report is about yesterday)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Get comparison dates
      const dayBefore = new Date(yesterday);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayBeforeStr = dayBefore.toISOString().split("T")[0];

      // Calculate 3-month date range for average
      const threeMonthsAgo = new Date(yesterday);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

      // 3. Fetch metrics for all dates
      const [todayMetrics, dayBeforeMetrics, avgMetrics] = await Promise.all([
        fetchDayMetrics(supabase, config, yesterdayStr),
        fetchDayMetrics(supabase, config, dayBeforeStr),
        fetch3MonthAverage(supabase, config, threeMonthsAgoStr, dayBeforeStr),
      ]);

      // 4. Generate AI insights (uses historical data for context)
      const insights = await generateInsights(config, todayMetrics, dayBeforeMetrics, avgMetrics);

      // 5. Format WhatsApp messages (2 separate messages)
      const { dataMessage, insightsMessage } = formatWhatsAppMessage(config, todayMetrics, insights);

      // 6. Send via Evolution API (unless test mode)
      if (!testMode && config.report_whatsapp_numbers.length > 0) {
        for (const phone of config.report_whatsapp_numbers) {
          // Enviar dados primeiro
          await sendWhatsAppMessage(phone, dataMessage);
          // Delay de 1s para garantir ordem
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Enviar insights
          await sendWhatsAppMessage(phone, insightsMessage);
        }
      }

      results.push({
        account: config.name,
        status: "success",
        phones_sent: testMode ? 0 : config.report_whatsapp_numbers.length,
        metrics: todayMetrics,
        message_preview: dataMessage.substring(0, 200) + "...",
      });

      console.log(`[DailyReport] ${config.name}: Report sent to ${config.report_whatsapp_numbers.length} numbers`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[DailyReport] Error for ${config.name}:`, errorMessage);

      results.push({
        account: config.name,
        status: "error",
        error: errorMessage,
      });
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[DailyReport] Completed in ${duration}ms`);

  return new Response(
    JSON.stringify({
      message: "Report generation completed",
      duration_ms: duration,
      accounts_processed: results.length,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Fetch metrics for a specific day
async function fetchDayMetrics(
  supabase: any,
  config: AccountConfig,
  date: string
): Promise<DayMetrics> {
  const metrics: DayMetrics = {
    date,
    woo_sales: 0,
    woo_orders: 0,
    woo_avg_ticket: 0,
    meta_spend: 0,
    meta_impressions: 0,
    meta_clicks: 0,
    meta_purchases: 0,
    meta_revenue: 0,
    google_spend: 0,
    google_impressions: 0,
    google_clicks: 0,
    google_conversions: 0,
    google_revenue: 0,
    ga4_sessions: 0,
    ga4_engaged_sessions: 0,
    ga4_conversions: 0,
    total_spend: 0,
    total_revenue: 0,
    roas: 0,
    cpa: 0,
    conversion_rate: 0,
    cost_per_session: 0,
  };

  // WooCommerce sales - include all "paid/shipped" statuses
  // Common WooCommerce statuses: completed, processing, on-hold, pending, cancelled, refunded, failed
  // Custom statuses often used: enviado, shipped, delivered, entregue
  if (config.woo_site_url) {
    const { data: wooData } = await supabase
      .from("j_rep_woocommerce_bronze")
      .select("order_total, order_id")
      .eq("account_id", config.id)
      .eq("order_date", date)
      .eq("line_item_id", 0) // Order-level records only
      .in("order_status", ["completed", "processing", "enviado", "shipped", "delivered", "entregue"]);

    if (wooData && wooData.length > 0) {
      metrics.woo_sales = wooData.reduce((sum: number, r: any) => sum + (parseFloat(r.order_total) || 0), 0);
      metrics.woo_orders = wooData.length;
      metrics.woo_avg_ticket = metrics.woo_orders > 0 ? metrics.woo_sales / metrics.woo_orders : 0;
    }
  }

  // Meta Ads
  if (config.meta_ads_id) {
    const { data: metaData } = await supabase
      .from("j_rep_metaads_bronze")
      .select("spend, impressions, link_clicks, actions_purchase, action_values_omni_purchase")
      .eq("account_id", config.meta_ads_id)
      .eq("date", date);

    if (metaData && metaData.length > 0) {
      metrics.meta_spend = metaData.reduce((sum: number, r: any) => sum + (parseFloat(r.spend) || 0), 0);
      metrics.meta_impressions = metaData.reduce((sum: number, r: any) => sum + (r.impressions || 0), 0);
      metrics.meta_clicks = metaData.reduce((sum: number, r: any) => sum + (r.link_clicks || 0), 0);
      metrics.meta_purchases = metaData.reduce((sum: number, r: any) => sum + (r.actions_purchase || 0), 0);
      metrics.meta_revenue = metaData.reduce((sum: number, r: any) => sum + (parseFloat(r.action_values_omni_purchase) || 0), 0);
    }
  }

  // Google Ads
  if (config.id_google_ads) {
    const { data: googleData } = await supabase
      .from("j_rep_googleads_bronze")
      .select("spend, impressions, clicks, conversions, conversions_value")
      .eq("account_id", config.id_google_ads)
      .eq("date", date);

    if (googleData && googleData.length > 0) {
      metrics.google_spend = googleData.reduce((sum: number, r: any) => sum + (parseFloat(r.spend) || 0), 0);
      metrics.google_impressions = googleData.reduce((sum: number, r: any) => sum + (r.impressions || 0), 0);
      metrics.google_clicks = googleData.reduce((sum: number, r: any) => sum + (r.clicks || 0), 0);
      metrics.google_conversions = googleData.reduce((sum: number, r: any) => sum + (r.conversions || 0), 0);
      metrics.google_revenue = googleData.reduce((sum: number, r: any) => sum + (parseFloat(r.conversions_value) || 0), 0);
    }
  }

  // GA4
  if (config.id_google_analytics) {
    const { data: ga4Data } = await supabase
      .from("j_rep_ga4_bronze")
      .select("sessions, engaged_sessions, conversions")
      .eq("account_id", config.id_google_analytics)
      .eq("date", date);

    if (ga4Data && ga4Data.length > 0) {
      metrics.ga4_sessions = ga4Data.reduce((sum: number, r: any) => sum + (r.sessions || 0), 0);
      metrics.ga4_engaged_sessions = ga4Data.reduce((sum: number, r: any) => sum + (r.engaged_sessions || 0), 0);
      metrics.ga4_conversions = ga4Data.reduce((sum: number, r: any) => sum + (r.conversions || 0), 0);
    }
  }

  // Calculate totals and KPIs
  metrics.total_spend = metrics.meta_spend + metrics.google_spend;
  metrics.total_revenue = metrics.woo_sales || metrics.meta_revenue + metrics.google_revenue;
  metrics.roas = metrics.total_spend > 0 ? metrics.total_revenue / metrics.total_spend : 0;

  const totalConversions = metrics.woo_orders || metrics.meta_purchases + metrics.google_conversions;
  metrics.cpa = totalConversions > 0 ? metrics.total_spend / totalConversions : 0;
  metrics.conversion_rate = metrics.ga4_sessions > 0 ? (totalConversions / metrics.ga4_sessions) * 100 : 0;
  metrics.cost_per_session = metrics.ga4_sessions > 0 ? metrics.total_spend / metrics.ga4_sessions : 0;

  return metrics;
}

// Fetch 3-month average metrics
async function fetch3MonthAverage(
  supabase: any,
  config: AccountConfig,
  startDate: string,
  endDate: string
): Promise<DayMetrics> {
  const metrics: DayMetrics = {
    date: `${startDate} a ${endDate}`,
    woo_sales: 0,
    woo_orders: 0,
    woo_avg_ticket: 0,
    meta_spend: 0,
    meta_impressions: 0,
    meta_clicks: 0,
    meta_purchases: 0,
    meta_revenue: 0,
    google_spend: 0,
    google_impressions: 0,
    google_clicks: 0,
    google_conversions: 0,
    google_revenue: 0,
    ga4_sessions: 0,
    ga4_engaged_sessions: 0,
    ga4_conversions: 0,
    total_spend: 0,
    total_revenue: 0,
    roas: 0,
    cpa: 0,
    conversion_rate: 0,
    cost_per_session: 0,
  };

  let daysWithData = 0;

  // WooCommerce - aggregate all orders in range
  if (config.woo_site_url) {
    const { data: wooData } = await supabase
      .from("j_rep_woocommerce_bronze")
      .select("order_total, order_date")
      .eq("account_id", config.id)
      .gte("order_date", startDate)
      .lte("order_date", endDate)
      .eq("line_item_id", 0)
      .in("order_status", ["completed", "processing", "enviado", "shipped", "delivered", "entregue"]);

    if (wooData && wooData.length > 0) {
      const totalSales = wooData.reduce((sum: number, r: any) => sum + (parseFloat(r.order_total) || 0), 0);
      const totalOrders = wooData.length;
      const uniqueDates = new Set(wooData.map((r: any) => r.order_date));
      daysWithData = Math.max(daysWithData, uniqueDates.size);

      // Daily averages
      metrics.woo_sales = daysWithData > 0 ? totalSales / daysWithData : 0;
      metrics.woo_orders = daysWithData > 0 ? totalOrders / daysWithData : 0;
      metrics.woo_avg_ticket = totalOrders > 0 ? totalSales / totalOrders : 0;
    }
  }

  // Meta Ads - aggregate
  if (config.meta_ads_id) {
    const { data: metaData } = await supabase
      .from("j_rep_metaads_bronze")
      .select("spend, impressions, link_clicks, actions_purchase, action_values_omni_purchase, date")
      .eq("account_id", config.meta_ads_id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (metaData && metaData.length > 0) {
      const uniqueDates = new Set(metaData.map((r: any) => r.date));
      const metaDays = uniqueDates.size;
      daysWithData = Math.max(daysWithData, metaDays);

      const totalSpend = metaData.reduce((sum: number, r: any) => sum + (parseFloat(r.spend) || 0), 0);
      const totalImpressions = metaData.reduce((sum: number, r: any) => sum + (r.impressions || 0), 0);
      const totalClicks = metaData.reduce((sum: number, r: any) => sum + (r.link_clicks || 0), 0);
      const totalPurchases = metaData.reduce((sum: number, r: any) => sum + (r.actions_purchase || 0), 0);
      const totalRevenue = metaData.reduce((sum: number, r: any) => sum + (parseFloat(r.action_values_omni_purchase) || 0), 0);

      metrics.meta_spend = metaDays > 0 ? totalSpend / metaDays : 0;
      metrics.meta_impressions = metaDays > 0 ? totalImpressions / metaDays : 0;
      metrics.meta_clicks = metaDays > 0 ? totalClicks / metaDays : 0;
      metrics.meta_purchases = metaDays > 0 ? totalPurchases / metaDays : 0;
      metrics.meta_revenue = metaDays > 0 ? totalRevenue / metaDays : 0;
    }
  }

  // Google Ads - aggregate
  if (config.id_google_ads) {
    const { data: googleData } = await supabase
      .from("j_rep_googleads_bronze")
      .select("spend, impressions, clicks, conversions, conversions_value, date")
      .eq("account_id", config.id_google_ads)
      .gte("date", startDate)
      .lte("date", endDate);

    if (googleData && googleData.length > 0) {
      const uniqueDates = new Set(googleData.map((r: any) => r.date));
      const googleDays = uniqueDates.size;
      daysWithData = Math.max(daysWithData, googleDays);

      const totalSpend = googleData.reduce((sum: number, r: any) => sum + (parseFloat(r.spend) || 0), 0);
      const totalImpressions = googleData.reduce((sum: number, r: any) => sum + (r.impressions || 0), 0);
      const totalClicks = googleData.reduce((sum: number, r: any) => sum + (r.clicks || 0), 0);
      const totalConversions = googleData.reduce((sum: number, r: any) => sum + (r.conversions || 0), 0);
      const totalRevenue = googleData.reduce((sum: number, r: any) => sum + (parseFloat(r.conversions_value) || 0), 0);

      metrics.google_spend = googleDays > 0 ? totalSpend / googleDays : 0;
      metrics.google_impressions = googleDays > 0 ? totalImpressions / googleDays : 0;
      metrics.google_clicks = googleDays > 0 ? totalClicks / googleDays : 0;
      metrics.google_conversions = googleDays > 0 ? totalConversions / googleDays : 0;
      metrics.google_revenue = googleDays > 0 ? totalRevenue / googleDays : 0;
    }
  }

  // GA4 - aggregate
  if (config.id_google_analytics) {
    const { data: ga4Data } = await supabase
      .from("j_rep_ga4_bronze")
      .select("sessions, engaged_sessions, conversions, date")
      .eq("account_id", config.id_google_analytics)
      .gte("date", startDate)
      .lte("date", endDate);

    if (ga4Data && ga4Data.length > 0) {
      const uniqueDates = new Set(ga4Data.map((r: any) => r.date));
      const ga4Days = uniqueDates.size;
      daysWithData = Math.max(daysWithData, ga4Days);

      const totalSessions = ga4Data.reduce((sum: number, r: any) => sum + (r.sessions || 0), 0);
      const totalEngaged = ga4Data.reduce((sum: number, r: any) => sum + (r.engaged_sessions || 0), 0);
      const totalConversions = ga4Data.reduce((sum: number, r: any) => sum + (r.conversions || 0), 0);

      metrics.ga4_sessions = ga4Days > 0 ? totalSessions / ga4Days : 0;
      metrics.ga4_engaged_sessions = ga4Days > 0 ? totalEngaged / ga4Days : 0;
      metrics.ga4_conversions = ga4Days > 0 ? totalConversions / ga4Days : 0;
    }
  }

  // Calculate totals and KPIs (using daily averages)
  metrics.total_spend = metrics.meta_spend + metrics.google_spend;
  metrics.total_revenue = metrics.woo_sales || metrics.meta_revenue + metrics.google_revenue;
  metrics.roas = metrics.total_spend > 0 ? metrics.total_revenue / metrics.total_spend : 0;

  const totalConversions = metrics.woo_orders || metrics.meta_purchases + metrics.google_conversions;
  metrics.cpa = totalConversions > 0 ? metrics.total_spend / totalConversions : 0;
  metrics.conversion_rate = metrics.ga4_sessions > 0 ? (totalConversions / metrics.ga4_sessions) * 100 : 0;
  metrics.cost_per_session = metrics.ga4_sessions > 0 ? metrics.total_spend / metrics.ga4_sessions : 0;

  return metrics;
}

// Generate AI insights using Claude
async function generateInsights(
  config: AccountConfig,
  today: DayMetrics,
  dayBefore: DayMetrics,
  avg3Month: DayMetrics
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return "Insights não disponíveis (API key não configurada)";
  }

  const anthropic = new Anthropic({ apiKey });

  // Build context
  const targetInfo = [];
  if (config.report_roas_target) targetInfo.push(`ROAS alvo: ${config.report_roas_target}x`);
  if (config.report_cpa_max) targetInfo.push(`CPA máximo: R$ ${config.report_cpa_max}`);
  if (config.report_conv_min) targetInfo.push(`Conversão mínima: ${config.report_conv_min}%`);
  if (config.report_daily_target) targetInfo.push(`Meta diária: R$ ${config.report_daily_target}`);

  const prompt = `Você é um analista de tráfego pago experiente. Analise os dados de performance abaixo e gere 2-3 insights ACIONÁVEIS e ESPECÍFICOS.

CLIENTE: ${config.name}
${targetInfo.length > 0 ? `METAS: ${targetInfo.join(" | ")}` : ""}

ONTEM (${today.date}):
- Vendas: R$ ${today.woo_sales.toFixed(2)} (${today.woo_orders} pedidos)
- Investimento: R$ ${today.total_spend.toFixed(2)} (Meta: R$ ${today.meta_spend.toFixed(2)} | Google: R$ ${today.google_spend.toFixed(2)})
- ROAS: ${today.roas.toFixed(2)}x
- CPA: R$ ${today.cpa.toFixed(2)}
- Conversão: ${today.conversion_rate.toFixed(2)}%
- Sessões: ${today.ga4_sessions}
- Ticket Médio: R$ ${today.woo_avg_ticket.toFixed(2)}

ANTEONTEM (${dayBefore.date}):
- Vendas: R$ ${dayBefore.woo_sales.toFixed(2)}
- ROAS: ${dayBefore.roas.toFixed(2)}x
- Conversão: ${dayBefore.conversion_rate.toFixed(2)}%

MÉDIA DIÁRIA (últimos 3 meses):
- Vendas: R$ ${avg3Month.woo_sales.toFixed(2)}
- ROAS: ${avg3Month.roas.toFixed(2)}x
- Conversão: ${avg3Month.conversion_rate.toFixed(2)}%

Gere insights curtos e diretos. Foque em:
1. Anomalias ou tendências preocupantes
2. Oportunidades de otimização
3. Ações específicas para melhorar

Responda APENAS com os insights, sem introdução ou conclusão.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content[0];
    if (textBlock.type === "text") {
      return textBlock.text;
    }
    return "Insights não disponíveis";
  } catch (error) {
    console.error("[DailyReport] AI error:", error);
    return "Insights não disponíveis (erro na geração)";
  }
}

// Format WhatsApp messages (returns 2 separate messages)
function formatWhatsAppMessage(
  config: AccountConfig,
  today: DayMetrics,
  insights: string
): { dataMessage: string; insightsMessage: string } {
  const formatMoney = (n: number) =>
    `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // === MENSAGEM 1: DADOS ===
  let msg = `🏃‍♀️ ${config.name.toUpperCase()}:\n\n`;

  // Linha 1: Vendas + Meta
  msg += `Vendas: ${formatMoney(today.woo_sales)}`;
  if (config.report_daily_target) {
    const pct = (today.woo_sales / config.report_daily_target) * 100;
    msg += ` | Meta: ${formatMoney(config.report_daily_target)} (${pct.toFixed(2)}% da meta)`;
  }
  msg += `\n`;

  // Linha 2: Investimento + ROAS
  msg += `Investimento: ${formatMoney(today.total_spend)} | ROAS: ${today.roas.toFixed(2)}x\n`;

  // Linha 3: Conversão + Ticket
  msg += `Taxa Conversão: ${today.conversion_rate.toFixed(2)}% | Ticket Médio: ${formatMoney(today.woo_avg_ticket)}\n`;

  // Linha 4: Custo/Sessão + Sessões + CPA
  msg += `Custo/Sessão: ${formatMoney(today.cost_per_session)} | Sessões: ${today.ga4_sessions.toLocaleString("pt-BR")} | CPA: ${formatMoney(today.cpa)}`;

  // Canal breakdown: % investimento + CTR
  if (today.meta_spend > 0 || today.google_spend > 0) {
    msg += `\n\n`;
    if (today.meta_spend > 0) {
      const metaPct = today.total_spend > 0 ? (today.meta_spend / today.total_spend) * 100 : 0;
      const metaCtr = today.meta_impressions > 0 ? (today.meta_clicks / today.meta_impressions) * 100 : 0;
      msg += `📊 Meta: ${formatMoney(today.meta_spend)} (${metaPct.toFixed(0)}%) | CTR: ${metaCtr.toFixed(2)}%`;
    }
    if (today.google_spend > 0) {
      if (today.meta_spend > 0) msg += `\n`;
      const googlePct = today.total_spend > 0 ? (today.google_spend / today.total_spend) * 100 : 0;
      const googleCtr = today.google_impressions > 0 ? (today.google_clicks / today.google_impressions) * 100 : 0;
      msg += `📊 Google: ${formatMoney(today.google_spend)} (${googlePct.toFixed(0)}%) | CTR: ${googleCtr.toFixed(2)}%`;
    }
  }

  // Alertas
  const alerts: string[] = [];
  if (config.report_roas_target && today.roas < config.report_roas_target) {
    alerts.push(`ROAS ${today.roas.toFixed(2)}x abaixo da meta (${config.report_roas_target}x)`);
  }
  if (config.report_cpa_max && today.cpa > config.report_cpa_max) {
    alerts.push(`CPA ${formatMoney(today.cpa)} acima do limite (${formatMoney(config.report_cpa_max)})`);
  }
  if (config.report_conv_min && today.conversion_rate < config.report_conv_min) {
    alerts.push(`Conversão ${today.conversion_rate.toFixed(2)}% abaixo do mínimo (${config.report_conv_min}%)`);
  }

  if (alerts.length > 0) {
    msg += `\n\n⚠️ ${alerts.join("\n⚠️ ")}`;
  }

  // === MENSAGEM 2: INSIGHTS ===
  const insightsMsg = `💡 INSIGHTS ${config.name.toUpperCase()}:\n\n${insights}`;

  return { dataMessage: msg, insightsMessage: insightsMsg };
}

// Send WhatsApp message via Evolution API
async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
  const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");

  if (!evolutionUrl || !evolutionKey) {
    console.error("[DailyReport] Evolution API not configured");
    return;
  }

  // Ensure phone is in correct format (5511999999999@s.whatsapp.net)
  const formattedPhone = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;

  try {
    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": evolutionKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
    }

    console.log(`[DailyReport] Message sent to ${phone}`);
  } catch (error) {
    console.error(`[DailyReport] Failed to send to ${phone}:`, error);
    throw error;
  }
}
