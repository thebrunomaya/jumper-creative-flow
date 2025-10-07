-- Add columns to support transcription revision tracking
ALTER TABLE public.j_ads_optimization_transcripts
ADD COLUMN original_text text,
ADD COLUMN revised_at timestamp with time zone,
ADD COLUMN revised_by text;

-- Update existing records to set original_text from full_text
UPDATE public.j_ads_optimization_transcripts
SET original_text = full_text
WHERE original_text IS NULL;