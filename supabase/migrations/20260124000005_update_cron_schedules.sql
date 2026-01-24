-- Migration: Update CRON schedules
-- Date: 2026-01-24
--
-- Changes:
-- - daily-whatsapp-report: 10:30 BRT → 09:00 BRT
-- - balance-alerts-check: 06:00 BRT → 08:30 BRT

-- ============================================
-- 1. UNSCHEDULE OLD JOBS
-- ============================================

DO $$ BEGIN PERFORM cron.unschedule('daily-whatsapp-report'); EXCEPTION WHEN OTHERS THEN NULL; END; $$;
DO $$ BEGIN PERFORM cron.unschedule('balance-alerts-check'); EXCEPTION WHEN OTHERS THEN NULL; END; $$;

-- ============================================
-- 2. RECREATE WITH NEW SCHEDULES
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
-- 3. VERIFICATION
-- ============================================
-- Run this to verify all cron jobs:
-- SELECT jobname, schedule FROM cron.job ORDER BY jobname;
