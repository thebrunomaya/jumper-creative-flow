-- ============================================================================
-- Optimization API Logs Table
-- Tracks all AI API calls for debugging and audit purposes
-- ============================================================================

CREATE TABLE IF NOT EXISTS j_ads_optimization_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES j_ads_optimization_recordings(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('transcribe', 'process', 'analyze')),

  -- Request data
  prompt_sent TEXT,
  model_used TEXT,
  input_preview TEXT, -- First 500 chars of input for quick review

  -- Response data
  output_preview TEXT, -- First 500 chars of output
  tokens_used INT,
  latency_ms INT,

  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_logs_recording ON j_ads_optimization_api_logs(recording_id);
CREATE INDEX idx_api_logs_step ON j_ads_optimization_api_logs(step);
CREATE INDEX idx_api_logs_created ON j_ads_optimization_api_logs(created_at DESC);

-- Comments
COMMENT ON TABLE j_ads_optimization_api_logs IS 'Logs all AI API calls for debugging and audit (admin-only access)';
COMMENT ON COLUMN j_ads_optimization_api_logs.step IS 'Step name: transcribe (Whisper), process (Claude bullets), analyze (Final JSON)';
COMMENT ON COLUMN j_ads_optimization_api_logs.prompt_sent IS 'Full prompt sent to AI (for debugging)';
COMMENT ON COLUMN j_ads_optimization_api_logs.input_preview IS 'Preview of input data (500 chars max)';
COMMENT ON COLUMN j_ads_optimization_api_logs.output_preview IS 'Preview of output data (500 chars max)';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE j_ads_optimization_api_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
DROP POLICY IF EXISTS "Admins can view all API logs" ON j_ads_optimization_api_logs;
CREATE POLICY "Admins can view all API logs"
ON j_ads_optimization_api_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert logs (from Edge Functions)
DROP POLICY IF EXISTS "Service role can insert logs" ON j_ads_optimization_api_logs;
CREATE POLICY "Service role can insert logs"
ON j_ads_optimization_api_logs
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit for clarity
