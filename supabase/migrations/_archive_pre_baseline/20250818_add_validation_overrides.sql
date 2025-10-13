-- Add validation_overrides column to store bypassed warnings
ALTER TABLE j_ads_creative_submissions 
ADD COLUMN IF NOT EXISTS validation_overrides JSONB;

-- Add index for querying submissions with validation overrides
CREATE INDEX IF NOT EXISTS idx_creative_submissions_validation_overrides 
ON j_ads_creative_submissions (validation_overrides) 
WHERE validation_overrides IS NOT NULL;