-- ============================================
-- CLEANUP: Remove obsolete duplicate tables
-- Created: 2025-10-10
-- ============================================
--
-- This migration removes 7 obsolete tables:
--
-- DUPLICATES (without j_ads_ prefix):
-- - creative_files → replaced by j_ads_creative_files
-- - creative_submissions → replaced by j_ads_creative_submissions
-- - creative_variations → replaced by j_ads_creative_variations
--
-- OLD TABLES (replaced by j_ads_* versions):
-- - notion_manager_accounts → replaced by j_ads_notion_db_accounts
-- - notion_managers → replaced by j_ads_notion_db_managers
-- - user_roles → replaced by j_ads_users
-- - j_ads_user_roles → replaced by j_ads_users (roles are stored in j_ads_users.role column)
--
-- ⚠️ WARNING: Run verification queries before executing!
-- Ensure no active code references these tables.

-- Drop duplicate creative tables (without j_ads_ prefix)
DROP TABLE IF EXISTS creative_files CASCADE;
DROP TABLE IF EXISTS creative_submissions CASCADE;
DROP TABLE IF EXISTS creative_variations CASCADE;

-- Drop old replaced tables
DROP TABLE IF EXISTS notion_manager_accounts CASCADE;
DROP TABLE IF EXISTS notion_managers CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS j_ads_user_roles CASCADE;

-- Verification: List remaining tables (should only be j_ads_* and j_rep_*)
-- Run after migration:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
