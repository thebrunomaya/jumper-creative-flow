-- Add DELETE policies for optimization recordings
-- Users can delete their own recordings
CREATE POLICY "Users can delete their own recordings"
ON public.j_ads_optimization_recordings
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = recorded_by);

-- Admins can delete any recording
CREATE POLICY "Admins can delete all recordings"
ON public.j_ads_optimization_recordings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add CASCADE delete for related records
-- When a recording is deleted, also delete its context and transcript
ALTER TABLE j_ads_optimization_context
DROP CONSTRAINT IF EXISTS j_ads_optimization_context_recording_id_fkey;

ALTER TABLE j_ads_optimization_context
ADD CONSTRAINT j_ads_optimization_context_recording_id_fkey
FOREIGN KEY (recording_id)
REFERENCES j_ads_optimization_recordings(id)
ON DELETE CASCADE;

ALTER TABLE j_ads_optimization_transcripts
DROP CONSTRAINT IF EXISTS j_ads_optimization_transcripts_recording_id_fkey;

ALTER TABLE j_ads_optimization_transcripts
ADD CONSTRAINT j_ads_optimization_transcripts_recording_id_fkey
FOREIGN KEY (recording_id)
REFERENCES j_ads_optimization_recordings(id)
ON DELETE CASCADE;