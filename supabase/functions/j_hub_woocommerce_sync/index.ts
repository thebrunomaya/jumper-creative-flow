/**
 * j_hub_woocommerce_sync
 *
 * Edge Function to sync WooCommerce orders to Supabase bronze table.
 *
 * Features:
 * - Multi-tenant: syncs all accounts with WooCommerce configured
 * - Backfill: 3 months on first run, then incremental (2 days overlap)
 * - Idempotent: uses UPSERT to avoid duplicates
 * - Stores orders + line items with metadata for future processing
 *
 * Triggered by:
 * - CRON job (daily at 4:00 BRT / 7:00 UTC)
 * - Manual POST request
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WooAccount {
  id: string;
  Conta: string;
  "Woo Site URL": string;
  "Woo Consumer Key": string;
  "Woo Consumer Secret": string;
}

interface SyncResult {
  account: string;
  status: "success" | "error" | "skipped";
  orders?: number;
  rows?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[WooSync] Starting sync...");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Fetch accounts with WooCommerce configured
  const { data: accounts, error: accountsError } = await supabase
    .from("j_hub_notion_db_accounts")
    .select(
      'id, "Conta", "Woo Site URL", "Woo Consumer Key", "Woo Consumer Secret"'
    )
    .not("Woo Site URL", "is", null)
    .not("Woo Consumer Key", "is", null)
    .not("Woo Consumer Secret", "is", null);

  if (accountsError) {
    console.error("[WooSync] Error fetching accounts:", accountsError.message);
    return new Response(
      JSON.stringify({ error: accountsError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!accounts || accounts.length === 0) {
    console.log("[WooSync] No accounts with WooCommerce configured");
    return new Response(
      JSON.stringify({
        message: "No accounts with WooCommerce configured",
        results: [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`[WooSync] Found ${accounts.length} account(s) to sync`);

  const results: SyncResult[] = [];

  // 2. Process each account
  for (const account of accounts as WooAccount[]) {
    const accountName = account.Conta || account.id;
    console.log(`[WooSync] Processing account: ${accountName}`);

    try {
      // Validate URL format
      const siteUrl = account["Woo Site URL"].trim();
      if (!siteUrl.startsWith("http")) {
        throw new Error(`Invalid site URL: ${siteUrl}`);
      }

      // 3. Get last sync timestamp
      const { data: syncStatus } = await supabase
        .from("j_hub_woocommerce_sync_status")
        .select("last_sync_at")
        .eq("account_id", account.id)
        .single();

      // 4. Determine sync period
      const now = new Date();
      let since: Date;

      if (syncStatus?.last_sync_at) {
        // Incremental: last 2 days (overlap for order updates)
        since = new Date(syncStatus.last_sync_at);
        since.setDate(since.getDate() - 2);
        console.log(
          `[WooSync] Incremental sync from ${since.toISOString()}`
        );
      } else {
        // Backfill: 3 months
        since = new Date(now);
        since.setMonth(since.getMonth() - 3);
        console.log(`[WooSync] Backfill sync from ${since.toISOString()}`);
      }

      // 5. Fetch orders from WooCommerce API
      const orders = await fetchWooOrders(account, since);
      console.log(`[WooSync] Fetched ${orders.length} orders`);

      if (orders.length === 0) {
        // Update sync status even if no orders
        await supabase.from("j_hub_woocommerce_sync_status").upsert({
          account_id: account.id,
          last_sync_at: now.toISOString(),
          last_sync_status: "success",
          last_sync_orders_count: 0,
          last_error_message: null,
          updated_at: now.toISOString(),
        });

        results.push({
          account: accountName,
          status: "success",
          orders: 0,
          rows: 0,
        });
        continue;
      }

      // 6. Transform to bronze format
      const bronzeRows = transformToBronze(orders, account.id);
      console.log(`[WooSync] Transformed to ${bronzeRows.length} bronze rows`);

      // 7. UPSERT to bronze table (in batches)
      const BATCH_SIZE = 500;
      let insertedRows = 0;

      for (let i = 0; i < bronzeRows.length; i += BATCH_SIZE) {
        const batch = bronzeRows.slice(i, i + BATCH_SIZE);
        const { error: upsertError } = await supabase
          .from("j_rep_woocommerce_bronze")
          .upsert(batch, {
            onConflict: "account_id,order_id,line_item_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[WooSync] Upsert error:`, upsertError.message);
          throw new Error(`Upsert failed: ${upsertError.message}`);
        }

        insertedRows += batch.length;
        console.log(
          `[WooSync] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} rows`
        );
      }

      // 8. Update sync status
      await supabase.from("j_hub_woocommerce_sync_status").upsert({
        account_id: account.id,
        last_sync_at: now.toISOString(),
        last_sync_status: "success",
        last_sync_orders_count: orders.length,
        last_error_message: null,
        updated_at: now.toISOString(),
      });

      results.push({
        account: accountName,
        status: "success",
        orders: orders.length,
        rows: insertedRows,
      });

      console.log(
        `[WooSync] Account ${accountName} completed: ${orders.length} orders, ${insertedRows} rows`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[WooSync] Error for ${accountName}:`, errorMessage);

      // Update sync status with error
      await supabase.from("j_hub_woocommerce_sync_status").upsert({
        account_id: account.id,
        last_sync_status: "error",
        last_error_message: errorMessage,
        updated_at: new Date().toISOString(),
      });

      results.push({
        account: accountName,
        status: "error",
        error: errorMessage,
      });
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[WooSync] Completed in ${duration}ms`);

  return new Response(
    JSON.stringify({
      message: "Sync completed",
      duration_ms: duration,
      accounts_processed: results.length,
      results,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

// --- Helper Functions ---

async function fetchWooOrders(
  account: WooAccount,
  since: Date
): Promise<any[]> {
  const baseUrl = account["Woo Site URL"].trim().replace(/\/$/, ""); // Remove trailing slash
  const consumerKey = account["Woo Consumer Key"];
  const consumerSecret = account["Woo Consumer Secret"];

  // WooCommerce uses Basic Auth
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const allOrders: any[] = [];
  let page = 1;
  const maxPages = 50; // Safety limit: 5000 orders max

  // Paid statuses to filter
  const paidStatuses = [
    "completed",
    "processing",
    "enviado",
    "shipped",
    "delivered",
    "entregue",
  ];

  while (page <= maxPages) {
    const params = new URLSearchParams({
      per_page: "100",
      page: String(page),
      after: since.toISOString(),
      orderby: "date",
      order: "asc",
    });

    // Note: WooCommerce API requires status to be passed individually
    // Using comma-separated doesn't work, so we fetch all and filter
    const url = `${baseUrl}/wp-json/wc/v3/orders?${params}`;

    console.log(`[WooSync] Fetching page ${page}...`);

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `WooCommerce API error: ${res.status} ${res.statusText} - ${errorText}`
      );
    }

    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      break;
    }

    // Filter by paid statuses
    const paidOrders = orders.filter((o: any) =>
      paidStatuses.includes(o.status)
    );
    allOrders.push(...paidOrders);

    console.log(
      `[WooSync] Page ${page}: ${orders.length} total, ${paidOrders.length} paid`
    );

    // Check if there are more pages
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return allOrders;
}

function transformToBronze(orders: any[], accountId: string): any[] {
  const rows: any[] = [];

  for (const order of orders) {
    const orderDate = order.date_created?.split("T")[0] || order.date_created;

    // Order record (line_item_id = 0 for order-level records)
    rows.push({
      account_id: accountId,
      order_id: order.id,
      line_item_id: 0,
      order_date: orderDate,
      order_status: order.status,
      order_total: parseFloat(order.total) || 0,
      customer_id: order.customer_id || null,
      customer_email: order.billing?.email || null,
      payment_method: order.payment_method || null,
      product_id: null,
      product_name: null,
      product_sku: null,
      quantity: null,
      item_total: null,
      meta_data: {
        currency: order.currency,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        payment_method_title: order.payment_method_title,
        billing_city: order.billing?.city,
        billing_state: order.billing?.state,
      },
    });

    // Line item records
    for (const item of order.line_items || []) {
      // Extract bundle metadata
      const bundledBy = item.meta_data?.find(
        (m: any) => m.key === "_bundled_by"
      )?.value;
      const bundledItems = item.meta_data?.find(
        (m: any) => m.key === "_bundled_items"
      )?.value;

      rows.push({
        account_id: accountId,
        order_id: order.id,
        line_item_id: item.id,
        order_date: orderDate,
        order_status: order.status,
        order_total: null,
        customer_id: null,
        customer_email: null,
        payment_method: null,
        product_id: item.product_id || null,
        product_name: item.name || null,
        product_sku: item.sku || null,
        quantity: item.quantity || 0,
        item_total: parseFloat(item.total) || 0,
        meta_data: {
          variation_id: item.variation_id || null,
          bundled_by: bundledBy || null,
          bundled_items: bundledItems || null,
          tax_class: item.tax_class || null,
          subtotal: item.subtotal || null,
        },
      });
    }
  }

  return rows;
}
