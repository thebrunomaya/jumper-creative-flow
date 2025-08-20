-- Create table to store Notion-processed creative variations
CREATE TABLE IF NOT EXISTS public.creative_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  variation_index integer NOT NULL,
  notion_page_id text NOT NULL,
  creative_id text NOT NULL,
  full_creative_name text NOT NULL,
  cta text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key to creative_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'creative_variations_submission_fk'
  ) THEN
    ALTER TABLE public.creative_variations
      ADD CONSTRAINT creative_variations_submission_fk
      FOREIGN KEY (submission_id)
      REFERENCES public.creative_submissions (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure one row per variation per submission
CREATE UNIQUE INDEX IF NOT EXISTS creative_variations_submission_variation_uidx
  ON public.creative_variations (submission_id, variation_index);

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS creative_variations_submission_idx
  ON public.creative_variations (submission_id);

-- Enable Row Level Security
ALTER TABLE public.creative_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view variations of their submissions" ON public.creative_variations;
CREATE POLICY "Users can view variations of their submissions"
ON public.creative_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creative_submissions s
    WHERE s.id = creative_variations.submission_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert variations of their submissions" ON public.creative_variations;
CREATE POLICY "Users can insert variations of their submissions"
ON public.creative_variations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creative_submissions s
    WHERE s.id = creative_variations.submission_id
      AND s.user_id = auth.uid()
  )
);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_creative_variations_updated_at ON public.creative_variations;
CREATE TRIGGER update_creative_variations_updated_at
BEFORE UPDATE ON public.creative_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();