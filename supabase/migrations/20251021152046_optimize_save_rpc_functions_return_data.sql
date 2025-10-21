/**
 * Optimize save_transcript_edit and save_processed_edit RPC functions
 * Change from RETURNS void to RETURNS TABLE to return updated data
 * This eliminates the need for full loadRecording() after save
 */

-- Drop existing functions
DROP FUNCTION IF EXISTS public.save_transcript_edit(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.save_processed_edit(uuid, text, uuid);

-- Recreate save_transcript_edit with RETURNS TABLE
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
BEGIN
  -- Update transcript and return updated row
  RETURN QUERY
  UPDATE j_hub_optimization_transcripts
  SET
    previous_version = full_text,
    full_text = p_new_text,
    last_edited_at = NOW(),
    last_edited_by = p_user_id,
    edit_count = COALESCE(edit_count, 0) + 1
  WHERE recording_id = p_recording_id
  RETURNING
    j_hub_optimization_transcripts.full_text,
    j_hub_optimization_transcripts.previous_version,
    j_hub_optimization_transcripts.edit_count,
    j_hub_optimization_transcripts.last_edited_at,
    j_hub_optimization_transcripts.last_edited_by;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;
END;
$function$;

-- Recreate save_processed_edit with RETURNS TABLE
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
BEGIN
  -- Update processed text and return updated row
  RETURN QUERY
  UPDATE j_hub_optimization_transcripts
  SET
    processed_previous_version = processed_text,
    processed_text = p_new_text,
    processed_last_edited_at = NOW(),
    processed_edit_count = COALESCE(processed_edit_count, 0) + 1
  WHERE recording_id = p_recording_id
  RETURNING
    j_hub_optimization_transcripts.processed_text,
    j_hub_optimization_transcripts.processed_previous_version,
    j_hub_optimization_transcripts.processed_edit_count,
    j_hub_optimization_transcripts.processed_last_edited_at;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.save_transcript_edit IS 'Save transcript edit with versioning - Returns updated fields to avoid full reload';
COMMENT ON FUNCTION public.save_processed_edit IS 'Save processed text edit with versioning - Returns updated fields to avoid full reload';
