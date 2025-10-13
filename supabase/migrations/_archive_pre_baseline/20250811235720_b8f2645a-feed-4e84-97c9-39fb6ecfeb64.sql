-- Enable required extensions
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Unschedule previous job if exists (ignore errors if not existing)
DO $$ BEGIN
  PERFORM cron.unschedule('daily-notion-sync');
EXCEPTION WHEN OTHERS THEN
  -- ignore
END $$;

-- Schedule daily at 03:00 UTC
select cron.schedule(
  'daily-notion-sync',
  '0 3 * * *',
  $$
  select
    net.http_post(
      url:='https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/notion-sync-cron',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd3dvd2VuZGp1enZwdHR5cmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1Njg3ODIsImV4cCI6MjA1NTE0NDc4Mn0.oXq2U2laZ0IEReJg3jTDpkybtI-99CmVKHg4sOKnB1w"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
