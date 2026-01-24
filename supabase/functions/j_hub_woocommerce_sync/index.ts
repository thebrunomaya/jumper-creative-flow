/**
 * j_hub_woocommerce_sync
 *
 * Edge Function to sync WooCommerce orders to Supabase bronze table.
 *
 * Features:
 * - Multi-tenant: syncs all accounts with WooCommerce configured
 * - Chunked backfill: processes X days per call to avoid timeout
 * - Idempotent: uses UPSERT to avoid duplicates
 * - Stores orders + line items with metadata for future processing
 *
 * Triggered by:
 * - CRON job (daily at 4:00 BRT / 7:00 UTC) - syncs yesterday
 * - Manual POST request with optional backfill parameters
 *
 * POST body parameters:
 * - backfill_days: total days to sync (e.g., 90 for 3 months)
 * - chunk_days: days per chunk (default 14, to avoid timeout)
 * - start_date: ISO date to start from (for continuation)
 * - account_id: optional filter for single account
 *
 * Returns:
 * - completed: boolean - whether all days have been processed
 * - next_start_date: ISO date - where to continue (if not completed)
 * - progress: { processed_days, total_days }
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
  order_rows?: number;
  products?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check authentication - either Authorization header or X-Cron-Secret
  const authHeader = req.headers.get("Authorization");
  const cronSecret = req.headers.get("X-Cron-Secret");
  const expectedCronSecret = Deno.env.get("CRON_SYNC_SECRET");

  // Allow if: valid JWT OR valid cron secret
  const hasCronAuth = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
  const hasJwtAuth = authHeader && authHeader.startsWith("Bearer ");

  if (!hasCronAuth && !hasJwtAuth) {
    console.log("[WooSync] Unauthorized - no valid auth");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();
  console.log("[WooSync] Starting sync...");

  // Parse request body for optional parameters
  let backfillDays = 1; // Default: yesterday only
  let chunkDays = 14; // Days per chunk (to avoid timeout)
  let startDate: string | null = null; // ISO date for continuation
  let accountFilter: string | null = null;

  try {
    if (req.method === "POST") {
      const body = await req.json();
      // backfill_days: total days to sync (e.g., 90 for 3 months)
      if (body.backfill_days && typeof body.backfill_days === "number") {
        backfillDays = Math.min(body.backfill_days, 365); // Max 1 year
        console.log(`[WooSync] Backfill mode: ${backfillDays} days total`);
      }
      // chunk_days: days per API call (to avoid timeout)
      if (body.chunk_days && typeof body.chunk_days === "number") {
        chunkDays = Math.min(body.chunk_days, 30); // Max 30 days per chunk
        console.log(`[WooSync] Chunk size: ${chunkDays} days`);
      }
      // start_date: where to start syncing from (for continuation)
      if (body.start_date && typeof body.start_date === "string") {
        startDate = body.start_date;
        console.log(`[WooSync] Starting from: ${startDate}`);
      }
      // account_id: optional filter to sync only one account
      if (body.account_id) {
        accountFilter = body.account_id;
        console.log(`[WooSync] Filtering to account: ${accountFilter}`);
      }
    }
  } catch {
    // No body or invalid JSON, use defaults
  }

  // Calculate the actual range to sync this chunk
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  // Target start date (full backfill)
  const targetStart = new Date(now);
  targetStart.setDate(targetStart.getDate() - backfillDays);
  targetStart.setHours(0, 0, 0, 0);

  // Actual start for this chunk
  let chunkStart: Date;
  if (startDate) {
    chunkStart = new Date(startDate);
  } else {
    chunkStart = targetStart;
  }

  // Chunk end (start + chunk_days, but not beyond today)
  const chunkEnd = new Date(chunkStart);
  chunkEnd.setDate(chunkEnd.getDate() + chunkDays);
  if (chunkEnd > endDate) {
    chunkEnd.setTime(endDate.getTime());
  }

  // Calculate if there's more to process after this chunk
  const isLastChunk = chunkEnd >= endDate;
  const nextStartDate = isLastChunk ? null : chunkEnd.toISOString().split('T')[0];

  // Calculate progress
  const totalDays = backfillDays;
  const processedDaysSoFar = startDate
    ? Math.round((new Date(startDate).getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysInThisChunk = Math.round((chunkEnd.getTime() - chunkStart.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`[WooSync] Processing chunk: ${chunkStart.toISOString().split('T')[0]} to ${chunkEnd.toISOString().split('T')[0]} (${daysInThisChunk} days)`);
  console.log(`[WooSync] Progress: ${processedDaysSoFar}/${totalDays} days done, ${isLastChunk ? 'FINAL chunk' : 'more chunks pending'}`)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Fetch accounts with WooCommerce configured (exclude NULL and empty strings)
  let query = supabase
    .from("j_hub_notion_db_accounts")
    .select(
      'id, "Conta", "Woo Site URL", "Woo Consumer Key", "Woo Consumer Secret"'
    )
    .not("Woo Site URL", "is", null)
    .neq("Woo Site URL", "")
    .not("Woo Consumer Key", "is", null)
    .neq("Woo Consumer Key", "")
    .not("Woo Consumer Secret", "is", null)
    .neq("Woo Consumer Secret", "");

  // Optional: filter to specific account
  if (accountFilter) {
    query = query.eq("id", accountFilter);
  }

  const { data: accounts, error: accountsError } = await query;

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

      // 3. Fetch orders from WooCommerce API for this chunk
      console.log(`[WooSync] Syncing orders from ${chunkStart.toISOString()} to ${chunkEnd.toISOString()}`);
      const orders = await fetchWooOrders(account, chunkStart, chunkEnd);
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
          order_rows: 0,
        });
        continue;
      }

      // 6. Transform to bronze format
      const bronzeRows = transformToBronze(orders, account.id, siteUrl);
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

      // 8. Sync products
      console.log(`[WooSync] Syncing products...`);
      const products = await fetchWooProducts(account);
      console.log(`[WooSync] Fetched ${products.length} products`);

      let insertedProducts = 0;
      if (products.length > 0) {
        const productRows = transformProducts(products, account.id, siteUrl);

        // UPSERT products in batches
        for (let i = 0; i < productRows.length; i += BATCH_SIZE) {
          const batch = productRows.slice(i, i + BATCH_SIZE);
          const { error: upsertError } = await supabase
            .from("j_rep_woocommerce_products")
            .upsert(batch, {
              onConflict: "account_id,product_id",
              ignoreDuplicates: false,
            });

          if (upsertError) {
            console.error(`[WooSync] Products upsert error:`, upsertError.message);
            // Don't fail the whole sync, just log the error
          } else {
            insertedProducts += batch.length;
          }
        }
        console.log(`[WooSync] Upserted ${insertedProducts} products`);
      }

      // 9. Update sync status
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
        order_rows: insertedRows,
        products: insertedProducts,
      });

      console.log(
        `[WooSync] Account ${accountName} completed: ${orders.length} orders, ${insertedRows} rows, ${insertedProducts} products`
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
      message: isLastChunk ? "Sync completed" : "Chunk completed, more to process",
      duration_ms: duration,
      accounts_processed: results.length,
      results,
      // Progress tracking for chunked backfill
      completed: isLastChunk,
      next_start_date: nextStartDate,
      progress: {
        chunk_start: chunkStart.toISOString().split('T')[0],
        chunk_end: chunkEnd.toISOString().split('T')[0],
        days_in_chunk: daysInThisChunk,
        processed_days: processedDaysSoFar + daysInThisChunk,
        total_days: totalDays,
      },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

// --- Helper Functions ---

async function fetchWooOrders(
  account: WooAccount,
  since: Date,
  until?: Date
): Promise<any[]> {
  const baseUrl = account["Woo Site URL"].trim().replace(/\/$/, ""); // Remove trailing slash
  const consumerKey = account["Woo Consumer Key"];
  const consumerSecret = account["Woo Consumer Secret"];

  // WooCommerce uses Basic Auth
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const allOrders: any[] = [];
  let page = 1;
  const maxPages = 50; // Safety limit: 5000 orders max

  while (page <= maxPages) {
    const params = new URLSearchParams({
      per_page: "100",
      page: String(page),
      after: since.toISOString(),
      orderby: "date",
      order: "asc",
    });

    // Add 'before' filter if we have an end date (for chunked processing)
    if (until) {
      params.set("before", until.toISOString());
    }

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

    // Bronze = raw data, no filtering
    allOrders.push(...orders);

    console.log(`[WooSync] Page ${page}: ${orders.length} orders`);

    // Check if there are more pages
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  return allOrders;
}

// Helper to extract site domain from URL
function extractSite(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    return url.hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

function transformToBronze(orders: any[], accountId: string, siteUrl: string): any[] {
  const rows: any[] = [];
  const site = extractSite(siteUrl);

  // Helper to extract UTM/attribution data from order meta_data
  const extractAttribution = (metaData: any[]) => {
    if (!metaData) return {};
    const attrs: Record<string, string> = {};
    for (const m of metaData) {
      if (m.key?.startsWith("_wc_order_attribution_")) {
        const shortKey = m.key.replace("_wc_order_attribution_", "");
        attrs[shortKey] = m.value;
      }
    }
    return attrs;
  };

  for (const order of orders) {
    const orderDate = order.date_created?.split("T")[0] || order.date_created;
    const attribution = extractAttribution(order.meta_data);

    // Order record (line_item_id = 0 for order-level records)
    rows.push({
      account_id: accountId,
      order_id: order.id,
      line_item_id: 0,
      site,
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
        // Timestamps
        date_created: order.date_created,
        date_modified: order.date_modified,
        // Currency & totals
        currency: order.currency,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        tax_total: order.total_tax,
        // Payment
        payment_method_title: order.payment_method_title,
        transaction_id: order.transaction_id,
        // Billing info
        billing_first_name: order.billing?.first_name,
        billing_last_name: order.billing?.last_name,
        billing_phone: order.billing?.phone,
        billing_city: order.billing?.city,
        billing_state: order.billing?.state,
        billing_country: order.billing?.country,
        billing_postcode: order.billing?.postcode,
        // Shipping info
        shipping_city: order.shipping?.city,
        shipping_state: order.shipping?.state,
        shipping_country: order.shipping?.country,
        // Coupons
        coupon_lines: order.coupon_lines?.map((c: any) => ({
          code: c.code,
          discount: c.discount,
        })),
        // Refunds
        refunds: order.refunds?.map((r: any) => ({
          id: r.id,
          reason: r.reason,
          total: r.total,
        })),
        // UTM Attribution (critical for traffic analysis!)
        ...attribution,
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
        site,
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

// --- Product Sync Functions ---

async function fetchWooProducts(account: WooAccount): Promise<any[]> {
  const baseUrl = account["Woo Site URL"].trim().replace(/\/$/, "");
  const consumerKey = account["Woo Consumer Key"];
  const consumerSecret = account["Woo Consumer Secret"];

  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const allProducts: any[] = [];
  let page = 1;
  const maxPages = 10; // Safety limit: 1000 products max

  while (page <= maxPages) {
    const params = new URLSearchParams({
      per_page: "100",
      page: String(page),
    });

    const url = `${baseUrl}/wp-json/wc/v3/products?${params}`;

    console.log(`[WooSync] Fetching products page ${page}...`);

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `WooCommerce Products API error: ${res.status} ${res.statusText} - ${errorText}`
      );
    }

    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      break;
    }

    allProducts.push(...products);

    console.log(`[WooSync] Products page ${page}: ${products.length} products`);

    // Check if there are more pages
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) {
      break;
    }

    page++;
  }

  // Also fetch variations for variable products
  const variableProducts = allProducts.filter((p) => p.type === "variable");
  for (const parent of variableProducts) {
    try {
      const variations = await fetchProductVariations(account, parent.id);
      allProducts.push(...variations);
    } catch (error) {
      console.error(
        `[WooSync] Error fetching variations for product ${parent.id}:`,
        error
      );
    }
  }

  return allProducts;
}

async function fetchProductVariations(
  account: WooAccount,
  productId: number
): Promise<any[]> {
  const baseUrl = account["Woo Site URL"].trim().replace(/\/$/, "");
  const consumerKey = account["Woo Consumer Key"];
  const consumerSecret = account["Woo Consumer Secret"];

  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const url = `${baseUrl}/wp-json/wc/v3/products/${productId}/variations?per_page=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return [];
  }

  const variations = await res.json();
  // Add parent_id to variations
  return variations.map((v: any) => ({ ...v, parent_id: productId }));
}

function transformProducts(products: any[], accountId: string, siteUrl: string): any[] {
  const site = extractSite(siteUrl);
  return products.map((p) => ({
    account_id: accountId,
    product_id: p.id,
    parent_id: p.parent_id || null,
    site,
    name: p.name || "",
    slug: p.slug || null,
    sku: p.sku || null,
    type: p.type || "simple",
    status: p.status || "publish",
    price: parseFloat(p.price) || null,
    regular_price: parseFloat(p.regular_price) || null,
    sale_price: p.sale_price ? parseFloat(p.sale_price) : null,
    stock_status: p.stock_status || null,
    stock_quantity: p.stock_quantity ?? null,
    manage_stock: p.manage_stock || false,
    categories: p.categories || [],
    tags: p.tags || [],
    attributes: p.attributes || [],
    date_created: p.date_created || null,
    date_modified: p.date_modified || null,
  }));
}
