-- Revert accidental renames for accounts and partners
-- 1) Rename tables back and (re)create RLS policies only for these two tables

-- Revert j_ads_accounts -> accounts
DO $$
BEGIN
  IF to_regclass('public.j_ads_accounts') IS NOT NULL THEN
    -- Drop existing policies tied to j_ads_accounts (if they exist)
    BEGIN
      DROP POLICY IF EXISTS "Admins (Notion) can view all j_ads_accounts" ON public.j_ads_accounts;
    EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN
      DROP POLICY IF EXISTS "Admins (Supabase) can view all j_ads_accounts" ON public.j_ads_accounts;
    EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN
      DROP POLICY IF EXISTS "Managers can view their linked j_ads_accounts" ON public.j_ads_accounts;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    -- Rename table
    ALTER TABLE public.j_ads_accounts RENAME TO accounts;

    -- Ensure RLS is enabled
    ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

    -- Recreate policies on the new table name
    CREATE POLICY "Admins (Notion) can view all accounts"
    ON public.accounts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.j_ads_notion_managers m
        WHERE lower(m.email) = lower((auth.jwt() ->> 'email')) AND m.role = 'admin'::notion_role
      )
    );

    CREATE POLICY "Admins (Supabase) can view all accounts"
    ON public.accounts
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

    CREATE POLICY "Managers can view their linked accounts"
    ON public.accounts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.j_ads_notion_managers m
        JOIN public.j_ads_notion_manager_accounts l ON l.manager_id = m.id
        WHERE lower(m.email) = lower((auth.jwt() ->> 'email'))
          AND l.account_notion_id = accounts.notion_id
      )
    );
  END IF;
END $$;

-- Revert j_ads_partners -> partners
DO $$
BEGIN
  IF to_regclass('public.j_ads_partners') IS NOT NULL THEN
    -- Drop existing policies tied to j_ads_partners (if they exist)
    BEGIN
      DROP POLICY IF EXISTS "j_ads_partners are publicly readable" ON public.j_ads_partners;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    -- Rename table
    ALTER TABLE public.j_ads_partners RENAME TO partners;

    -- Ensure RLS is enabled
    ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

    -- Recreate public read policy
    CREATE POLICY "partners are publicly readable"
    ON public.partners
    FOR SELECT
    USING (true);
  END IF;
END $$;