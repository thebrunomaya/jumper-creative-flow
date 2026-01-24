-- Migration: WooCommerce Sync Orchestrator Pattern
-- Date: 2026-01-24
--
-- Problem:
-- - WooCommerce sync was processing 5 accounts sequentially
-- - Trama Casa has 681 products → ~120 seconds alone
-- - Total: 173 seconds → exceeded 150s gateway timeout
--
-- Solution:
-- - Orchestrator pattern: function dispatches workers per account
-- - Separate CRONs for orders (daily) and products (weekly)
-- - Each worker has its own 150s timeout

-- ============================================
-- 1. REMOVE OLD CRON JOB
-- ============================================

DO $$
BEGIN
  PERFORM cron.unschedule('woocommerce-sync-daily');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Job doesn't exist, ignore
END;
$$;

-- ============================================
-- 2. CREATE NEW CRON JOBS
-- ============================================

-- Daily: Sync ORDERS only - 4:00 BRT (7:00 UTC)
-- Orders change daily, sync is fast (~10s per account)
SELECT cron.schedule(
  'woo-sync-orders',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_woocommerce_sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"sync_products": false}'::jsonb
  );
  $$
);

-- Weekly: Sync PRODUCTS only - Sundays 3:00 BRT (6:00 UTC)
-- Products rarely change, sync is slow (~120s for large catalogs)
SELECT cron.schedule(
  'woo-sync-products',
  '0 6 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_woocommerce_sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"sync_orders": false}'::jsonb
  );
  $$
);

-- ============================================
-- 3. VERIFICATION
-- ============================================
-- Run this to verify the jobs were created:
-- SELECT * FROM cron.job WHERE jobname LIKE 'woo-sync%';
