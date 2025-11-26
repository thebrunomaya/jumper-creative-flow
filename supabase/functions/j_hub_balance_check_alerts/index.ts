/**
 * Edge Function: j_hub_balance_check_alerts
 *
 * Verifica contas Meta Ads com saldo baixo e envia webhook para n8n.
 * Executada diariamente via pg_cron às 6h BRT.
 *
 * Fluxo:
 * 1. Busca contas onde days_remaining <= alert_threshold_days
 * 2. Faz JOIN com Notion para pegar "Método de Pagamento"
 * 3. Verifica se já existe alerta ativo (evita spam)
 * 4. Envia webhook para n8n com dados da conta
 * 5. Registra alerta no histórico
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const N8N_WEBHOOK_URL = "https://nilton.jumper.studio/webhook-test/flow-balance";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🔍 Verificando contas com saldo baixo...");

    // 1. Buscar TODAS as contas com alertas habilitados (ordenadas por data desc)
    const { data: allAccounts, error: fetchError } = await supabase
      .from("j_rep_metaads_account_balance")
      .select("*")
      .eq("alert_enabled", true)
      .order("date", { ascending: false });

    if (fetchError) {
      console.error("❌ Erro ao buscar contas:", fetchError);
      throw fetchError;
    }

    // 2. Pegar só o registro mais recente de cada conta
    const latestByAccount = new Map<string, any>();
    for (const row of allAccounts || []) {
      if (!latestByAccount.has(row.account_id)) {
        latestByAccount.set(row.account_id, row);
      }
    }

    // 3. Filtrar apenas contas em perigo (days_remaining <= threshold)
    const accountsInDanger: any[] = [];
    for (const [accountId, account] of latestByAccount) {
      if (account.days_remaining <= account.alert_threshold_days) {
        accountsInDanger.push(account);
      }
    }

    console.log(`📊 Contas em perigo: ${accountsInDanger.length}`);

    if (accountsInDanger.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma conta em perigo", alerts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Buscar método de pagamento do Notion para cada conta
    const accountIds = accountsInDanger.map(a => a.account_id);
    const { data: notionAccounts } = await supabase
      .from("j_hub_notion_db_accounts")
      .select(`"ID Meta Ads", "Método de Pagamento"`)
      .in("ID Meta Ads", accountIds);

    // Criar mapa de account_id -> método de pagamento
    const paymentMethodMap = new Map<string, string>();
    for (const na of notionAccounts || []) {
      if (na["ID Meta Ads"]) {
        paymentMethodMap.set(na["ID Meta Ads"], na["Método de Pagamento"] || "Desconhecido");
      }
    }

    const results: any[] = [];

    for (const account of accountsInDanger) {
      const accountId = account.account_id;

      // 5. Verificar se já existe alerta ativo (evitar spam)
      const { data: existingAlert } = await supabase
        .from("j_hub_balance_alerts")
        .select("id")
        .eq("account_id", accountId)
        .in("status", ["pending", "notified"])
        .maybeSingle();

      if (existingAlert) {
        console.log(`⏭️ ${account.account_name}: alerta já existe`);
        results.push({ account: account.account_name, status: "alert_exists" });
        continue;
      }

      const paymentMethod = paymentMethodMap.get(accountId) || "Desconhecido";

      // 6. Montar payload do webhook
      const webhookPayload = {
        account_id: accountId,
        account_name: account.account_name,
        current_balance: Number(account.current_balance),
        days_remaining: Math.round(Number(account.days_remaining)),
        avg_daily_spend: Number(account.avg_daily_spend),
        spend_cap: Number(account.spend_cap) / 100, // converter para reais
        amount_spent: Number(account.amount_spent) / 100, // converter para reais
        payment_method: paymentMethod,
        threshold_days: account.alert_threshold_days,
        alert_date: new Date().toISOString().split("T")[0],
      };

      console.log(`📤 Enviando webhook para ${account.account_name}:`, webhookPayload);

      // 7. Enviar webhook para n8n
      let webhookSuccess = false;
      try {
        const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        webhookSuccess = webhookResponse.ok;
        console.log(`📬 Webhook response: ${webhookResponse.status}`);
      } catch (webhookError) {
        console.error(`❌ Erro no webhook:`, webhookError);
      }

      // 8. Salvar alerta no histórico
      const { error: insertError } = await supabase.from("j_hub_balance_alerts").insert({
        account_id: accountId,
        account_name: account.account_name,
        balance_at_alert: account.current_balance,
        days_remaining_at_alert: account.days_remaining,
        avg_daily_spend: account.avg_daily_spend,
        threshold_days: account.alert_threshold_days,
        status: webhookSuccess ? "notified" : "pending",
        notified_at: webhookSuccess ? new Date().toISOString() : null,
      });

      if (insertError) {
        console.error(`❌ Erro ao salvar alerta:`, insertError);
      }

      results.push({
        account: account.account_name,
        balance: account.current_balance,
        days_remaining: account.days_remaining,
        payment_method: paymentMethod,
        webhook_sent: webhookSuccess,
      });
    }

    console.log(`✅ Processamento concluído: ${results.length} alertas`);

    return new Response(
      JSON.stringify({ success: true, alerts: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
