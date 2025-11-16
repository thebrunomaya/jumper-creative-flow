-- Fix j_hub_decks RLS policies and type inconsistency (v2 - corrected)
-- Migration created: 2024-11-03
-- Fixes: Staff access to managed accounts, Admin access, type inconsistency
-- v2: Corrected "Contas" field usage (string, not array)

-- Step 1: Fix type constraint (mediaplan → plan)
ALTER TABLE j_hub_decks DROP CONSTRAINT IF EXISTS j_hub_decks_type_check;
ALTER TABLE j_hub_decks ADD CONSTRAINT j_hub_decks_type_check
  CHECK (type IN ('report', 'plan', 'pitch'));

-- Step 2: Drop existing RLS policies (except public one)
DROP POLICY IF EXISTS "Users can view own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can create own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can update own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON j_hub_decks;

-- Bonus: Drop policies from failed migration attempt
DROP POLICY IF EXISTS "Admins can view all decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Staff can view managed account decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Clients can view own and assigned account decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Admins and Staff can create decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Admins can update all decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Staff can update managed account decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Clients can update own decks" ON j_hub_decks;
DROP POLICY IF EXISTS "Only Admins can delete decks" ON j_hub_decks;

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

-- Policy: Staff can view decks from managed accounts + own decks
-- Note: Uses POSITION() to check if UUID is contained in comma-separated "Contas" string
CREATE POLICY "Staff can view managed account decks"
  ON j_hub_decks
  FOR SELECT
  USING (
    -- Own decks
    auth.uid() = user_id
    OR
    -- Decks from accounts they manage (via j_hub_notion_db_managers)
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'staff'
        AND (
          -- If deck has account_id, check if staff manages it
          j_hub_decks.account_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM j_hub_notion_db_managers
            WHERE j_hub_notion_db_managers.notion_id = j_hub_users.notion_manager_id
              AND POSITION(j_hub_decks.account_id::text IN COALESCE(j_hub_notion_db_managers."Contas", '')) > 0
          )
        )
    )
  );

-- Policy: Clients can view own decks + decks from assigned accounts
CREATE POLICY "Clients can view own and assigned account decks"
  ON j_hub_decks
  FOR SELECT
  USING (
    -- Own decks
    auth.uid() = user_id
    OR
    -- Decks from accounts they have access to (via j_hub_user_accounts Edge Function logic)
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'client'
        AND (
          -- If deck has account_id, check if client has access
          j_hub_decks.account_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM j_hub_notion_db_managers
            WHERE j_hub_notion_db_managers.notion_id = j_hub_users.notion_manager_id
              AND POSITION(j_hub_decks.account_id::text IN COALESCE(j_hub_notion_db_managers."Contas", '')) > 0
          )
        )
    )
  );

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

-- Policy: Staff can update decks from managed accounts + own decks
CREATE POLICY "Staff can update managed account decks"
  ON j_hub_decks
  FOR UPDATE
  USING (
    -- Own decks
    auth.uid() = user_id
    OR
    -- Decks from accounts they manage
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'staff'
        AND (
          j_hub_decks.account_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM j_hub_notion_db_managers
            WHERE j_hub_notion_db_managers.notion_id = j_hub_users.notion_manager_id
              AND POSITION(j_hub_decks.account_id::text IN COALESCE(j_hub_notion_db_managers."Contas", '')) > 0
          )
        )
    )
  )
  WITH CHECK (
    -- Same logic for WITH CHECK
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'staff'
        AND (
          j_hub_decks.account_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM j_hub_notion_db_managers
            WHERE j_hub_notion_db_managers.notion_id = j_hub_users.notion_manager_id
              AND POSITION(j_hub_decks.account_id::text IN COALESCE(j_hub_notion_db_managers."Contas", '')) > 0
          )
        )
    )
  );

-- Policy: Clients can only update their own decks
CREATE POLICY "Clients can update own decks"
  ON j_hub_decks
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'client'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
        AND j_hub_users.role = 'client'
    )
  );

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
COMMENT ON POLICY "Staff can view managed account decks" ON j_hub_decks IS 'Staff can view decks from accounts they manage + own decks';
COMMENT ON POLICY "Clients can view own and assigned account decks" ON j_hub_decks IS 'Clients can view own decks + decks from assigned accounts';
COMMENT ON POLICY "Admins and Staff can create decks" ON j_hub_decks IS 'Only admins and staff can create decks';
COMMENT ON POLICY "Admins can update all decks" ON j_hub_decks IS 'Admins can edit any deck';
COMMENT ON POLICY "Staff can update managed account decks" ON j_hub_decks IS 'Staff can edit decks from managed accounts';
COMMENT ON POLICY "Clients can update own decks" ON j_hub_decks IS 'Clients can only edit their own decks';
COMMENT ON POLICY "Only Admins can delete decks" ON j_hub_decks IS 'Only admins can delete decks';
