# 📦 Archived Migrations - Pre-Baseline

**Archive Date:** 2025-10-13
**Reason:** Schema consolidation into single baseline migration
**Status:** SAFE TO KEEP - Historical reference only

---

## ⚠️ IMPORTANT

**These 43 migrations are archived and NO LONGER ACTIVE.**

The active migration is now:
- `../20250101000000_jumper_hub_baseline_schema.sql` (parent directory)

---

## 🎯 Why Were These Archived?

### Problem
When trying to run `supabase start` (local development), migrations failed with multiple errors:

1. **Chronological conflicts**: Tables created with `j_ads_*` naming, then renamed to `j_hub_*` later
2. **Broken foreign keys**: FKs referencing tables that don't exist yet or were renamed
3. **VIEW lifecycle issues**: VIEWs created then immediately deleted in next migration
4. **Confusing naming**: UUID-based filenames made it impossible to understand purpose
5. **Incremental complexity**: 43 separate migrations accumulated over months

### Solution
Consolidated ALL 43 migrations into ONE comprehensive baseline schema:
- Single source of truth
- Correct `j_hub_*` naming from the start
- Zero naming conflicts
- Clean, documented, maintainable

---

## 📋 Original Migration Inventory

### Group A: Core Functions & Utilities (Aug 10-14)
1. `20250810000000_create_has_role_function.sql` - RPC function for role checking
2. `20250810233902_add_update_updated_at_function.sql` - Trigger function
3. `20250810233903_06df46f6...sql` - Creative tables (unprefixed)
4. `20250811010138_3c2a7a3a...sql` - Add 'draft' status enum
5. `20250811011124_6e1996b2...sql` - Creative variations table
6. `20250811011156_e8d7aba8...sql` - (additional creative setup)
7. `20250811235628_enable_pg_cron.sql` - Enable cron extension
8. `20250811235629_4754d4c0...sql` - (cron configuration)
9. `20250811235720_b8f2645a...sql` - (cron jobs)
10. `20250813233648_create_app_role_enum.sql` - Role enum
11. `20250813233649_012ef791...sql` - (role setup)
12. `20250814100816_3e530ec0...sql` - (additional setup)
13. `20250814102424_bf60aebc...sql` - (additional setup)
14. `20250818_add_validation_overrides.sql` - Validation fields

### Group B: Optimization System (Oct 7-11)
15. `20251007033331_ccd76b91...sql` - Optimization recordings (j_ads_* names)
16. `20251011000000_add_user_activity_tracking.sql` - User audit log
17. `20251011000001_create_user_audit_log.sql` - Audit log table
18. `20251011150000_create_optimization_api_logs.sql` - API tracking
19. `20251011150001_add_processing_status_field.sql` - Status fields
20. `20251011180000_add_contexto_transcricao_column.sql` - Transcript context
21. `20251011190000_add_transcript_versioning.sql` - Version tracking
22. `20251011190001_create_save_transcript_edit_function.sql` - RPC function
23. `20251011200000_disable_rls_api_logs.sql` - Disable RLS for API logs
24. `20251011201000_fix_api_logs_step_constraint.sql` - Fix constraints
25. `20251011203000_add_processed_text_versioning.sql` - Processed text versions
26. `20251011203001_create_save_processed_edit_function.sql` - RPC function
27. `20251011203002_add_improve_processed_to_step_constraint.sql` - Step constraint
28. `20251011210000_rebuild_optimization_prompts_table.sql` - Prompts table
29. `20251011211000_simplify_process_prompts.sql` - Simplify prompts
30. `20251011220000_add_transcribe_prompts.sql` - Transcribe prompts
31. `20251011230000_add_analyze_prompts.sql` - Analyze prompts

