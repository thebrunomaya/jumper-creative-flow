-- Fix RLS policies for j_hub_optimization_recordings
-- Issue: Users can only see recordings THEY created, not recordings from accounts they have access to
-- Solution: Add policy that checks if user has access to the account (via j_hub_user_accounts logic)
-- Date: 2024-11-04

-- ============================================================================
-- Helper function: Check if user has access to account
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_account_access(p_account_id text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_user_email text;
  v_notion_manager_id text;
  v_has_access boolean := false;
BEGIN
  -- Get user data
  SELECT role, email, notion_manager_id
  INTO v_user_role, v_user_email, v_notion_manager_id
  FROM j_hub_users
  WHERE id = p_user_id;

  -- If user not found, no access
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- ADMIN: Has access to all accounts
  IF v_user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- STAFF: Check if user is Gestor or Atendimento for this account
  IF v_user_role = 'staff' THEN
    SELECT EXISTS (
      SELECT 1
      FROM j_hub_notion_db_accounts
      WHERE id = p_account_id::uuid
        AND (
          "Gestor" ILIKE '%' || v_user_email || '%'
          OR "Atendimento" ILIKE '%' || v_user_email || '%'
        )
    ) INTO v_has_access;
    RETURN v_has_access;
  END IF;

  -- CLIENT: Check if account's Gerente field contains user's notion_manager_id
  IF v_user_role = 'client' AND v_notion_manager_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM j_hub_notion_db_accounts
      WHERE id = p_account_id::uuid
        AND "Gerente" ILIKE '%' || v_notion_manager_id || '%'
    ) INTO v_has_access;
    RETURN v_has_access;
  END IF;

  -- Default: No access
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.user_has_account_access IS
'Checks if a user has access to an account based on their role and account relationships (Gestor, Atendimento, Gerente)';

-- ============================================================================
-- New RLS policy: Users can view recordings from accounts they have access to
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view their own recordings" ON j_hub_optimization_recordings;

-- Create new permissive policy
CREATE POLICY "Users can view recordings from accessible accounts"
ON j_hub_optimization_recordings
FOR SELECT
TO authenticated
USING (
  -- Option 1: User created the recording
  (auth.jwt() ->> 'email'::text) = recorded_by
  OR
  -- Option 2: User has access to the account
  user_has_account_access(account_id, auth.uid())
);

-- ============================================================================
-- Update INSERT policy to allow any authenticated user (will be filtered by app)
-- ============================================================================

-- Drop old restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own recordings" ON j_hub_optimization_recordings;

-- Create new insert policy
CREATE POLICY "Authenticated users can insert recordings"
ON j_hub_optimization_recordings
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must insert with their own email
  (auth.jwt() ->> 'email'::text) = recorded_by
  AND
  -- User must have access to the account
  user_has_account_access(account_id, auth.uid())
);

-- ============================================================================
-- Update DELETE policy to allow deletion from accessible accounts
-- ============================================================================

-- Drop old restrictive delete policy
DROP POLICY IF EXISTS "Users can delete their own recordings" ON j_hub_optimization_recordings;

-- Create new delete policy
CREATE POLICY "Users can delete recordings from accessible accounts"
ON j_hub_optimization_recordings
FOR DELETE
TO authenticated
USING (
  -- Option 1: User created the recording
  (auth.jwt() ->> 'email'::text) = recorded_by
  OR
  -- Option 2: User is admin
  EXISTS (
    SELECT 1
    FROM j_hub_users
    WHERE j_hub_users.id = auth.uid()
    AND j_hub_users.role = 'admin'
  )
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Users can view recordings from accessible accounts" ON j_hub_optimization_recordings IS
'Allows users to view recordings they created OR recordings from accounts they have access to (based on Gestor/Atendimento/Gerente relationships)';

COMMENT ON POLICY "Authenticated users can insert recordings" ON j_hub_optimization_recordings IS
'Allows authenticated users to create recordings for accounts they have access to';

COMMENT ON POLICY "Users can delete recordings from accessible accounts" ON j_hub_optimization_recordings IS
'Allows users to delete recordings they created, or admins to delete any recording';
