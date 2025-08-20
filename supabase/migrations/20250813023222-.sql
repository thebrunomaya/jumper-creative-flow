-- Adjust user_roles: clean duplicates, add unique constraint, and updated_at trigger
DO $$
BEGIN
  -- 1) Remove duplicate roles per user (keep oldest by created_at)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    WITH ranked AS (
      SELECT id, user_id, role,
             ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at ASC, id ASC) AS rn
      FROM public.user_roles
    )
    DELETE FROM public.user_roles u
    USING ranked r
    WHERE u.id = r.id AND r.rn > 1;
  END IF;

  -- 2) Add unique constraint (user_id, role) if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass
      AND conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;

  -- 3) Ensure updated_at auto-updates on change
  -- Drop old trigger if present
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'user_roles'
      AND trigger_name = 'trg_user_roles_updated_at'
  ) THEN
    DROP TRIGGER trg_user_roles_updated_at ON public.user_roles;
  END IF;

  -- Create trigger
  CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
END $$;