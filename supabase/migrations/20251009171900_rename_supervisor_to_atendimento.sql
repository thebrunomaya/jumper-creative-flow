-- Migration: Rename column "Supervisor" to "Atendimento" in j_ads_notion_db_accounts
-- Reason: Notion database field was renamed from "Supervisor" to "Atendimento"
-- Date: 2025-10-09

-- Rename the column
ALTER TABLE j_ads_notion_db_accounts
RENAME COLUMN "Supervisor" TO "Atendimento";

-- Add comment for documentation
COMMENT ON COLUMN j_ads_notion_db_accounts."Atendimento" IS
'Atendimento staff emails (renamed from Supervisor). Contains comma-separated emails of staff members assigned to customer service role.';
