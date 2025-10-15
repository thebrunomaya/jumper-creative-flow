# 📸 Baseline Migration Guide

> **Last Updated:** 2025-10-14
> **Status:** CRITICAL REFERENCE - Follow this guide for ALL baseline updates

---

## 🎯 What is a Baseline Migration?

**Baseline =** Snapshot of production database schema at a specific point in time

**Purpose:**
- Provide clean starting point for new local environments
- Eliminate need to run hundreds of historical migrations
- Ensure local development matches production EXACTLY

**NOT:**
- ❌ Consolidation of historical migration files
- ❌ Manual reconstruction of schema
- ❌ Documentation of how we got here

**YES:**
- ✅ Photo of database schema RIGHT NOW
- ✅ Direct dump from production
- ✅ Single source of truth

---

## ❌ Wrong Way (How We Did It Before)

### **Session 2025-10-13 (INCORRECT):**

```bash
# WRONG: Consolidate old migrations manually
# 1. Read 43 migration files
# 2. Copy/paste SQL into one file
# 3. Archive old migrations
# 4. Hope we didn't miss anything
```

**Problems:**
- Missed recent migrations (Oct 11: login_count, is_active, etc.)
- Manual process prone to errors
- Doesn't capture manual schema changes
- Result: Local ≠ Production

**Evidence of failure:**
```
ERROR: column "login_count" of relation "j_hub_users" does not exist
ERROR: column "confidence_score" does not exist
ERROR: relation "j_rep_metaads_bronze" does not exist
```

---

## ✅ Right Way (Current Method)

### **Session 2025-10-14 (CORRECT):**

```bash
# CORRECT: Direct dump from production
supabase db dump --linked > baseline.sql

# Clean log messages (beginning and end)
tail -n +3 baseline.sql | head -n -3 > baseline_clean.sql

# Replace old baseline
mv baseline_clean.sql supabase/migrations/YYYYMMDD_baseline_from_production.sql

# Test locally
supabase db reset

# Import production data (should work perfectly)
supabase db dump --linked --data-only > data.sql
cat data.sql | docker exec -i supabase_db_[container] psql -U postgres postgres
```

**Advantages:**
- ✅ 100% faithful to production reality
- ✅ Includes all changes (even undocumented ones)
- ✅ One command, no manual work
- ✅ Data import works perfectly
- ✅ Future-proof

---

## 📋 Step-by-Step Process

### **When to Create New Baseline:**

1. After major schema reorganization
2. When migrations folder gets too large (>20 files)
3. When onboarding new developer (clean slate)
4. When local/production drift is detected

### **Process:**

#### **1. Verify Production State**

```bash
# Ensure you're linked to correct project
supabase link --project-ref biwwowendjuzvpttyrlb

# Check production schema
supabase db dump --linked --schema-only | head -50
```

#### **2. Create Baseline Dump**

```bash
# Full schema dump (no data)
supabase db dump --linked > /tmp/baseline_raw.sql
```

#### **3. Clean Log Messages**

The dump includes CLI messages. Remove them:

```bash
# Remove first 3 lines (CLI messages)
tail -n +3 /tmp/baseline_raw.sql > /tmp/baseline_step1.sql

# Find line with "RESET ALL;" (last real SQL statement)
grep -n "RESET ALL" /tmp/baseline_step1.sql
# Example output: 2170:RESET ALL;

# Keep only up to that line
head -2170 /tmp/baseline_step1.sql > /tmp/baseline_clean.sql
```

**Verify clean file:**
```bash
# First line should be SQL, not CLI message
head -1 /tmp/baseline_clean.sql
# Should see: SET statement_timeout = 0;

# Last line should be RESET ALL
tail -1 /tmp/baseline_clean.sql
# Should see: RESET ALL;
```

#### **4. Replace Old Baseline**

```bash
# Archive old baseline (keep for reference)
mv supabase/migrations/[OLD_BASELINE].sql \
   supabase/migrations/_archive_pre_baseline/

# Install new baseline with timestamp
TIMESTAMP=$(date +%Y%m%d)000000
cp /tmp/baseline_clean.sql \
   supabase/migrations/${TIMESTAMP}_baseline_from_production.sql
```

#### **5. Test Locally**

```bash
# Apply new baseline
supabase db reset

# Should complete without errors
# Check tables were created
docker exec -i supabase_db_[container] psql -U postgres postgres -c "\dt"
```

