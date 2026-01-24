-- Migration: Fix ALL CRON jobs with --no-verify-jwt
-- Date: 2026-01-24
--
-- Problem:
-- - Edge Functions have JWT verification enabled by default at gateway level
-- - New Supabase publishable keys (sb_publishable_*) are NOT JWTs
-- - pg_cron calls don't have user sessions to generate JWTs
--
-- Solution:
-- - Deploy Edge Functions with --no-verify-jwt flag
-- - Use simple HTTP calls without auth headers
-- - Functions are only called internally by pg_cron (trusted)

-- ============================================
-- 1. UNSCHEDULE ALL PROBLEMATIC JOBS
-- ============================================

-- Unschedule daily-whatsapp-report (uses get_cron_secret)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-whatsapp-report');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Job doesn't exist, ignore
END;
$$;

-- Unschedule woocommerce-sync-daily (uses get_cron_secret)
DO $$
BEGIN
  PERFORM cron.unschedule('woocommerce-sync-daily');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Job doesn't exist, ignore
END;
$$;

-- Unschedule balance-alerts-check (if exists, uses current_setting)
DO $$
BEGIN
  PERFORM cron.unschedule('balance-alerts-check');
EXCEPTION WHEN OTHERS THEN
  NULL; -- Job doesn't exist, ignore
END;
$$;

-- ============================================
-- 2. RECREATE ALL JOBS (no auth needed with --no-verify-jwt)
-- ============================================

-- Daily WhatsApp Report - 09:00 BRT (12:00 UTC)
SELECT cron.schedule(
  'daily-whatsapp-report',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_daily_report',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- WooCommerce Sync is handled by migration 20260124000004_woo_sync_orchestrator.sql
-- (separate jobs for orders daily and products weekly)

-- Balance Alerts Check - 08:30 BRT (11:30 UTC)
SELECT cron.schedule(
  'balance-alerts-check',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_balance_check_alerts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 3. CLEANUP - Drop unused functions
-- ============================================

-- Drop the get_cron_secret function (no longer needed)
DROP FUNCTION IF EXISTS get_cron_secret();

-- Drop wrapper functions if they exist
DROP FUNCTION IF EXISTS trigger_daily_report();
DROP FUNCTION IF EXISTS trigger_woocommerce_sync();
