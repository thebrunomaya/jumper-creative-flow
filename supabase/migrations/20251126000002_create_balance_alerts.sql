-- Migration: Tabela de histórico de alertas de saldo
-- Evita alertas duplicados e mantém histórico

CREATE TYPE public.balance_alert_status AS ENUM (
  'pending',    -- Criado, aguardando notificação
  'notified',   -- Enviado para n8n/webhook
  'resolved'    -- Saldo reabastecido
);

CREATE TABLE public.j_hub_balance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referência
  account_id TEXT NOT NULL,  -- ID Meta Ads
  account_name TEXT NOT NULL,

  -- Snapshot no momento do alerta
  balance_at_alert NUMERIC(12,2) NOT NULL,
  days_remaining_at_alert NUMERIC(6,2) NOT NULL,
  avg_daily_spend NUMERIC(12,2) NOT NULL,
  threshold_days INTEGER NOT NULL,

  -- Status
  status balance_alert_status NOT NULL DEFAULT 'pending',

  -- Webhook tracking
  notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evitar alertas duplicados ativos para mesma conta
CREATE UNIQUE INDEX idx_balance_alerts_active_unique
  ON j_hub_balance_alerts(account_id)
  WHERE status IN ('pending', 'notified');

-- Índice para buscar alertas por status
CREATE INDEX idx_balance_alerts_status ON j_hub_balance_alerts(status);

-- Comentários
COMMENT ON TABLE j_hub_balance_alerts IS 'Histórico de alertas de saldo baixo enviados via webhook';
COMMENT ON COLUMN j_hub_balance_alerts.status IS 'pending=aguardando, notified=enviado, resolved=saldo reabastecido';
