-- Create j_ads_optimization_context table
CREATE TABLE IF NOT EXISTS public.j_ads_optimization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.j_ads_optimization_recordings(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  
  -- Extracted data
  summary TEXT NOT NULL,
  actions_taken JSONB NOT NULL,
  metrics_mentioned JSONB NOT NULL,
  strategy JSONB NOT NULL,
  timeline JSONB NOT NULL,
  
  -- Metadata
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  client_report_generated BOOLEAN DEFAULT FALSE,
  client_report_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_context_account ON public.j_ads_optimization_context(account_id);
CREATE INDEX idx_context_recording ON public.j_ads_optimization_context(recording_id);
CREATE INDEX idx_context_date ON public.j_ads_optimization_context(created_at DESC);

-- Enable RLS
ALTER TABLE public.j_ads_optimization_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own context"
ON public.j_ads_optimization_context
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.j_ads_optimization_recordings r
    WHERE r.id = j_ads_optimization_context.recording_id
    AND r.recorded_by = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Admins can view all context"
ON public.j_ads_optimization_context
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage context"
ON public.j_ads_optimization_context
FOR ALL
USING (auth.role() = 'service_role');