# Deprecated Scripts

**Date:** 2025-10-31
**Reason:** Consolidated into `.claude/agents/dev-setup.md`

---

## ⚠️ These Scripts Are No Longer Used

All functionality from these scripts has been consolidated into the **dev-setup agent**:

📄 **Location:** `.claude/agents/dev-setup.md`

---

## What Happened?

### **Before (Scattered):**
- `backup-production.sh` - Backup production database
- `backup-production-v2.sh` - Alternative backup method
- `restore-to-local.sh` - Restore backup to local
- `db-reset-safe.sh` - Safe database reset
- `start-dev.sh` - 7-step orchestration script

**Problems:**
- Logic duplicated across multiple files
- Hard to maintain consistency
- No single source of truth
- Scripts didn't handle all edge cases

### **After (Consolidated):**

All logic embedded in **one comprehensive agent** (1225 lines):

✅ **11 automated steps** with error recovery
✅ **Interactive confirmations** for key decisions
✅ **Comprehensive validation** ensures success
✅ **Built-in troubleshooting** for common issues
✅ **No external dependencies** - fully standalone

---

## How to Use Now

### **Instead of running scripts manually:**
```bash
❌ ./scripts/start-dev.sh  # OLD WAY
```

### **Simply ask Claude Code:**
```
✅ "Setup local development environment"
```

Claude will automatically use the dev-setup agent and complete all steps.

---

## Migration Notes

**For users who relied on these scripts:**

1. **All features preserved** - Nothing lost in consolidation
2. **Better error handling** - Agent catches more edge cases
3. **Automatic validation** - Ensures setup actually worked
4. **Smart decisions** - Agent detects existing data, recent backups, etc.

**Critical improvements in agent:**
- ⭐ Auto-creates `supabase/functions/.env` (fixes #1 common issue)
- ⭐ Detects system env var conflicts (prevents production connections)
- ⭐ Validates Edge Functions have API keys loaded
- ⭐ Comprehensive final validation (catches issues early)

---

## Why Keep These Files?

**Reference only** - In case we need to audit old logic or compare implementations.

**DO NOT USE** - These scripts are no longer maintained and may break with future changes.

---

## See Also

- `.claude/agents/dev-setup.md` - New comprehensive agent
- `CLAUDE.md` - Updated documentation
- `docs/DEV-SETUP.md` - Still valid manual setup guide (fallback)

---

**Last Updated:** 2025-10-31
**Maintained by:** Claude Code Assistant
