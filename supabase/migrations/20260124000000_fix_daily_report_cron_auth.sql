-- Migration: Fix daily report CRON authentication
-- Date: 2026-01-24
-- Description: Updates CRON job to use X-Cron-Secret header via vault
-- Problem: current_setting('app.settings.service_role_key') was not configured
--
-- PREREQUISITE: Run this in SQL Editor BEFORE applying this migration:
--   SELECT vault.create_secret('cron_sync_secret', 'YOUR_CRON_SYNC_SECRET_VALUE');
--   (Get the value from Edge Functions > Secrets > CRON_SYNC_SECRET)

-- First, unschedule the old jobs if they exist
DO $$
BEGIN
  PERFORM cron.unschedule('daily-whatsapp-report');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, ignore
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('woocommerce-sync-daily');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, ignore
END;
$$;

-- Create a helper function to get the cron secret from vault
CREATE OR REPLACE FUNCTION get_cron_secret()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_sync_secret'
  LIMIT 1;
$$;

-- Re-schedule daily report with X-Cron-Secret header
SELECT cron.schedule(
  'daily-whatsapp-report',
  '0 11 * * *',  -- 11:00 UTC = 8:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_daily_report',
    headers := jsonb_build_object(
      'X-Cron-Secret', get_cron_secret(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Re-schedule WooCommerce sync with X-Cron-Secret header
SELECT cron.schedule(
  'woocommerce-sync-daily',
  '0 7 * * *',  -- 7:00 UTC = 4:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_woocommerce_sync',
    headers := jsonb_build_object(
      'X-Cron-Secret', get_cron_secret(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
