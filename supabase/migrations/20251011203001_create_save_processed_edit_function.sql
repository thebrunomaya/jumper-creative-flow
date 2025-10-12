-- RPC function to save processed_text edits with automatic versioning
-- Moves current processed_text to processed_previous_version before saving new text

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
  UPDATE j_ads_optimization_transcripts
  SET
    processed_previous_version = processed_text,
    processed_text = p_new_text,
    processed_last_edited_at = NOW(),
    processed_last_edited_by = p_user_id,
    processed_edit_count = COALESCE(processed_edit_count, 0) + 1
  WHERE recording_id = p_recording_id;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION save_processed_edit IS
'Saves processed text edits with automatic versioning. Moves current text to previous_version for undo functionality.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_processed_edit TO authenticated;
