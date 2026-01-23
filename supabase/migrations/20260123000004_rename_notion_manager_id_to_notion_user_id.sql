-- Migration: Rename notion_manager_id to notion_user_id in j_hub_users
-- Purpose: Store Notion workspace user ID instead of manager page ID
--          This enables updating people fields (Gestor, Atendimento) in Notion
--
-- Background:
--   - notion_manager_id was storing a Notion PAGE ID (from managers database)
--   - notion_user_id will store Notion WORKSPACE USER ID (from people properties)
--   - Permission system will be updated to use email-based matching instead

-- Step 1: Rename the column
ALTER TABLE j_hub_users
RENAME COLUMN notion_manager_id TO notion_user_id;

-- Step 2: Update the column comment
COMMENT ON COLUMN j_hub_users.notion_user_id IS 'Notion workspace user ID for people field updates. Populated from sync when email matches a Notion user.';

-- Step 3: Clear existing values (they were page IDs, not user IDs)
-- This is safe because we're changing the permission system to email-based
UPDATE j_hub_users SET notion_user_id = NULL;

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'j_hub_users' AND column_name = 'notion_user_id'
  ) THEN
    RAISE NOTICE '✅ Column notion_user_id exists in j_hub_users';
  ELSE
    RAISE EXCEPTION '❌ Column notion_user_id not found!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'j_hub_users' AND column_name = 'notion_manager_id'
  ) THEN
    RAISE NOTICE '✅ Old column notion_manager_id has been renamed';
  ELSE
    RAISE EXCEPTION '❌ Old column notion_manager_id still exists!';
  END IF;
END $$;
