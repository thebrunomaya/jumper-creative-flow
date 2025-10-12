-- Migration: j_ads_notion_sync_logs → j_hub_notion_sync_logs
-- Description: Rename Notion sync logs table to match j_hub_* naming
-- Date: 2025-10-12
-- Part of: Jumper Hub v2.0 rebrand

-- Step 1: Rename the table
ALTER TABLE j_ads_notion_sync_logs RENAME TO j_hub_notion_sync_logs;

-- Step 2: Rename the primary key constraint
ALTER TABLE j_hub_notion_sync_logs
  RENAME CONSTRAINT j_ads_notion_sync_logs_pkey
  TO j_hub_notion_sync_logs_pkey;

-- Step 3: Rename indexes (if they exist)
DO $$
BEGIN
  -- Rename started_at index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_sync_logs_started_at') THEN
    ALTER INDEX idx_j_ads_notion_sync_logs_started_at
      RENAME TO idx_j_hub_notion_sync_logs_started_at;
  END IF;

  -- Rename status index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_notion_sync_logs_status') THEN
    ALTER INDEX idx_j_ads_notion_sync_logs_status
      RENAME TO idx_j_hub_notion_sync_logs_status;
  END IF;

  RAISE NOTICE 'Indexes renamed (if they existed)';
END $$;

-- Step 4: Create backwards compatibility view (temporary)
CREATE OR REPLACE VIEW j_ads_notion_sync_logs AS
SELECT * FROM j_hub_notion_sync_logs;

-- Step 5: Grant permissions on new table
GRANT SELECT ON j_hub_notion_sync_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_notion_sync_logs TO service_role;

-- Step 6: Enable RLS on new table (copy from old)
ALTER TABLE j_hub_notion_sync_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies with new table name
DROP POLICY IF EXISTS "Admins can view sync logs" ON j_hub_notion_sync_logs;
CREATE POLICY "Admins can view sync logs"
  ON j_hub_notion_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role has full access" ON j_hub_notion_sync_logs;
CREATE POLICY "Service role has full access"
  ON j_hub_notion_sync_logs FOR ALL
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully migrated j_ads_notion_sync_logs to j_hub_notion_sync_logs';
  RAISE NOTICE 'Backwards compatibility view j_ads_notion_sync_logs created';
  RAISE NOTICE 'RLS policy updated to reference j_hub_users';
END $$;
