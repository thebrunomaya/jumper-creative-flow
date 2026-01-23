-- Migration: Schedule daily report CRON job
-- Date: 2026-01-23
-- Description: Creates a daily CRON job to send WhatsApp performance reports at 8:00 BRT

-- Schedule daily report at 8:00 BRT (11:00 UTC)
SELECT cron.schedule(
  'daily-whatsapp-report',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_daily_report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON FUNCTION cron.schedule IS 'Daily WhatsApp report job - runs at 8:00 BRT';
