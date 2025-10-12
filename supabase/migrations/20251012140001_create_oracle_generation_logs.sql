-- Migration: Create oracle generation logs table
-- Purpose: Track cost, performance, and usage of oracle report generation
-- Author: Claude Code + Bruno Maya
-- Date: 2025-10-12

-- Create logs table
CREATE TABLE IF NOT EXISTS j_hub_oracle_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID NOT NULL REFERENCES j_hub_optimization_context(id) ON DELETE CASCADE,
  oracle TEXT NOT NULL CHECK (oracle IN ('delfos', 'orfeu', 'nostradamus')),

  -- Performance metrics
  generation_time_ms INTEGER NOT NULL,
  cached BOOLEAN NOT NULL DEFAULT false,

  -- Cost tracking
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10, 6),

  -- Model info
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  prompt_version TEXT,

  -- Status and error handling
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')) DEFAULT 'success',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit
  user_id UUID REFERENCES j_ads_users(id)
);

-- Add comments
COMMENT ON TABLE j_hub_oracle_generation_logs IS
'Tracks every oracle report generation for cost analysis, performance monitoring, and debugging';

COMMENT ON COLUMN j_hub_oracle_generation_logs.oracle IS
'Which oracle was used: delfos (technical), orfeu (storytelling), nostradamus (analytical)';

COMMENT ON COLUMN j_hub_oracle_generation_logs.cached IS
'Whether the report was returned from cache (true) or freshly generated (false)';

COMMENT ON COLUMN j_hub_oracle_generation_logs.estimated_cost_usd IS
'Estimated API cost: (input_tokens * $0.003 / 1000) + (output_tokens * $0.015 / 1000)';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_oracle_logs_context_id
ON j_hub_oracle_generation_logs(context_id);

CREATE INDEX IF NOT EXISTS idx_oracle_logs_oracle
ON j_hub_oracle_generation_logs(oracle);

CREATE INDEX IF NOT EXISTS idx_oracle_logs_created_at
ON j_hub_oracle_generation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oracle_logs_status
ON j_hub_oracle_generation_logs(status)
WHERE status = 'error';

CREATE INDEX IF NOT EXISTS idx_oracle_logs_cost
ON j_hub_oracle_generation_logs(estimated_cost_usd)
WHERE estimated_cost_usd IS NOT NULL;

-- Composite index for analytics
CREATE INDEX IF NOT EXISTS idx_oracle_logs_analytics
ON j_hub_oracle_generation_logs(oracle, created_at DESC, cached);

-- Enable Row Level Security
ALTER TABLE j_hub_oracle_generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and staff can see all logs
CREATE POLICY "Admins and staff can view all oracle logs"
ON j_hub_oracle_generation_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE j_ads_users.id = auth.uid()
    AND j_ads_users.role IN ('admin', 'staff')
  )
);

-- RLS Policy: Service role can insert logs (edge function)
CREATE POLICY "Service role can insert oracle logs"
ON j_hub_oracle_generation_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create view for cost analytics
CREATE OR REPLACE VIEW j_hub_oracle_cost_analytics AS
SELECT
  oracle,
  COUNT(*) as total_generations,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_count,
  SUM(CASE WHEN NOT cached THEN 1 ELSE 0 END) as fresh_count,
  AVG(generation_time_ms) as avg_generation_time_ms,
  SUM(estimated_cost_usd) as total_cost_usd,
  AVG(estimated_cost_usd) as avg_cost_per_generation_usd,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  MIN(created_at) as first_generation,
  MAX(created_at) as last_generation
FROM j_hub_oracle_generation_logs
WHERE status = 'success'
GROUP BY oracle;

-- Add comment to view
COMMENT ON VIEW j_hub_oracle_cost_analytics IS
'Analytics view showing cost and performance metrics for each oracle type';

-- Grant access to view
GRANT SELECT ON j_hub_oracle_cost_analytics TO authenticated;
