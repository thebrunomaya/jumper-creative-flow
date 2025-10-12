-- ============================================================================
-- Rename Optimization Tables: j_ads_optimization_* → j_hub_optimization_*
-- Part of Jumper Hub v2.0 migration (completing optimization system rebrand)
-- Created: 2025-10-12
-- ============================================================================

-- 1. Rename tables (atomic operations)
ALTER TABLE j_ads_optimization_recordings RENAME TO j_hub_optimization_recordings;
ALTER TABLE j_ads_optimization_transcripts RENAME TO j_hub_optimization_transcripts;
ALTER TABLE j_ads_optimization_context RENAME TO j_hub_optimization_context;
ALTER TABLE j_ads_optimization_api_logs RENAME TO j_hub_optimization_api_logs;
ALTER TABLE j_ads_optimization_prompts RENAME TO j_hub_optimization_prompts;

-- 2. Rename indexes (follow naming convention)
ALTER INDEX IF EXISTS idx_recordings_processing_status
  RENAME TO idx_hub_optimization_recordings_processing_status;
ALTER INDEX IF EXISTS idx_recordings_account_statuses
  RENAME TO idx_hub_optimization_recordings_account_statuses;

-- 3. Create backwards-compatible VIEWs (zero downtime)
CREATE OR REPLACE VIEW j_ads_optimization_recordings AS
  SELECT * FROM j_hub_optimization_recordings;

CREATE OR REPLACE VIEW j_ads_optimization_transcripts AS
  SELECT * FROM j_hub_optimization_transcripts;

CREATE OR REPLACE VIEW j_ads_optimization_context AS
  SELECT * FROM j_hub_optimization_context;

CREATE OR REPLACE VIEW j_ads_optimization_api_logs AS
  SELECT * FROM j_hub_optimization_api_logs;

CREATE OR REPLACE VIEW j_ads_optimization_prompts AS
  SELECT * FROM j_hub_optimization_prompts;

-- 4. Comments for documentation
COMMENT ON VIEW j_ads_optimization_recordings IS
  'DEPRECATED: Use j_hub_optimization_recordings. View for backwards compatibility.';
COMMENT ON VIEW j_ads_optimization_transcripts IS
  'DEPRECATED: Use j_hub_optimization_transcripts. View for backwards compatibility.';
COMMENT ON VIEW j_ads_optimization_context IS
  'DEPRECATED: Use j_hub_optimization_context. View for backwards compatibility.';
COMMENT ON VIEW j_ads_optimization_api_logs IS
  'DEPRECATED: Use j_hub_optimization_api_logs. View for backwards compatibility.';
COMMENT ON VIEW j_ads_optimization_prompts IS
  'DEPRECATED: Use j_hub_optimization_prompts. View for backwards compatibility.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- New table names: j_hub_optimization_*
-- Old names available via VIEWs: j_ads_optimization_*
-- Next steps: Update edge functions and React components to use new names
-- ============================================================================
