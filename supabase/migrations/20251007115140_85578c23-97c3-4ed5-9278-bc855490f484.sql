-- Add fields to store correction prompts and model used
ALTER TABLE j_ads_optimization_transcripts
ADD COLUMN correction_prompt TEXT,
ADD COLUMN correction_applied_at TIMESTAMPTZ;

ALTER TABLE j_ads_optimization_context
ADD COLUMN correction_prompt TEXT,
ADD COLUMN model_used TEXT DEFAULT 'gpt-4o',
ADD COLUMN correction_applied_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX idx_transcripts_recording_id ON j_ads_optimization_transcripts(recording_id);
CREATE INDEX idx_context_recording_id ON j_ads_optimization_context(recording_id);