-- Migration: Add generation_plan column to store Stage 1 analysis output
-- Date: 2025-01-12
-- Purpose: Store structured slide plan for debugging, analytics, and future plan review UI

-- ============================================================================
-- ADD COLUMN: generation_plan
-- ============================================================================
-- Stores the output from j_hub_deck_analyze (Stage 1)
-- Format: {slides: [{slide_number, section_title, recommended_pattern, reasoning}], total_slides, pattern_diversity_score}

ALTER TABLE j_hub_decks
ADD COLUMN generation_plan JSONB;

COMMENT ON COLUMN j_hub_decks.generation_plan IS
  'Structured slide plan from content analysis (Stage 1). Contains: slides array with pattern recommendations, total_slides count, pattern_diversity_score. Used for debugging pattern selection and future plan review UI.';

-- ============================================================================
-- INDEX: Improve query performance for pattern analytics
-- ============================================================================
-- GIN index allows querying by pattern usage for analytics dashboard
-- Example queries:
-- - Find all decks using timeline pattern
-- - Calculate pattern popularity statistics
-- - Identify decks with low diversity scores

CREATE INDEX IF NOT EXISTS idx_decks_generation_plan
  ON j_hub_decks USING GIN (generation_plan);

COMMENT ON INDEX idx_decks_generation_plan IS
  'Enables querying decks by pattern usage and diversity scores for analytics';

-- ============================================================================
-- ANALYTICS VIEW: Pattern usage statistics (optional, for future dashboard)
-- ============================================================================
-- Uncomment when ready to add analytics dashboard

-- CREATE OR REPLACE VIEW j_hub_deck_pattern_stats AS
-- SELECT
--   jsonb_array_elements(generation_plan->'slides')->>'recommended_pattern' as pattern_id,
--   COUNT(*) as usage_count,
--   AVG((generation_plan->>'pattern_diversity_score')::numeric) as avg_diversity_score
-- FROM j_hub_decks
-- WHERE generation_plan IS NOT NULL
-- GROUP BY pattern_id
-- ORDER BY usage_count DESC;
