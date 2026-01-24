-- Migration: Schedule daily report CRON job
-- Date: 2026-01-23
-- Description: Creates a daily CRON job to send WhatsApp performance reports at 8:00 BRT
-- NOTE: This migration is superseded by 20260124000000_fix_daily_report_cron_auth.sql
--       which fixes the authentication mechanism

-- Schedule daily report at 8:00 BRT (11:00 UTC)
-- Using old auth method (will be replaced by next migration)
SELECT cron.schedule(
  'daily-whatsapp-report',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_daily_report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
