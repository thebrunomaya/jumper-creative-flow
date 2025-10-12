-- ============================================================================
-- Cleanup: Remove Optimization VIEWs + j_ads_metrics Table
-- Part of Jumper Hub v2.0 cleanup (removing unnecessary backwards compatibility)
-- Created: 2025-10-12
-- ============================================================================

-- 1. Drop optimization VIEWs (no longer needed - all code uses j_hub_optimization_*)
DROP VIEW IF EXISTS j_ads_optimization_recordings;
DROP VIEW IF EXISTS j_ads_optimization_transcripts;
DROP VIEW IF EXISTS j_ads_optimization_context;
DROP VIEW IF EXISTS j_ads_optimization_api_logs;
DROP VIEW IF EXISTS j_ads_optimization_prompts;

-- 2. Drop obsolete j_ads_metrics table (never used in codebase)
DROP TABLE IF EXISTS j_ads_metrics CASCADE;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- ✅ Optimization VIEWs removed (all code already uses j_hub_optimization_*)
-- ✅ j_ads_metrics table removed (zero references found in codebase)
-- Result: Cleaner database schema with no unnecessary abstractions
-- ============================================================================
