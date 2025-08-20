-- Rename core tables to j_ads_* prefix and recreate RLS policies with correct references

-- 1) Drop existing policies on old tables to avoid broken references after rename
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='accounts') THEN
    DROP POLICY IF EXISTS "Admins (Notion) can view all accounts" ON public.accounts;
    DROP POLICY IF EXISTS "Admins (Supabase) can view all accounts" ON public.accounts;
    DROP POLICY IF EXISTS "Managers can view their linked accounts" ON public.accounts;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='creative_files') THEN
    DROP POLICY IF EXISTS "Users can select files of their submissions" ON public.creative_files;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='creative_submissions') THEN
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.creative_submissions;
    DROP POLICY IF EXISTS "Users can select their own submissions" ON public.creative_submissions;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='creative_variations') THEN
    DROP POLICY IF EXISTS "Users can insert variations of their submissions" ON public.creative_variations;
    DROP POLICY IF EXISTS "Users can view variations of their submissions" ON public.creative_variations;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notion_manager_accounts') THEN
    DROP POLICY IF EXISTS "Admins can view notion manager accounts" ON public.notion_manager_accounts;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notion_managers') THEN
    DROP POLICY IF EXISTS "Admins can view notion managers" ON public.notion_managers;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners') THEN
    DROP POLICY IF EXISTS "Partners are publicly readable" ON public.partners;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='error_logs') THEN
    DROP POLICY IF EXISTS "Users can insert error logs" ON public.error_logs;
    DROP POLICY IF EXISTS "Users can update their own error logs" ON public.error_logs;
    DROP POLICY IF EXISTS "Users can view their own error logs" ON public.error_logs;
  END IF;
END $$;

-- 2) Rename tables
ALTER TABLE public.accounts RENAME TO j_ads_accounts;
ALTER TABLE public.creative_submissions RENAME TO j_ads_creative_submissions;
ALTER TABLE public.creative_files RENAME TO j_ads_creative_files;
ALTER TABLE public.creative_variations RENAME TO j_ads_creative_variations;
ALTER TABLE public.error_logs RENAME TO j_ads_error_logs;
ALTER TABLE public.partners RENAME TO j_ads_partners;
ALTER TABLE public.notion_manager_accounts RENAME TO j_ads_notion_manager_accounts;
ALTER TABLE public.notion_managers RENAME TO j_ads_notion_managers;

-- 3) Ensure RLS is enabled on renamed tables
ALTER TABLE public.j_ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_creative_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_creative_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_creative_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_notion_manager_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j_ads_notion_managers ENABLE ROW LEVEL SECURITY;

-- 4) Recreate policies with updated references
-- j_ads_accounts
CREATE POLICY "Admins (Notion) can view all j_ads_accounts"
ON public.j_ads_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_notion_managers m
    WHERE lower(m.email) = lower((auth.jwt() ->> 'email')) AND m.role = 'admin'::notion_role
  )
);

CREATE POLICY "Admins (Supabase) can view all j_ads_accounts"
ON public.j_ads_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their linked j_ads_accounts"
ON public.j_ads_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_notion_managers m
    JOIN public.j_ads_notion_manager_accounts l ON l.manager_id = m.id
    WHERE lower(m.email) = lower((auth.jwt() ->> 'email'))
      AND l.account_notion_id = j_ads_accounts.notion_id
  )
);

-- j_ads_creative_submissions
CREATE POLICY "Users can insert their own j_ads_submissions"
ON public.j_ads_creative_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own j_ads_submissions"
ON public.j_ads_creative_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- j_ads_creative_files
CREATE POLICY "Users can select files of their j_ads_submissions"
ON public.j_ads_creative_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_creative_submissions s
    WHERE s.id = j_ads_creative_files.submission_id AND s.user_id = auth.uid()
  )
);

-- j_ads_creative_variations
CREATE POLICY "Users can insert variations of their j_ads_submissions"
ON public.j_ads_creative_variations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.j_ads_creative_submissions s
    WHERE s.id = j_ads_creative_variations.submission_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view variations of their j_ads_submissions"
ON public.j_ads_creative_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_creative_submissions s
    WHERE s.id = j_ads_creative_variations.submission_id AND s.user_id = auth.uid()
  )
);

-- j_ads_notion_manager_accounts
CREATE POLICY "Admins can view j_ads_notion_manager_accounts"
ON public.j_ads_notion_manager_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- j_ads_notion_managers
CREATE POLICY "Admins can view j_ads_notion_managers"
ON public.j_ads_notion_managers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- j_ads_partners
CREATE POLICY "j_ads_partners are publicly readable"
ON public.j_ads_partners
FOR SELECT
USING (true);

-- j_ads_error_logs
CREATE POLICY "Users can insert j_ads_error_logs"
ON public.j_ads_error_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own j_ads_error_logs"
ON public.j_ads_error_logs
FOR UPDATE
USING ((user_email)::text = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can view their own j_ads_error_logs"
ON public.j_ads_error_logs
FOR SELECT
USING ((user_email)::text = (auth.jwt() ->> 'email'));
