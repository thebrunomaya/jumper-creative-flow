/**
 * Fix ambiguous column references in save RPC functions
 * Error: column reference "full_text" is ambiguous
 * Solution: Explicitly qualify column names with table name
 */

-- Recreate save_transcript_edit with explicit table qualification
CREATE OR REPLACE FUNCTION public.save_transcript_edit(
  p_recording_id uuid,
  p_new_text text,
  p_user_id uuid
)
RETURNS TABLE (
  full_text text,
  previous_version text,
  edit_count integer,
  last_edited_at timestamp with time zone,
  last_edited_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_text text;
BEGIN
  -- Get current text value first
  SELECT t.full_text INTO v_current_text
  FROM j_hub_optimization_transcripts t
  WHERE t.recording_id = p_recording_id;

  IF v_current_text IS NULL THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;

  -- Update transcript and return updated row
  RETURN QUERY
  UPDATE j_hub_optimization_transcripts t
  SET
    previous_version = v_current_text,
    full_text = p_new_text,
    last_edited_at = NOW(),
    last_edited_by = p_user_id,
    edit_count = COALESCE(t.edit_count, 0) + 1
  WHERE t.recording_id = p_recording_id
  RETURNING
    t.full_text,
    t.previous_version,
    t.edit_count,
    t.last_edited_at,
    t.last_edited_by;
END;
$function$;

-- Recreate save_processed_edit with explicit table qualification
CREATE OR REPLACE FUNCTION public.save_processed_edit(
  p_recording_id uuid,
  p_new_text text,
  p_user_id uuid
)
RETURNS TABLE (
  processed_text text,
  processed_previous_version text,
  processed_edit_count integer,
  processed_last_edited_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_processed_text text;
BEGIN
  -- Get current processed text value first
  SELECT t.processed_text INTO v_current_processed_text
  FROM j_hub_optimization_transcripts t
  WHERE t.recording_id = p_recording_id;

  IF v_current_processed_text IS NULL THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;

  -- Update processed text and return updated row
  RETURN QUERY
  UPDATE j_hub_optimization_transcripts t
  SET
    processed_previous_version = v_current_processed_text,
    processed_text = p_new_text,
    processed_last_edited_at = NOW(),
    processed_edit_count = COALESCE(t.processed_edit_count, 0) + 1
  WHERE t.recording_id = p_recording_id
  RETURNING
    t.processed_text,
    t.processed_previous_version,
    t.processed_edit_count,
    t.processed_last_edited_at;
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.save_transcript_edit IS 'Save transcript edit with versioning - Fixed ambiguous column reference';
COMMENT ON FUNCTION public.save_processed_edit IS 'Save processed text edit with versioning - Fixed ambiguous column reference';
