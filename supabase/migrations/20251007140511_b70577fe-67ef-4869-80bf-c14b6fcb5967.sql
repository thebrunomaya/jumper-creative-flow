-- Step 1: Remove duplicate transcripts, keeping the most recent one
DELETE FROM j_ads_optimization_transcripts
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY recording_id ORDER BY created_at DESC) as rn
    FROM j_ads_optimization_transcripts
  ) t
  WHERE rn > 1
);

-- Step 2: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE j_ads_optimization_transcripts
ADD CONSTRAINT j_ads_optimization_transcripts_recording_id_unique UNIQUE (recording_id);

-- Step 3: Fix analysis_status for recordings that have context but status is 'processing'
UPDATE j_ads_optimization_recordings r
SET analysis_status = 'completed'
WHERE analysis_status = 'processing'
  AND EXISTS (
    SELECT 1 FROM j_ads_optimization_context c
    WHERE c.recording_id = r.id
  );

-- Step 4: Add index for better performance on recording_id lookups
CREATE INDEX IF NOT EXISTS idx_optimization_transcripts_recording_id 
ON j_ads_optimization_transcripts(recording_id);

CREATE INDEX IF NOT EXISTS idx_optimization_context_recording_id 
ON j_ads_optimization_context(recording_id);