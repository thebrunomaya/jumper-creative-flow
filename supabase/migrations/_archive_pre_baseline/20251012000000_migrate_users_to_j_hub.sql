-- Migration: j_ads_users → j_hub_users
-- Description: Rename users table to match j_hub_* naming standard
-- Date: 2025-10-12
-- Part of: Jumper Hub v2.0 rebrand

-- Step 1: Rename the table
ALTER TABLE j_ads_users RENAME TO j_hub_users;

-- Step 2: Rename the primary key constraint
ALTER TABLE j_hub_users RENAME CONSTRAINT j_ads_users_pkey TO j_hub_users_pkey;

-- Step 3: Rename indexes (if they exist)
DO $$
BEGIN
  -- Rename email index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_users_email') THEN
    ALTER INDEX idx_j_ads_users_email RENAME TO idx_j_hub_users_email;
  END IF;

  -- Rename role index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_users_role') THEN
    ALTER INDEX idx_j_ads_users_role RENAME TO idx_j_hub_users_role;
  END IF;

  -- Rename notion_manager_id index if exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_j_ads_users_notion_manager_id') THEN
    ALTER INDEX idx_j_ads_users_notion_manager_id RENAME TO idx_j_hub_users_notion_manager_id;
  END IF;

  RAISE NOTICE 'Indexes renamed (if they existed)';
END $$;

-- Step 4: Update RPC function has_role to use new table name
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create backwards compatibility view (temporary)
CREATE OR REPLACE VIEW j_ads_users AS
SELECT * FROM j_hub_users;

-- Step 6: Grant permissions on new table
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_users TO service_role;

-- Step 7: Enable RLS on new table (copy from old)
ALTER TABLE j_hub_users ENABLE ROW LEVEL SECURITY;

-- Step 8: Recreate RLS policies with new table name
DROP POLICY IF EXISTS "Users can view own profile" ON j_hub_users;
CREATE POLICY "Users can view own profile"
  ON j_hub_users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON j_hub_users;
CREATE POLICY "Users can update own profile"
  ON j_hub_users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role has full access" ON j_hub_users;
CREATE POLICY "Service role has full access"
  ON j_hub_users FOR ALL
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully migrated j_ads_users to j_hub_users';
  RAISE NOTICE 'Backwards compatibility view j_ads_users created';
  RAISE NOTICE 'RPC function has_role updated';
END $$;
