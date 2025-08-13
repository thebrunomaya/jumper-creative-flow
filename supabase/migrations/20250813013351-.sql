-- Secure sensitive table with Row Level Security and explicit deny-all policies for client roles
-- This protects phone numbers and messages from being read by unauthorized users

-- 1) Enable RLS on the table (safe to run multiple times)
ALTER TABLE public.n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;

-- 2) Create explicit deny policies for anon and authenticated roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_fila_mensagens' AND policyname = 'No select on n8n_fila_mensagens'
  ) THEN
    CREATE POLICY "No select on n8n_fila_mensagens"
    ON public.n8n_fila_mensagens
    FOR SELECT
    TO anon, authenticated
    USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_fila_mensagens' AND policyname = 'No insert on n8n_fila_mensagens'
  ) THEN
    CREATE POLICY "No insert on n8n_fila_mensagens"
    ON public.n8n_fila_mensagens
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_fila_mensagens' AND policyname = 'No update on n8n_fila_mensagens'
  ) THEN
    CREATE POLICY "No update on n8n_fila_mensagens"
    ON public.n8n_fila_mensagens
    FOR UPDATE
    TO anon, authenticated
    USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'n8n_fila_mensagens' AND policyname = 'No delete on n8n_fila_mensagens'
  ) THEN
    CREATE POLICY "No delete on n8n_fila_mensagens"
    ON public.n8n_fila_mensagens
    FOR DELETE
    TO anon, authenticated
    USING (false);
  END IF;
END $$;

-- Note: service_role bypasses RLS, so trusted server-side code (Edge Functions) will continue to work.