-- Migration: Add date range and draft support to optimization recordings
-- Created: 2025-10-28
-- Description: Adds date_range_start, date_range_end, is_draft, and draft_data fields
--              to support v2.1 optimization creation flow with period selection

-- Add new columns to j_hub_optimization_recordings
ALTER TABLE j_hub_optimization_recordings
ADD COLUMN IF NOT EXISTS date_range_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS date_range_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS draft_data JSONB;

-- Add comment explaining the new fields
COMMENT ON COLUMN j_hub_optimization_recordings.date_range_start IS
'Start date of the period being analyzed in this optimization (e.g., campaign performance from Oct 15-22)';

COMMENT ON COLUMN j_hub_optimization_recordings.date_range_end IS
'End date of the period being analyzed in this optimization';

COMMENT ON COLUMN j_hub_optimization_recordings.is_draft IS
'Whether this optimization is a draft (not yet finalized/uploaded)';

COMMENT ON COLUMN j_hub_optimization_recordings.draft_data IS
'Temporary draft data (accountId, context, objectives) for auto-save feature';

-- Add index for querying drafts by user
CREATE INDEX IF NOT EXISTS idx_optimization_recordings_drafts
ON j_hub_optimization_recordings(recorded_by, is_draft)
WHERE is_draft = TRUE;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_optimization_recordings_date_range
ON j_hub_optimization_recordings(account_id, date_range_start, date_range_end);

-- Add constraint: date_range_end must be >= date_range_start (if both are set)
ALTER TABLE j_hub_optimization_recordings
ADD CONSTRAINT check_date_range_valid
CHECK (
  date_range_start IS NULL
  OR date_range_end IS NULL
  OR date_range_end >= date_range_start
);
