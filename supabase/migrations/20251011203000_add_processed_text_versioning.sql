-- Add versioning fields for processed_text (Step 2 - Organização em Tópicos)
-- Similar to full_text versioning, but for the AI-processed bullet points

ALTER TABLE j_ads_optimization_transcripts
ADD COLUMN IF NOT EXISTS processed_previous_version TEXT,
ADD COLUMN IF NOT EXISTS processed_last_edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processed_last_edited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS processed_edit_count INTEGER DEFAULT 0;

-- Add comments explaining each field
COMMENT ON COLUMN j_ads_optimization_transcripts.processed_previous_version IS
'Previous version of processed text (organized bullets) for undo functionality. Only stores one level of history.';

COMMENT ON COLUMN j_ads_optimization_transcripts.processed_last_edited_at IS
'Timestamp of last edit to processed text (manual edit or AI adjustment).';

COMMENT ON COLUMN j_ads_optimization_transcripts.processed_last_edited_by IS
'User ID who last edited the processed text.';

COMMENT ON COLUMN j_ads_optimization_transcripts.processed_edit_count IS
'Counter tracking how many times the processed text has been edited (manual or AI-assisted).';
