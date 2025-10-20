-- Migration: Add 'enhance_transcription' step to API logs constraint
-- Created: 2025-10-20
-- Purpose: Allow logging of automatic transcription enhancement step (Claude post-processing)

-- ============================================================================
-- Fix CHECK CONSTRAINT on j_hub_optimization_api_logs.step
-- ============================================================================

-- Drop existing constraint
ALTER TABLE j_hub_optimization_api_logs
DROP CONSTRAINT IF EXISTS j_ads_optimization_api_logs_step_check;

-- Recreate constraint with 'enhance_transcription' added
ALTER TABLE j_hub_optimization_api_logs
ADD CONSTRAINT j_ads_optimization_api_logs_step_check
CHECK (step = ANY (ARRAY[
  'transcribe'::text,              -- Whisper API transcription
  'enhance_transcription'::text,   -- Claude automatic enhancement (NEW!)
  'process'::text,                 -- Organize into bullets
  'analyze'::text,                 -- Extract structured context
  'improve_transcript'::text,      -- Manual AI improvement of transcript
  'improve_processed'::text        -- Manual AI improvement of processed text
]));

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'CHECK CONSTRAINT updated successfully';
  RAISE NOTICE 'New allowed steps: transcribe, enhance_transcription, process, analyze, improve_transcript, improve_processed';
END $$;
