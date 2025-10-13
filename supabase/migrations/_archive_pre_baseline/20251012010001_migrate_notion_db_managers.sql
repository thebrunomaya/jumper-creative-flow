-- Migration: j_ads_notion_db_managers → j_hub_notion_db_managers
-- Description: Rename Notion managers table to match j_hub_* naming
-- Date: 2025-10-12
-- Part of: Jumper Hub v2.0 rebrand

-- Step 1: Rename the table
ALTER TABLE j_ads_notion_db_managers RENAME TO j_hub_notion_db_managers;

-- Step 2: Rename the primary key constraint
ALTER TABLE j_hub_notion_db_managers
  RENAME CONSTRAINT j_ads_notion_db_managers_pkey
  TO j_hub_notion_db_managers_pkey;

-- Step 3: Rename indexes (if they exist)
DO $$
BEGIN
  -- Rename notion_id index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_db_managers_notion_id') THEN
    ALTER INDEX idx_j_ads_notion_db_managers_notion_id
      RENAME TO idx_j_hub_notion_db_managers_notion_id;
  END IF;

  -- Rename email index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_db_managers_email') THEN
    ALTER INDEX idx_j_ads_notion_db_managers_email
      RENAME TO idx_j_hub_notion_db_managers_email;
  END IF;

  RAISE NOTICE 'Indexes renamed (if they existed)';
END $$;

-- Step 4: Create backwards compatibility view (temporary)
CREATE OR REPLACE VIEW j_ads_notion_db_managers AS
SELECT * FROM j_hub_notion_db_managers;

-- Step 5: Grant permissions on new table
GRANT SELECT ON j_hub_notion_db_managers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_notion_db_managers TO service_role;

-- Step 6: Enable RLS on new table (copy from old)
ALTER TABLE j_hub_notion_db_managers ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies with new table name
DROP POLICY IF EXISTS "Public read access for Notion managers" ON j_hub_notion_db_managers;
CREATE POLICY "Public read access for Notion managers"
  ON j_hub_notion_db_managers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role has full access" ON j_hub_notion_db_managers;
CREATE POLICY "Service role has full access"
  ON j_hub_notion_db_managers FOR ALL
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully migrated j_ads_notion_db_managers to j_hub_notion_db_managers';
  RAISE NOTICE 'Backwards compatibility view j_ads_notion_db_managers created';
END $$;
