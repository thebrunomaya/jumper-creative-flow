-- 1) Enum para status das submissões
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('pending', 'queued', 'processing', 'processed', 'error');
  END IF;
END $$;

-- 2) Tabela principal de submissões
CREATE TABLE IF NOT EXISTS public.creative_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  manager_id UUID,
  status public.submission_status NOT NULL DEFAULT 'pending',
  client TEXT,
  partner TEXT,
  platform TEXT,
  creative_type TEXT,
  campaign_objective TEXT,
  total_variations INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- gatilho de updated_at
DROP TRIGGER IF EXISTS trg_update_creative_submissions_updated_at ON public.creative_submissions;
CREATE TRIGGER trg_update_creative_submissions_updated_at
BEFORE UPDATE ON public.creative_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Tabela de arquivos por submissão/variação
CREATE TABLE IF NOT EXISTS public.creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.creative_submissions(id) ON DELETE CASCADE,
  variation_index INTEGER NOT NULL,
  name TEXT,
  type TEXT,
  size INTEGER,
  format TEXT,
  instagram_url TEXT,
  storage_path TEXT,
  public_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_creative_files_submission_id ON public.creative_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_creative_submissions_status_created ON public.creative_submissions(status, created_at);

-- 5) RLS
ALTER TABLE public.creative_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_files ENABLE ROW LEVEL SECURITY;

-- Policies: creative_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creative_submissions' AND policyname = 'Users can select their own submissions'
  ) THEN
    CREATE POLICY "Users can select their own submissions"
      ON public.creative_submissions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creative_submissions' AND policyname = 'Users can insert their own submissions'
  ) THEN
    CREATE POLICY "Users can insert their own submissions"
      ON public.creative_submissions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies: creative_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creative_files' AND policyname = 'Users can select files of their submissions'
  ) THEN
    CREATE POLICY "Users can select files of their submissions"
      ON public.creative_files
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.creative_submissions s
        WHERE s.id = creative_files.submission_id AND s.user_id = auth.uid()
      ));
  END IF;
END $$;
