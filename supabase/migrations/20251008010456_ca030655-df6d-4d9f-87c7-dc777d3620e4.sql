-- Add processed_text field to transcripts table
ALTER TABLE public.j_ads_optimization_transcripts 
ADD COLUMN IF NOT EXISTS processed_text TEXT;

-- Update transcription_status to support new processing states
COMMENT ON COLUMN public.j_ads_optimization_recordings.transcription_status IS 
'Status: pending -> processing -> processing_transcript -> completed | failed';
