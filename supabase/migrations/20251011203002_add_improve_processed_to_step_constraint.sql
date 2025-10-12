-- Add 'improve_processed' to allowed step values in j_ads_optimization_api_logs
-- This step is for AI-assisted improvements to organized bullet points (Step 2)

-- Drop existing constraint
ALTER TABLE j_ads_optimization_api_logs
DROP CONSTRAINT IF EXISTS j_ads_optimization_api_logs_step_check;

-- Recreate constraint with new allowed value
ALTER TABLE j_ads_optimization_api_logs
ADD CONSTRAINT j_ads_optimization_api_logs_step_check
CHECK (step IN ('transcribe', 'process', 'analyze', 'improve_transcript', 'improve_processed'));

-- Update comment explaining all steps
COMMENT ON CONSTRAINT j_ads_optimization_api_logs_step_check ON j_ads_optimization_api_logs IS
'Validates step values: transcribe (Whisper), process (Claude bullets), analyze (AI analysis), improve_transcript (Claude transcript adjustments), improve_processed (Claude bullet adjustments)';
