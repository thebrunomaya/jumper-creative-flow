# Database Cleanup - October 10, 2025

## 🎯 Objective
Remove 7 obsolete tables from Supabase database and implement RLS on reports data.

## 📊 Database State

### Before Cleanup (20 tables)
- ✅ 13 active j_ads_* tables
- ✅ 1 active j_rep_* table (metaads_bronze)
- ❌ 6 obsolete tables (duplicates + old versions)
- ❓ 1 unknown table (videosmmx)

### After Cleanup (13-14 tables)
- ✅ Only j_ads_* and j_rep_* prefixed tables
- ✅ RLS implemented on j_rep_metaads_bronze
- ✅ Clean, organized database structure

## 📋 Tables Removed

### Duplicates (without j_ads_ prefix)
1. **creative_files** → replaced by `j_ads_creative_files`
2. **creative_submissions** → replaced by `j_ads_creative_submissions`
3. **creative_variations** → replaced by `j_ads_creative_variations`

### Old Tables (replaced by j_ads_* versions)
4. **notion_manager_accounts** → replaced by `j_ads_notion_db_accounts`
5. **notion_managers** → replaced by `j_ads_notion_db_managers`
6. **user_roles** → replaced by `j_ads_users`

### Unknown
7. **videosmmx** → investigate usage before removing

## 🔐 Security Fix

### j_rep_metaads_bronze RLS Implementation
**Problem:** Table had NO Row Level Security - any authenticated user could see ALL Meta Ads data

**Solution:** Migration `20251010000001_add_rls_metaads_bronze.sql`

**Policies:**
- Users see only their assigned accounts
- Admins see all accounts
- Staff (Gestor/Supervisor) see managed accounts
- Clients see accounts via notion_manager_id

## 📝 Migrations Created

### 1. `20251010000000_cleanup_obsolete_tables.sql`
- Drops 6 obsolete tables
- Includes CASCADE to remove dependencies
- Comments explain each removal

### 2. `20251010000001_add_rls_metaads_bronze.sql`
- Enables RLS on j_rep_metaads_bronze
- Creates 2 policies (user view + admin manage)
- Includes verification queries

## ✅ Execution Checklist

- [ ] **Phase 1**: Verify no code references obsolete tables
  ```bash
  grep -r "FROM creative_submissions" supabase/ src/
  grep -r "notion_managers\|user_roles" supabase/ src/
  ```

- [ ] **Phase 2**: Apply migrations
  ```bash
  npx supabase db push --linked
  ```

- [ ] **Phase 3**: Regenerate types.ts
  ```bash
  npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
  ```

- [ ] **Phase 4**: Verify table count
  ```sql
  SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
  -- Expected: 13-14 tables
  ```

- [ ] **Phase 5**: Test RLS
  - Login as regular user → see only their accounts
  - Login as admin → see all accounts

- [ ] **Phase 6**: Commit and deploy
  ```bash
  git add .
  git commit -m "feat: cleanup obsolete tables and add RLS to metaads_bronze"
  git push origin main
  ```

## 🔗 Related Documentation

- **CLAUDE.md** - Updated with j_rep_* tables and obsolete list
- **.claude-context** - Next session plan documented
- **REPORTS-ROADMAP.md** - RLS implementation mentioned

## 🚨 Important Notes

1. **Backup**: Supabase has automatic backups, but verify before proceeding
2. **Verification**: Check code references BEFORE dropping tables
3. **Testing**: Test reports dashboards after RLS implementation
4. **Rollback**: If issues occur, restore from Supabase backup

---

**Created:** 2025-10-10
**Status:** Ready for execution
**Priority:** HIGH (security + cleanup)
