-- RPC function to save transcript edits with versioning
-- Moves current version to previous_version backup before saving new text

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
  UPDATE j_ads_optimization_transcripts
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
'Saves transcript edits with simple versioning. Moves current text to previous_version backup before saving new text.';
