-- Add versioning fields to transcripts table
-- This enables simple undo functionality (1 previous version only)

ALTER TABLE j_ads_optimization_transcripts
ADD COLUMN IF NOT EXISTS previous_version TEXT,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_optimization_transcripts_edited
ON j_ads_optimization_transcripts(last_edited_at DESC);

-- Add comments
COMMENT ON COLUMN j_ads_optimization_transcripts.previous_version IS
'Backup of the previous version (for simple undo). Only stores 1 version.';

COMMENT ON COLUMN j_ads_optimization_transcripts.last_edited_at IS
'Timestamp of last edit (manual or AI-assisted)';

COMMENT ON COLUMN j_ads_optimization_transcripts.last_edited_by IS
'User who made the last edit';

COMMENT ON COLUMN j_ads_optimization_transcripts.edit_count IS
'Number of times this transcript has been edited';
