-- Migration: Schedule WooCommerce sync CRON job
-- Date: 2026-01-23
-- Description: Creates daily CRON job to sync WooCommerce orders at 4:00 BRT (7:00 UTC)

-- Schedule the daily sync
-- Runs at 7:00 UTC which is 4:00 BRT (Brazil Time)
SELECT cron.schedule(
  'woocommerce-sync-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_woocommerce_sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduling for PostgreSQL - includes WooCommerce daily sync at 4:00 BRT';