### Group C: v2.0 Rebrand (Oct 12)
32. `20251012000000_migrate_users_to_j_hub.sql` - Users table rename
33. `20251012000001_migrate_user_audit_log.sql` - Audit log rename
34. `20251012005000_rename_optimization_tables_to_hub.sql` - Optimization rename
35. `20251012010000_migrate_notion_db_accounts.sql` - Accounts rename
36. `20251012010001_migrate_notion_db_managers.sql` - Managers rename
37. `20251012010002_migrate_notion_sync_logs.sql` - Sync logs rename
38. `20251012020000_cleanup_optimization_views_and_metrics.sql` - Drop VIEWs

### Group D: Oracle Framework (Oct 12)
39. `20251012140000_add_oracle_generated_reports.sql` - Oracle reports table
40. `20251012140001_create_oracle_generation_logs.sql` - Oracle logs
41. `20251012140002_fix_rpc_functions_table_names.sql` - Fix RPC functions
42. `20251012150000_add_unique_constraint_recording_id.sql` - Add constraint
43. `20251012200000_add_shared_oracle_type.sql` - Shared oracle support

---

## 🔍 What Changed in Baseline?

### Table Naming Standardization
**Before:**
- `creative_submissions` (no prefix)
- `j_ads_users` → `j_hub_users` (rename migration)
- `j_ads_optimization_recordings` → `j_hub_optimization_recordings` (rename migration)

**After (Baseline):**
- `j_hub_creative_submissions` ✅ (consistent prefix)
- `j_hub_users` ✅ (final name from start)
- `j_hub_optimization_recordings` ✅ (final name from start)

### Foreign Keys Fixed
**Before:**
```sql
-- Migration 20251007 (Oct 7)
FOREIGN KEY (account_id) REFERENCES j_ads_notion_db_accounts(notion_id)

-- But j_ads_notion_db_accounts is renamed to j_hub_notion_db_accounts in Oct 12!
-- ❌ Broken FK when running from scratch
```

**After (Baseline):**
```sql
-- All FKs use final j_hub_* names
FOREIGN KEY (account_id) REFERENCES j_hub_notion_db_accounts(notion_id)
-- ✅ Works perfectly
```

### No VIEW Lifecycle Issues
**Before:**
- Migration 20251012005000 creates VIEWs (`j_ads_optimization_*` → `j_hub_optimization_*`)
- Migration 20251012020000 drops same VIEWs immediately
- Confusing and error-prone

**After (Baseline):**
- Zero VIEWs
- Direct table access only
- Clean schema

---

## 📊 Production Status

**Important:** Production database already has the correct schema.

These migrations were applied manually in production before consolidation. The baseline migration is a **local development aid** to ensure `supabase start` works correctly.

**Production tables (confirmed working):**
- ✅ `j_hub_users`
- ✅ `j_hub_creative_submissions`
- ✅ `j_hub_optimization_recordings`
- ✅ `j_hub_notion_db_accounts`
- ✅ All other tables with correct `j_hub_*` naming

---

## 🚀 How to Use Baseline Migration

### For New Developers
1. Clone repo
2. Run `supabase start`
3. Baseline migration creates entire schema automatically
4. Start developing!

### For Existing Developers
1. Your local database may have old migrations applied
2. Option A: Keep using (no action needed)
3. Option B: Reset for clean slate:
   ```bash
   supabase db reset
   ```

### For Production
- **DO NOT RUN BASELINE IN PRODUCTION**
- Production already has correct schema
- Baseline is for local development only

---

## 📚 Reference

If you need to understand what a specific archived migration did, they're all preserved here for historical reference.

### Common Lookups
- **has_role function**: `20250810000000_create_has_role_function.sql`
- **Creative tables**: `20250810233903_06df46f6-09f9-4b3e-94fb-a28ae57a92a4.sql`
- **Optimization system**: `20251007033331_ccd76b91-ce2a-4ba4-beaf-4bbb3317db65.sql`
- **v2.0 rename**: `20251012000000_migrate_users_to_j_hub.sql`

---

**Questions?** Check `../20250101000000_jumper_hub_baseline_schema.sql` for the current schema.
