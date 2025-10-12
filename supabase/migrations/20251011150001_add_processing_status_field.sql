-- ============================================================================
-- Add processing_status field to j_ads_optimization_recordings
-- Tracks Step 2: Claude bullet organization status (separate from transcription)
-- ============================================================================

-- Add new column
ALTER TABLE j_ads_optimization_recordings
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add comment
COMMENT ON COLUMN j_ads_optimization_recordings.processing_status IS
'Status do Passo 2: Organização em bullets com Claude Sonnet 4.5';

-- Create index for queries filtering by this status
CREATE INDEX IF NOT EXISTS idx_recordings_processing_status
ON j_ads_optimization_recordings(processing_status);

-- Composite index for common queries (account + all statuses)
CREATE INDEX IF NOT EXISTS idx_recordings_account_statuses
ON j_ads_optimization_recordings(account_id, transcription_status, processing_status, analysis_status);

-- ============================================================================
-- EXPLANATION OF STATUS FIELDS
-- ============================================================================
--
-- j_ads_optimization_recordings now has 3 independent status fields:
--
-- 1. transcription_status (Step 1: Whisper)
--    pending → processing → completed/failed
--    Result: j_ads_optimization_transcripts.full_text
--
-- 2. processing_status (Step 2: Claude Bullets) ← NEW
--    pending → processing → completed/failed
--    Result: j_ads_optimization_transcripts.processed_text
--
-- 3. analysis_status (Step 3: Final Analysis)
--    pending → processing → completed/failed
--    Result: j_ads_optimization_context (full JSON)
--
-- This allows users to pause and review between steps
-- ============================================================================
