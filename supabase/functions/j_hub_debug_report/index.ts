/**
 * Debug function to check what data exists in bronze tables
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get account (Boiler)
  const { data: account } = await supabase
    .from("j_hub_notion_db_accounts")
    .select('id, "Conta", "ID Meta Ads", "ID Google Ads", "ID Google Analytics", "Woo Site URL"')
    .eq("report_enabled", true)
    .single();

  if (!account) {
    return new Response(JSON.stringify({ error: "No account found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetDate = "2026-01-22";

  // Debug: Check WooCommerce data
  const { data: wooData, error: wooError } = await supabase
    .from("j_rep_woocommerce_bronze")
    .select("order_id, order_date, order_status, order_total, line_item_id")
    .eq("account_id", account.id)
    .eq("order_date", targetDate)
    .eq("line_item_id", 0);

  // Debug: Check all WooCommerce statuses for this date
  const { data: wooStatuses } = await supabase
    .from("j_rep_woocommerce_bronze")
    .select("order_status")
    .eq("account_id", account.id)
    .eq("order_date", targetDate)
    .eq("line_item_id", 0);

  // Debug: Check Meta Ads data
  const { data: metaData, error: metaError } = await supabase
    .from("j_rep_metaads_bronze")
    .select("account_id, date, spend, impressions")
    .eq("account_id", account["ID Meta Ads"])
    .eq("date", targetDate)
    .limit(5);

  // Debug: Check Google Ads data
  const { data: googleData, error: googleError } = await supabase
    .from("j_rep_googleads_bronze")
    .select("account_id, date, cost, impressions")
    .eq("account_id", account["ID Google Ads"])
    .eq("date", targetDate)
    .limit(5);

  // Debug: Check what account_ids exist in Google Ads
  const { data: googleAccountIds } = await supabase
    .from("j_rep_googleads_bronze")
    .select("account_id")
    .limit(10);

  // Debug: Check GA4 data
  const { data: ga4Data, error: ga4Error } = await supabase
    .from("j_rep_ga4_bronze")
    .select("account_id, date, sessions")
    .eq("account_id", account["ID Google Analytics"])
    .eq("date", targetDate)
    .limit(5);

  return new Response(
    JSON.stringify({
      account: {
        id: account.id,
        name: account["Conta"],
        meta_ads_id: account["ID Meta Ads"],
        google_ads_id: account["ID Google Ads"],
        ga4_id: account["ID Google Analytics"],
        woo_site_url: account["Woo Site URL"],
      },
      target_date: targetDate,
      woo: {
        count: wooData?.length || 0,
        statuses: [...new Set(wooStatuses?.map(r => r.order_status) || [])],
        sample: wooData?.slice(0, 3),
        error: wooError?.message,
      },
      meta: {
        count: metaData?.length || 0,
        sample: metaData?.slice(0, 3),
        error: metaError?.message,
      },
      google: {
        count: googleData?.length || 0,
        sample: googleData?.slice(0, 3),
        error: googleError?.message,
        available_account_ids: [...new Set(googleAccountIds?.map(r => r.account_id) || [])],
      },
      ga4: {
        count: ga4Data?.length || 0,
        sample: ga4Data?.slice(0, 3),
        error: ga4Error?.message,
      },
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
