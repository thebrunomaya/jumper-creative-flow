-- Migration: Sistema de Alertas de Saldo Meta Ads
-- Tabela para armazenar saldo das contas, sincronizado via Windsor.ai

CREATE TABLE public.j_rep_metaads_account_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  account_id TEXT NOT NULL,              -- ID Meta Ads (ex: "1097627115593816")
  account_name TEXT,
  currency TEXT DEFAULT 'BRL',

  -- Dados do Windsor (valores em CENTAVOS da API)
  spend_cap BIGINT DEFAULT 0,            -- Limite de gasto
  amount_spent BIGINT DEFAULT 0,         -- Já gasto contra o limite
  spend_last_7d NUMERIC(12,2) DEFAULT 0, -- Gasto 7 dias (já em reais do Windsor)

  -- Saldo calculado em REAIS: (spend_cap - amount_spent) / 100
  current_balance NUMERIC(12,2) GENERATED ALWAYS AS (
    GREATEST(spend_cap - amount_spent, 0) / 100.0
  ) STORED,

  -- Média diária
  avg_daily_spend NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN spend_last_7d > 0 THEN spend_last_7d / 7.0 ELSE 0 END
  ) STORED,

  -- Dias restantes
  days_remaining NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN spend_last_7d > 0 AND spend_cap > amount_spent
        THEN (GREATEST(spend_cap - amount_spent, 0) / 100.0) / (spend_last_7d / 7.0)
      ELSE 999
    END
  ) STORED,

  -- Configuração de alerta (POR CONTA)
  alert_threshold_days INTEGER NOT NULL DEFAULT 10,
  alert_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  date DATE NOT NULL,                    -- Data do snapshot Windsor
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT positive_threshold CHECK (alert_threshold_days >= 1)
);

-- Índices
CREATE UNIQUE INDEX idx_account_balance_unique ON j_rep_metaads_account_balance(account_id, date);
CREATE INDEX idx_account_balance_latest ON j_rep_metaads_account_balance(account_id, date DESC);
CREATE INDEX idx_account_balance_alerts ON j_rep_metaads_account_balance(days_remaining, alert_enabled)
  WHERE alert_enabled = true;

-- Comentários
COMMENT ON TABLE j_rep_metaads_account_balance IS 'Saldo das contas Meta Ads, sincronizado diariamente via Windsor.ai';
COMMENT ON COLUMN j_rep_metaads_account_balance.spend_cap IS 'Limite de gasto em centavos (dividir por 100 para reais)';
COMMENT ON COLUMN j_rep_metaads_account_balance.amount_spent IS 'Valor já gasto em centavos';
COMMENT ON COLUMN j_rep_metaads_account_balance.current_balance IS 'Saldo disponível calculado em REAIS';
COMMENT ON COLUMN j_rep_metaads_account_balance.days_remaining IS 'Estimativa de dias até o saldo acabar (999 = sem limite ou sem gasto)';
