-- Add UPDATE policy for users to update their own transcripts
CREATE POLICY "Users can update their own transcripts"
ON j_ads_optimization_transcripts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM j_ads_optimization_recordings r
    WHERE r.id = j_ads_optimization_transcripts.recording_id
    AND r.recorded_by = (auth.jwt() ->> 'email')
  )
);