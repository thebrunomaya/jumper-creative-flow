-- Remove duplicate contexts keeping the most recent one
DELETE FROM j_ads_optimization_context
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY recording_id ORDER BY created_at DESC) as rn
    FROM j_ads_optimization_context
  ) sub
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE j_ads_optimization_context
ADD CONSTRAINT j_ads_optimization_context_recording_id_key UNIQUE (recording_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_optimization_context_recording_id 
ON j_ads_optimization_context(recording_id);