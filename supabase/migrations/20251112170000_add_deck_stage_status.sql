-- Migration: Add 3-stage status tracking to j_hub_decks
-- Date: 2025-01-12
-- Purpose: Enable Optimizations-style interactive 3-stage deck generation workflow

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ADD STAGE STATUS COLUMNS
-- ============================================================================
-- Tracks progress through: Content Analysis → Plan Review → HTML Generation
-- Status values: 'pending', 'processing', 'completed', 'failed'

ALTER TABLE j_hub_decks
ADD COLUMN analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

COMMENT ON COLUMN j_hub_decks.analysis_status IS
  'Stage 1: Content analysis status (j_hub_deck_analyze). Produces generation_plan JSONB.';

COMMENT ON COLUMN j_hub_decks.review_status IS
  'Stage 2: Plan review status (auto-approved for now, future: user review UI).';

COMMENT ON COLUMN j_hub_decks.generation_status IS
  'Stage 3: HTML generation status (j_hub_deck_generate). Produces html_output and file_url.';

-- ============================================================================
-- INDEXES: Improve query performance for status filtering
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_decks_analysis_status ON j_hub_decks(analysis_status);
CREATE INDEX IF NOT EXISTS idx_decks_generation_status ON j_hub_decks(generation_status);

-- Composite index for finding decks stuck in processing
CREATE INDEX IF NOT EXISTS idx_decks_processing_status
  ON j_hub_decks(analysis_status, generation_status, updated_at)
  WHERE analysis_status = 'processing' OR generation_status = 'processing';

COMMENT ON INDEX idx_decks_processing_status IS
  'Finds decks stuck in processing state for timeout/cleanup monitoring';

-- ============================================================================
-- API LOGS TABLE: Debugging and audit trail
-- ============================================================================
-- Stores all AI API calls for each stage (prompts, responses, tokens, errors)
-- Similar to j_hub_optimization_api_logs pattern

CREATE TABLE IF NOT EXISTS j_hub_deck_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES j_hub_decks(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('analysis', 'generation')),

  -- Request/Response data
  prompt_sent TEXT,
  response_received TEXT,

  -- Metadata
  tokens_used JSONB, -- {input: N, output: M, total: X}
  latency_ms INTEGER,
  model_used TEXT,

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deck_api_logs_deck_id ON j_hub_deck_api_logs(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_api_logs_stage ON j_hub_deck_api_logs(stage);
CREATE INDEX IF NOT EXISTS idx_deck_api_logs_success ON j_hub_deck_api_logs(success, created_at);

COMMENT ON TABLE j_hub_deck_api_logs IS
  'API call audit trail for debugging deck generation stages. Stores prompts, responses, and performance metrics.';

-- ============================================================================
-- UPDATE EXISTING RECORDS
-- ============================================================================
-- For existing decks with html_output already generated, mark as completed
UPDATE j_hub_decks
SET
  analysis_status = 'completed',
  review_status = 'completed',
  generation_status = 'completed'
WHERE html_output IS NOT NULL AND html_output != '';

-- For existing decks with generation_plan but no html_output, mark analysis complete
UPDATE j_hub_decks
SET
  analysis_status = 'completed',
  review_status = 'completed',
  generation_status = 'pending'
WHERE generation_plan IS NOT NULL AND (html_output IS NULL OR html_output = '');
