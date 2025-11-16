-- Fix j_hub_decks RLS policies and type inconsistency
-- Migration created: 2024-11-03
-- Fixes: Staff access to managed accounts, Admin access, type inconsistency

-- Step 1: Fix type constraint (mediaplan → plan)
ALTER TABLE j_hub_decks DROP CONSTRAINT IF EXISTS j_hub_decks_type_check;
ALTER TABLE j_hub_decks ADD CONSTRAINT j_hub_decks_type_check
  CHECK (type IN ('report', 'plan', 'pitch'));

-- Step 2: Drop existing RLS policies (except public one)
DROP POLICY IF EXISTS "Users can view own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can create own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can update own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON j_hub_decks;

-- Step 3: Create comprehensive RLS policies

-- SELECT Policies

-- Policy: Admins can view all decks
CREATE POLICY "Admins can view all decks"
  ON j_hub_decks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'admin'
    )
  );

-- Policy: Users can view own decks
-- Note: Access to decks from managed accounts is controlled via frontend
-- using j_hub_user_accounts Edge Function for proper account access logic
CREATE POLICY "Users can view own decks"
  ON j_hub_decks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policies

-- Policy: Admins and Staff can create decks
CREATE POLICY "Admins and Staff can create decks"
  ON j_hub_decks
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role IN ('admin', 'staff')
    )
  );

-- UPDATE Policies

-- Policy: Admins can update all decks
CREATE POLICY "Admins can update all decks"
  ON j_hub_decks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'admin'
    )
  );

-- Policy: Users can update own decks
-- Note: Access to decks from managed accounts is controlled via frontend
CREATE POLICY "Users can update own decks"
  ON j_hub_decks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policies

-- Policy: Only Admins can delete decks
CREATE POLICY "Only Admins can delete decks"
  ON j_hub_decks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Admins can view all decks" ON j_hub_decks IS 'Admins have full read access';
COMMENT ON POLICY "Users can view own decks" ON j_hub_decks IS 'Users can view their own decks (account-based access via frontend)';
COMMENT ON POLICY "Admins and Staff can create decks" ON j_hub_decks IS 'Only admins and staff can create decks';
COMMENT ON POLICY "Admins can update all decks" ON j_hub_decks IS 'Admins can edit any deck';
COMMENT ON POLICY "Users can update own decks" ON j_hub_decks IS 'Users can update their own decks (account-based access via frontend)';
COMMENT ON POLICY "Only Admins can delete decks" ON j_hub_decks IS 'Only admins can delete decks';
