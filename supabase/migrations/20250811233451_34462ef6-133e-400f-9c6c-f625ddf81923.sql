-- 1) Enum de roles vindos do Notion
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notion_role') THEN
    CREATE TYPE public.notion_role AS ENUM ('admin','gestor','supervisor','gerente');
  END IF;
END $$;

-- 2) Tabela de gerentes do Notion
CREATE TABLE IF NOT EXISTS public.notion_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id text NOT NULL,
  email text NOT NULL,
  name text,
  role public.notion_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garantias de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_notion_managers_notion_id_unique ON public.notion_managers (notion_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notion_managers_lower_email_unique ON public.notion_managers ((lower(email)));

-- Trigger para updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_notion_managers_updated_at'
  ) THEN
    CREATE TRIGGER update_notion_managers_updated_at
    BEFORE UPDATE ON public.notion_managers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Tabela de vínculo gerente -> contas (por notion_id de conta)
CREATE TABLE IF NOT EXISTS public.notion_manager_accounts (
  manager_id uuid NOT NULL REFERENCES public.notion_managers(id) ON DELETE CASCADE,
  account_notion_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (manager_id, account_notion_id)
);

-- Índice de busca por conta
CREATE INDEX IF NOT EXISTS idx_notion_manager_accounts_account ON public.notion_manager_accounts (account_notion_id);

-- 4) Preparar accounts para upsert por notion_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_notion_id_unique ON public.accounts (notion_id);

-- 5) Habilitar RLS
ALTER TABLE public.notion_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_manager_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 6) Políticas: leitura admin para tabelas de Notion
DROP POLICY IF EXISTS "Admins can view notion managers" ON public.notion_managers;
CREATE POLICY "Admins can view notion managers"
ON public.notion_managers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view notion manager accounts" ON public.notion_manager_accounts;
CREATE POLICY "Admins can view notion manager accounts"
ON public.notion_manager_accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7) Políticas de leitura de accounts guiadas por Notion
DROP POLICY IF EXISTS "Admins (Supabase) can view all accounts" ON public.accounts;
CREATE POLICY "Admins (Supabase) can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins (Notion) can view all accounts" ON public.accounts;
CREATE POLICY "Admins (Notion) can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.notion_managers m
    WHERE lower(m.email) = lower(auth.jwt() ->> 'email')
      AND m.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Managers can view their linked accounts" ON public.accounts;
CREATE POLICY "Managers can view their linked accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.notion_managers m
    JOIN public.notion_manager_accounts l ON l.manager_id = m.id
    WHERE lower(m.email) = lower(auth.jwt() ->> 'email')
      AND l.account_notion_id = public.accounts.notion_id
  )
);
