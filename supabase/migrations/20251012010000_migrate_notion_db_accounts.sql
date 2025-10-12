-- Migration: j_ads_notion_db_accounts → j_hub_notion_db_accounts
-- Description: Rename Notion accounts table to match j_hub_* naming
-- Date: 2025-10-12
-- Part of: Jumper Hub v2.0 rebrand

-- Step 1: Rename the table
ALTER TABLE j_ads_notion_db_accounts RENAME TO j_hub_notion_db_accounts;

-- Step 2: Rename the primary key constraint
ALTER TABLE j_hub_notion_db_accounts
  RENAME CONSTRAINT j_ads_notion_db_accounts_pkey
  TO j_hub_notion_db_accounts_pkey;

-- Step 3: Rename indexes (if they exist)
DO $$
BEGIN
  -- Rename notion_id index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_db_accounts_notion_id') THEN
    ALTER INDEX idx_j_ads_notion_db_accounts_notion_id
      RENAME TO idx_j_hub_notion_db_accounts_notion_id;
  END IF;

  -- Rename other indexes if they exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_db_accounts_status') THEN
    ALTER INDEX idx_j_ads_notion_db_accounts_status
      RENAME TO idx_j_hub_notion_db_accounts_status;
  END IF;

  RAISE NOTICE 'Indexes renamed (if they existed)';
END $$;

-- Step 4: Create backwards compatibility view (temporary)
CREATE OR REPLACE VIEW j_ads_notion_db_accounts AS
SELECT * FROM j_hub_notion_db_accounts;

-- Step 5: Grant permissions on new table
GRANT SELECT ON j_hub_notion_db_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_notion_db_accounts TO service_role;

-- Step 6: Enable RLS on new table (copy from old)
ALTER TABLE j_hub_notion_db_accounts ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies with new table name
DROP POLICY IF EXISTS "Public read access for Notion accounts" ON j_hub_notion_db_accounts;
CREATE POLICY "Public read access for Notion accounts"
  ON j_hub_notion_db_accounts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role has full access" ON j_hub_notion_db_accounts;
CREATE POLICY "Service role has full access"
  ON j_hub_notion_db_accounts FOR ALL
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully migrated j_ads_notion_db_accounts to j_hub_notion_db_accounts';
  RAISE NOTICE 'Backwards compatibility view j_ads_notion_db_accounts created';
END $$;
