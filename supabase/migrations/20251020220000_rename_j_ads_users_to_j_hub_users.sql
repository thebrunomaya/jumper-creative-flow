-- Migration: Rename all j_ads_users references to j_hub_users
-- Created: 2025-10-20
-- Purpose: Standardize naming convention - table is j_hub_users, all related objects should follow same pattern
-- Context: Legacy constraints/triggers used old j_ads_users prefix, causing confusion

-- ============================================================================
-- RENAME CONSTRAINTS
-- ============================================================================

-- 1. CHECK constraint for role validation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'j_ads_users_role_check') THEN
    ALTER TABLE j_hub_users RENAME CONSTRAINT j_ads_users_role_check TO j_hub_users_role_check;
  END IF;
END $$;

-- 2. UNIQUE constraint for email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'j_ads_users_email_key') THEN
    ALTER TABLE j_hub_users RENAME CONSTRAINT j_ads_users_email_key TO j_hub_users_email_key;
  END IF;
END $$;

-- 3. FOREIGN KEY: deactivated_by references j_hub_users(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'j_ads_users_deactivated_by_fkey') THEN
    ALTER TABLE j_hub_users RENAME CONSTRAINT j_ads_users_deactivated_by_fkey TO j_hub_users_deactivated_by_fkey;
  END IF;
END $$;

-- 4. FOREIGN KEY: id references auth.users(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'j_ads_users_id_fkey') THEN
    ALTER TABLE j_hub_users RENAME CONSTRAINT j_ads_users_id_fkey TO j_hub_users_id_fkey;
  END IF;
END $$;

-- ============================================================================
-- RENAME TRIGGER
-- ============================================================================

-- Drop old trigger and recreate with correct name
DROP TRIGGER IF EXISTS update_j_ads_users_updated_at ON j_hub_users;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_j_hub_users_updated_at'
    AND tgrelid = 'j_hub_users'::regclass
  ) THEN
    CREATE TRIGGER update_j_hub_users_updated_at
      BEFORE UPDATE ON j_hub_users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- UPDATE FUNCTION REFERENCES (if function exists)
-- ============================================================================

-- Check if has_role function exists and references j_ads_users table
DO $$
BEGIN
  -- Recreate has_role function with correct table reference
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
      user_role text;
    BEGIN
      -- Fetch user role from j_hub_users (not j_ads_users)
      SELECT role INTO user_role FROM public.j_hub_users WHERE id = _user_id;
      RETURN user_role = _role;
    END;
    $function$;

    RAISE NOTICE 'has_role() function updated to reference j_hub_users';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count renamed constraints
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'j_hub_users'::regclass
  AND conname LIKE 'j_hub_users%';

  -- Count renamed triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'j_hub_users'::regclass
  AND tgname LIKE 'update_j_hub_users%';

  RAISE NOTICE '✅ Renamed constraints: %', constraint_count;
  RAISE NOTICE '✅ Renamed triggers: %', trigger_count;
  RAISE NOTICE '✅ All j_ads_users references updated to j_hub_users';

  -- Verify no old names remain
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'j_hub_users'::regclass
    AND conname LIKE 'j_ads_users%'
  ) THEN
    RAISE EXCEPTION '❌ ERROR: Still found constraints with j_ads_users prefix!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'j_hub_users'::regclass
    AND tgname LIKE 'update_j_ads_users%'
  ) THEN
    RAISE EXCEPTION '❌ ERROR: Still found triggers with j_ads_users prefix!';
  END IF;

  RAISE NOTICE '✅ Verification complete - no legacy j_ads_users names found';
END $$;
