-- Migration: Add daily report configuration fields to accounts
-- Date: 2026-01-23
-- Description: Adds fields for configuring automated WhatsApp daily reports

-- Report configuration fields
ALTER TABLE j_hub_notion_db_accounts
ADD COLUMN IF NOT EXISTS report_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_roas_target NUMERIC(4,2),      -- e.g., 3.50 for 3.5x
ADD COLUMN IF NOT EXISTS report_cpa_max NUMERIC(10,2),         -- e.g., 80.00 for R$ 80
ADD COLUMN IF NOT EXISTS report_conv_min NUMERIC(5,2),         -- e.g., 1.50 for 1.5%
ADD COLUMN IF NOT EXISTS report_daily_target NUMERIC(12,2),    -- e.g., 5000.00 for R$ 5.000/day
ADD COLUMN IF NOT EXISTS report_whatsapp_numbers TEXT[];       -- Array of phone numbers

-- Index for enabled reports
CREATE INDEX IF NOT EXISTS idx_accounts_report_enabled
  ON j_hub_notion_db_accounts(report_enabled)
  WHERE report_enabled = true;

-- Comments
COMMENT ON COLUMN j_hub_notion_db_accounts.report_enabled IS 'Enable automated daily WhatsApp reports';
COMMENT ON COLUMN j_hub_notion_db_accounts.report_roas_target IS 'Target ROAS for performance alerts (e.g., 3.50 = 3.5x)';
COMMENT ON COLUMN j_hub_notion_db_accounts.report_cpa_max IS 'Maximum acceptable CPA in BRL';
COMMENT ON COLUMN j_hub_notion_db_accounts.report_conv_min IS 'Minimum acceptable conversion rate in percent';
COMMENT ON COLUMN j_hub_notion_db_accounts.report_daily_target IS 'Daily sales target in BRL';
COMMENT ON COLUMN j_hub_notion_db_accounts.report_whatsapp_numbers IS 'Array of WhatsApp numbers to send daily reports to';
