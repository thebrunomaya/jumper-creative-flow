-- Migration: Add UNIQUE constraint to recording_id for UPSERT functionality
-- Purpose: Ensure only one transcript exists per recording (semantic correctness)
-- Context: Enables j_hub_optimization_transcribe to use UPSERT instead of INSERT
-- Author: Claude Code + Bruno Maya
-- Date: 2025-10-12

-- Add UNIQUE constraint to recording_id
-- This makes recording_id a natural key (one transcript per recording)
ALTER TABLE j_hub_optimization_transcripts
ADD CONSTRAINT uq_transcript_recording_id UNIQUE (recording_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT uq_transcript_recording_id
ON j_hub_optimization_transcripts IS
'Ensures only one transcript exists per recording. Required for UPSERT functionality in j_hub_optimization_transcribe edge function.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- recording_id is now UNIQUE, enabling Supabase .upsert() with onConflict
-- Edge function can now safely call UPSERT without DELETE logic
-- ============================================================================
