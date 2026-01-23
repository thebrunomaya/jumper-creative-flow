-- Fix: Ensure notion_user_id column exists in j_hub_users
-- If notion_manager_id still exists, rename it
-- If neither exists, add notion_user_id

DO $$
BEGIN
  -- Check if notion_manager_id exists (needs to be renamed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'j_hub_users' AND column_name = 'notion_manager_id'
  ) THEN
    ALTER TABLE j_hub_users RENAME COLUMN notion_manager_id TO notion_user_id;
    RAISE NOTICE '✅ Renamed notion_manager_id to notion_user_id';

  -- Check if notion_user_id already exists (already done)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'j_hub_users' AND column_name = 'notion_user_id'
  ) THEN
    RAISE NOTICE '✅ Column notion_user_id already exists';

  -- Neither exists, add the column
  ELSE
    ALTER TABLE j_hub_users ADD COLUMN notion_user_id TEXT;
    RAISE NOTICE '✅ Added notion_user_id column';
  END IF;
END $$;

-- Update column comment
COMMENT ON COLUMN j_hub_users.notion_user_id IS 'Notion workspace user ID for people field updates. Populated from sync when email matches a Notion user.';
