-- ============================================================================
-- Fix handle_new_user() trigger function - Update old table name
-- ============================================================================
-- Issue: Function references j_ads_notion_db_managers (old name)
-- Should reference: j_hub_notion_db_managers (current name)
-- Error: "relation public.j_ads_notion_db_managers does not exist"
-- Impact: Magic link and OAuth logins fail with 500 error
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
  user_nome TEXT;
  manager_notion_id TEXT;
BEGIN
  IF new.raw_app_meta_data->>'provider' = 'notion' THEN
    user_role := 'staff';
  ELSE
    user_role := 'client';
    SELECT "Nome", notion_id INTO user_nome, manager_notion_id
    FROM public.j_hub_notion_db_managers  -- ✅ FIXED: Was j_ads_notion_db_managers
    WHERE LOWER("E-Mail") = LOWER(new.email)
    LIMIT 1;
  END IF;

  INSERT INTO public.j_hub_users (id, email, role, nome, notion_manager_id, last_login_at)
  VALUES (new.id, new.email, user_role, COALESCE(user_nome, new.raw_user_meta_data->>'full_name', new.email), manager_notion_id, now())
  ON CONFLICT (id) DO UPDATE
    SET last_login_at = now(),
        nome = COALESCE(EXCLUDED.nome, j_hub_users.nome);

  RETURN new;
END;
$$;

-- Verify the trigger is still attached to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    -- Recreate trigger if missing
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    RAISE NOTICE 'Trigger on_auth_user_created recreated';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created already exists';
  END IF;
END $$;

-- ============================================================================
-- TESTING
-- ============================================================================
-- After applying this migration, test with:
-- 1. Magic link login (yan@jumper.studio)
-- 2. Notion OAuth login
-- Both should now work without 500 error
-- ============================================================================
