-- Migration: j_ads_user_audit_log → j_hub_user_audit_log
-- Description: Rename user audit log table to match j_hub_* naming
-- Date: 2025-10-12
-- Part of: Jumper Hub v2.0 rebrand

-- Step 1: Rename the table
ALTER TABLE j_ads_user_audit_log RENAME TO j_hub_user_audit_log;

-- Step 2: Rename the primary key constraint
ALTER TABLE j_hub_user_audit_log RENAME CONSTRAINT j_ads_user_audit_log_pkey TO j_hub_user_audit_log_pkey;

-- Step 3: Rename foreign key constraint (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'j_ads_user_audit_log_user_id_fkey'
  ) THEN
    ALTER TABLE j_hub_user_audit_log
      RENAME CONSTRAINT j_ads_user_audit_log_user_id_fkey
      TO j_hub_user_audit_log_user_id_fkey;
  END IF;
END $$;

-- Step 4: Update foreign key to point to new j_hub_users table
ALTER TABLE j_hub_user_audit_log
  DROP CONSTRAINT IF EXISTS j_hub_user_audit_log_user_id_fkey,
  ADD CONSTRAINT j_hub_user_audit_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES j_hub_users(id) ON DELETE CASCADE;

-- Step 5: Rename indexes
ALTER INDEX IF EXISTS idx_j_ads_user_audit_log_user_id
  RENAME TO idx_j_hub_user_audit_log_user_id;
ALTER INDEX IF EXISTS idx_j_ads_user_audit_log_created_at
  RENAME TO idx_j_hub_user_audit_log_created_at;

-- Step 6: Create backwards compatibility view
CREATE OR REPLACE VIEW j_ads_user_audit_log AS
SELECT * FROM j_hub_user_audit_log;

-- Step 7: Grant permissions
GRANT SELECT, INSERT ON j_hub_user_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_user_audit_log TO service_role;

-- Step 8: Enable RLS
ALTER TABLE j_hub_user_audit_log ENABLE ROW LEVEL SECURITY;

-- Step 9: Recreate RLS policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON j_hub_user_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON j_hub_user_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role has full access" ON j_hub_user_audit_log;
CREATE POLICY "Service role has full access"
  ON j_hub_user_audit_log FOR ALL
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully migrated j_ads_user_audit_log to j_hub_user_audit_log';
  RAISE NOTICE 'Foreign key updated to reference j_hub_users';
END $$;