#### **6. Test Data Import**

```bash
# Export production data
supabase db dump --linked --data-only > /tmp/prod_data.sql

# Clean log messages (same process as schema)
tail -n +3 /tmp/prod_data.sql | grep -v "^A new version" > /tmp/data_clean.sql

# Import
cat /tmp/data_clean.sql | docker exec -i supabase_db_[container] psql -U postgres postgres

# Verify counts
docker exec -i supabase_db_[container] psql -U postgres postgres -c "
  SELECT 'users: ' || COUNT(*) FROM auth.users
  UNION ALL
  SELECT 'accounts: ' || COUNT(*) FROM j_hub_notion_db_accounts;
"
```

#### **7. Commit Changes**

```bash
git add supabase/migrations/
git commit -m "feat(migrations): Update baseline from production schema (YYYY-MM-DD)

- Replaced baseline with production dump from $(date +%Y-%m-%d)
- Schema now matches production exactly
- Verified: supabase db reset works
- Verified: production data import works
- Tables count: [X]
- Total lines: [Y]"
```

#### **8. Document What Changed**

Update this file with:
- Date of baseline creation
- Number of tables
- Major schema changes since last baseline
- Any breaking changes

---

## 🔍 Verification Checklist

After creating new baseline, verify:

- [ ] `supabase db reset` completes without errors
- [ ] All expected tables exist (`\dt` in psql)
- [ ] Production data imports without column errors
- [ ] Table counts match production
- [ ] Critical columns present (login_count, is_active, etc.)
- [ ] Commit message documents what changed

---

## 📊 Baseline History

### **Current Baseline (2025-10-14):**

```
File: 20250101000000_jumper_hub_baseline_from_production.sql
Lines: 2170
Created: 2025-10-14
Source: Direct dump from production (supabase db dump --linked)
Tables: 20+ (j_hub_*, j_ads_creative_*, auth.*)
Status: ✅ VERIFIED WORKING
```

**Key columns present:**
- `j_hub_users.login_count` (Oct 11 feature)
- `j_hub_users.is_active` (Oct 11 feature)
- `j_hub_optimization_transcripts.confidence_score`
- `j_hub_optimization_recordings.account_context`
- All optimization prompt tables

**Data import verified:**
- 9 users
- 43 accounts
- 19 managers
- 5 creative submissions
- 29 optimization recordings

---

### **Previous Baseline (2025-10-13) - DEPRECATED:**

```
File: 20250101000000_jumper_hub_baseline_schema.sql (archived)
Created: 2025-10-13
Source: Manual consolidation of 43 migrations
Status: ❌ INCOMPLETE (missing Oct 11 columns)
Issue: Schema didn't match production, data import failed
```

---

## 🚨 Common Issues

### **Issue 1: "column does not exist" during import**

**Cause:** Baseline outdated, missing recent schema changes

**Solution:** Create new baseline from production (follow this guide)

---

### **Issue 2: "syntax error at or near"**

**Cause:** CLI log messages in SQL file

**Solution:** Clean log messages (step 3 above)

---

### **Issue 3: Local works but production broken after deploy**

**Cause:** Baseline created from local, not production

**Solution:** ALWAYS create baseline from `--linked` (production), never `--local`

---

## 💡 Best Practices

1. **Baseline = Production Snapshot**
   - Always dump from `--linked` (production)
   - Never manually edit baseline SQL
   - Never consolidate migrations manually

2. **Keep Migration History**
   - Archive old migrations in `_archive_pre_baseline/`
   - Document what each baseline includes
   - Never delete migration files

3. **Test Before Commit**
   - Test `db reset` locally
   - Test data import
   - Verify table counts
   - Check critical columns exist

4. **Document Changes**
   - Update this guide after each baseline
   - Note major schema changes
   - Link to relevant commits

5. **Frequency**
   - Create baseline when >20 migrations accumulate
   - Or after major schema reorganization
   - Or when local/prod drift detected

---

## 📚 Related Documentation

- [MIGRATION-CLEANUP-SUMMARY.md](./MIGRATION-CLEANUP-SUMMARY.md) - Oct 13 cleanup (old method)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Database schema details
- [CLAUDE.md](../CLAUDE.md) - Supabase local workflow

---

**Remember:** Baseline is a PHOTO of present, not a STORY of past! 📸
