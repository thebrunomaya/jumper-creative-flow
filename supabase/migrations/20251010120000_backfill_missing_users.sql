-- ============================================
-- BACKFILL: Fix missing/incomplete users in j_ads_users
-- Created: 2025-10-10
-- ============================================
--
-- This migration fixes two issues:
-- 1. Claudio Wender (claudio@jumper.studio) - missing from j_ads_users
-- 2. Pedro Waghabi (pedro@jumper.studio) - has empty nome field
--
-- IMPORTANT: This is a manual backfill migration.
-- The Edge Function j_ads_auth_roles has been fixed to prevent future issues.

-- ============================================
-- STEP 1: Insert Claudio Wender if missing
-- ============================================

-- First, get user data from auth.users
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_nome TEXT;
  v_role TEXT := 'staff'; -- Default role, can be changed to 'manager' if needed
BEGIN
  -- Get user data from auth.users
  SELECT id, email, raw_user_meta_data->>'full_name'
  INTO v_user_id, v_email, v_nome
  FROM auth.users
  WHERE email = 'claudio@jumper.studio';

  -- If user exists in auth.users
  IF v_user_id IS NOT NULL THEN
    -- Check if already in j_ads_users
    IF NOT EXISTS (SELECT 1 FROM j_ads_users WHERE id = v_user_id) THEN
      -- Insert into j_ads_users
      INSERT INTO j_ads_users (id, email, role, nome)
      VALUES (
        v_user_id,
        v_email,
        v_role,
        COALESCE(v_nome, split_part(v_email, '@', 1))
      );
      RAISE NOTICE 'Inserted Claudio Wender into j_ads_users';
    ELSE
      RAISE NOTICE 'Claudio Wender already exists in j_ads_users';
    END IF;
  ELSE
    RAISE NOTICE 'Claudio Wender not found in auth.users';
  END IF;
END $$;

-- ============================================
-- STEP 2: Update Pedro Waghabi if nome is empty
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_nome TEXT;
  v_current_nome TEXT;
BEGIN
  -- Get user data from auth.users
  SELECT id, email, raw_user_meta_data->>'full_name'
  INTO v_user_id, v_email, v_nome
  FROM auth.users
  WHERE email = 'pedro@jumper.studio';

  -- If user exists in auth.users
  IF v_user_id IS NOT NULL THEN
    -- Get current nome from j_ads_users
    SELECT nome INTO v_current_nome
    FROM j_ads_users
    WHERE id = v_user_id;

    -- If nome is empty or NULL
    IF v_current_nome IS NULL OR trim(v_current_nome) = '' THEN
      UPDATE j_ads_users
      SET nome = COALESCE(v_nome, split_part(v_email, '@', 1))
      WHERE id = v_user_id;
      RAISE NOTICE 'Updated Pedro Waghabi nome in j_ads_users';
    ELSE
      RAISE NOTICE 'Pedro Waghabi nome already populated: %', v_current_nome;
    END IF;
  ELSE
    RAISE NOTICE 'Pedro Waghabi not found in auth.users';
  END IF;
END $$;

-- ============================================
-- STEP 3: Fix any other users with empty nome
-- ============================================

-- Update all users in j_ads_users with empty nome using data from auth.users
UPDATE j_ads_users
SET nome = COALESCE(
  auth.users.raw_user_meta_data->>'full_name',
  auth.users.raw_user_meta_data->>'name',
  split_part(auth.users.email, '@', 1)
)
FROM auth.users
WHERE j_ads_users.id = auth.users.id
  AND (j_ads_users.nome IS NULL OR trim(j_ads_users.nome) = '');

-- Verification: List all users with their nome
-- Uncomment to see results after running this migration:
-- SELECT id, email, nome, role FROM j_ads_users ORDER BY email;
