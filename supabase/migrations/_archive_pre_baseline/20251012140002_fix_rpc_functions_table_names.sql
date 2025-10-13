-- Migration: Fix RPC functions to use new table names (j_hub_optimization_*)
-- Purpose: Update save_transcript_edit and save_processed_edit to reference j_hub tables
-- Context: Migration 20251012000000 renamed j_ads_optimization_* → j_hub_optimization_*
--           but RPC functions still reference old names, causing save errors
-- Author: Claude Code + Bruno Maya
-- Date: 2025-10-12

-- ============================================================================
-- Fix save_transcript_edit function
-- ============================================================================

CREATE OR REPLACE FUNCTION save_transcript_edit(
  p_recording_id UUID,
  p_new_text TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Move current version to backup and save new version
  UPDATE j_hub_optimization_transcripts  -- ✅ FIXED: Use new table name
  SET
    previous_version = full_text,           -- Backup current version
    full_text = p_new_text,                 -- Save new version
    last_edited_at = NOW(),
    last_edited_by = p_user_id,
    edit_count = COALESCE(edit_count, 0) + 1
  WHERE recording_id = p_recording_id;

  -- If no rows were updated, the transcript doesn't exist yet
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_transcript_edit(UUID, TEXT, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION save_transcript_edit IS
'Saves transcript edits with simple versioning. Moves current text to previous_version backup before saving new text. FIXED: Now uses j_hub_optimization_transcripts.';

-- ============================================================================
-- Fix save_processed_edit function
-- ============================================================================

CREATE OR REPLACE FUNCTION save_processed_edit(
  p_recording_id UUID,
  p_new_text TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Move current version to backup and save new version
  UPDATE j_hub_optimization_transcripts  -- ✅ FIXED: Use new table name
  SET
    processed_previous = processed_text,    -- Backup current processed version
    processed_text = p_new_text,            -- Save new processed version
    processed_edited_at = NOW(),
    processed_edited_by = p_user_id,
    processed_edit_count = COALESCE(processed_edit_count, 0) + 1
  WHERE recording_id = p_recording_id;

  -- If no rows were updated, the transcript doesn't exist yet
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_processed_edit(UUID, TEXT, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION save_processed_edit IS
'Saves processed text edits with versioning. Moves current processed_text to processed_previous backup before saving. FIXED: Now uses j_hub_optimization_transcripts.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Both RPC functions now correctly reference j_hub_optimization_transcripts
-- This fixes the "save edited transcript" error reported by user
-- ============================================================================
