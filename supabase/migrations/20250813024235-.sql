-- Rename user_roles to j_ads_user_roles and update related objects
DO $$
BEGIN
  IF to_regclass('public.j_ads_user_roles') IS NULL THEN
    IF to_regclass('public.user_roles') IS NOT NULL THEN
      ALTER TABLE public.user_roles RENAME TO j_ads_user_roles;
    ELSE
      CREATE TABLE public.j_ads_user_roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role public.app_role NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    END IF;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.j_ads_user_roles ENABLE ROW LEVEL SECURITY;

-- Ensure unique constraint on (user_id, role)
DO $$ BEGIN
  IF NOT EXISTS (
     SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.j_ads_user_roles'::regclass
       AND conname = 'j_ads_user_roles_user_id_role_key'
  ) THEN
     ALTER TABLE public.j_ads_user_roles
     ADD CONSTRAINT j_ads_user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Ensure policies exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='j_ads_user_roles' AND policyname='Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.j_ads_user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='j_ads_user_roles' AND policyname='Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
    ON public.j_ads_user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Ensure updated_at trigger
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema='public' AND event_object_table='j_ads_user_roles'
      AND trigger_name='update_j_ads_user_roles_updated_at'
  ) THEN
    DROP TRIGGER update_j_ads_user_roles_updated_at ON public.j_ads_user_roles;
  END IF;

  CREATE TRIGGER update_j_ads_user_roles_updated_at
  BEFORE UPDATE ON public.j_ads_user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- Update has_role function to use the new table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.j_ads_user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;