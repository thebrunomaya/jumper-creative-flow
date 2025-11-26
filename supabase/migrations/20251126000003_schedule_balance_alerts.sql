-- Migration: Agendar verificação de alertas de saldo via pg_cron
-- Executa diariamente às 9:00 UTC (6:00 BRT)

-- Agendar job de verificação de alertas
SELECT cron.schedule(
  'balance-alerts-check',
  '0 9 * * *',  -- 9:00 UTC = 6:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_balance_check_alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Nota: Comentário removido (sem permissão para alterar cron.job)
