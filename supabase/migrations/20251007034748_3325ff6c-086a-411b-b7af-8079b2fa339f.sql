-- Create table for optimization transcriptions
CREATE TABLE IF NOT EXISTS public.j_ads_optimization_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.j_ads_optimization_recordings(id) ON DELETE CASCADE,
  full_text TEXT NOT NULL,
  language TEXT DEFAULT 'pt',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  segments JSONB, -- Array of {start, end, text} for timestamped segments
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_optimization_transcripts_recording_id
ON public.j_ads_optimization_transcripts(recording_id);

-- Enable RLS
ALTER TABLE public.j_ads_optimization_transcripts ENABLE ROW LEVEL SECURITY;

-- Users can view transcripts of their own recordings
CREATE POLICY "Users can view their own transcripts"
ON public.j_ads_optimization_transcripts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_optimization_recordings r
    WHERE r.id = j_ads_optimization_transcripts.recording_id
    AND r.recorded_by = (auth.jwt() ->> 'email')
  )
);

-- Admins can view all transcripts
CREATE POLICY "Admins can view all transcripts"
ON public.j_ads_optimization_transcripts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can manage transcripts
CREATE POLICY "Service role can manage transcripts"
ON public.j_ads_optimization_transcripts
FOR ALL
USING (auth.role() = 'service_role');