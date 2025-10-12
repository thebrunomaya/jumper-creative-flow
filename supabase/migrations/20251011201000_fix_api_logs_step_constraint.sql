-- Fix CHECK constraint on j_ads_optimization_api_logs.step
-- Add 'improve_transcript' to allowed values

-- Drop existing constraint
ALTER TABLE j_ads_optimization_api_logs
DROP CONSTRAINT IF EXISTS j_ads_optimization_api_logs_step_check;

-- Recreate constraint with new allowed value
ALTER TABLE j_ads_optimization_api_logs
ADD CONSTRAINT j_ads_optimization_api_logs_step_check
CHECK (step IN ('transcribe', 'process', 'analyze', 'improve_transcript'));

-- Add comment explaining the change
COMMENT ON CONSTRAINT j_ads_optimization_api_logs_step_check ON j_ads_optimization_api_logs IS
'Validates step values: transcribe (Whisper), process (Claude bullets), analyze (AI analysis), improve_transcript (Claude AI adjustments)';
