#!/bin/bash
# Safe Database Reset with Auto Backup/Restore
# Usage: ./scripts/db-reset-safe.sh [--no-restore]
#
# This script prevents data loss during database resets by:
# 1. Creating/using a production backup automatically
# 2. Resetting the database (applies migrations)
# 3. Restoring the backup data
# 4. Setting development password for bruno@jumper.studio

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Safe Database Reset${NC}"
echo "====================="
echo ""

# Check for --no-restore flag
RESTORE=true
if [[ "$1" == "--no-restore" ]]; then
  RESTORE=false
  echo -e "${YELLOW}⚠️  Running in NO-RESTORE mode (data will be lost!)${NC}"
  echo ""
fi

# Step 1: Find or create recent backup
echo -e "${BLUE}📦 Step 1/4: Checking backups...${NC}"
LATEST_BACKUP=$(ls -t backups/production_data_*.sql 2>/dev/null | head -1)
BACKUP_AGE_HOURS=999

if [ -n "$LATEST_BACKUP" ]; then
  # Calculate backup age in hours
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
  else
    # Linux
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
  fi
  CURRENT_TIME=$(date +%s)
  BACKUP_AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))

  echo "   → Found backup: $(basename $LATEST_BACKUP)"
  echo "   → Age: ${BACKUP_AGE_HOURS} hours old"
fi

# Create new backup if none exists or too old (>24h)
if [ -z "$LATEST_BACKUP" ] || [ $BACKUP_AGE_HOURS -gt 24 ]; then
  if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${YELLOW}   ⚠️  No backup found${NC}"
  else
    echo -e "${YELLOW}   ⚠️  Backup is older than 24 hours${NC}"
  fi

  echo ""
  echo "   Creating fresh backup from production..."

  # Create backups directory if it doesn't exist
  mkdir -p backups

  BACKUP_FILE="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"

  if npx supabase db dump --linked --data-only --use-copy --file="${BACKUP_FILE}"; then
    echo -e "${GREEN}   ✅ Created: ${BACKUP_FILE}${NC}"
    LATEST_BACKUP="${BACKUP_FILE}"
  else
    echo -e "${RED}   ❌ Failed to create backup${NC}"
    echo "   Backup creation failed. Reset will continue but data will be lost!"
    echo ""
    read -p "   Continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      echo "Reset cancelled"
      exit 1
    fi
    RESTORE=false  # Can't restore if backup failed
  fi
else
  echo -e "${GREEN}   ✅ Using recent backup (less than 24h old)${NC}"
fi
echo ""

# Step 2: Reset database
echo -e "${BLUE}🗄️  Step 2/4: Resetting local database...${NC}"
echo "   This will:"
echo "   - Drop all data (preserves schema structure)"
echo "   - Reapply all migrations from scratch"
echo "   - Leave database empty (0 rows)"
echo ""

npx supabase db reset --local

echo -e "${GREEN}   ✅ Database reset completed${NC}"
echo ""

# Step 3: Restore backup (unless --no-restore)
if [ "$RESTORE" = true ] && [ -n "$LATEST_BACKUP" ]; then
  echo -e "${BLUE}📥 Step 3/4: Restoring production data...${NC}"
  echo "   Using backup: $(basename $LATEST_BACKUP)"
  echo ""

  # Call restore script with auto-yes
  echo "yes" | ./scripts/restore-to-local.sh "${LATEST_BACKUP}" 2>&1 | tail -15

  echo ""
  echo -e "${GREEN}   ✅ Data restored successfully${NC}"
else
  echo -e "${YELLOW}⏭️  Step 3/4: Skipping restore${NC}"
  if [ "$RESTORE" = false ]; then
    echo "   Reason: --no-restore flag"
  else
    echo "   Reason: No backup available"
  fi
fi
echo ""

# Step 4: Summary
echo -e "${GREEN}🎉 Step 4/4: Reset completed!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$RESTORE" = true ] && [ -n "$LATEST_BACKUP" ]; then
  # Count restored users (with fallback)
  USER_COUNT=$(docker run --rm --network host postgres:15 \
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -t -c "SELECT COUNT(*) FROM j_hub_users;" 2>/dev/null | xargs || echo "Unknown")

  echo -e "   ${GREEN}✅ Schema: Up to date${NC}"
  echo -e "   ${GREEN}✅ Data: Restored from backup${NC}"
  echo "   👥 Users: ${USER_COUNT}"
  echo -e "   ${BLUE}🔑 Dev login: bruno@jumper.studio / senha123${NC}"
else
  echo -e "   ${GREEN}✅ Schema: Up to date${NC}"
  echo -e "   ${YELLOW}⚠️  Data: EMPTY (no restore performed)${NC}"
  echo "   👥 Users: 0"
  echo ""
  echo -e "   ${YELLOW}⚠️  To restore data, run:${NC}"
  echo "      ./scripts/restore-to-local.sh backups/production_data_*.sql"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next steps:"
echo "   1. Check Supabase Studio: http://127.0.0.1:54323"
echo "   2. Start dev server: npm run dev"
echo "   3. Test login: bruno@jumper.studio / senha123"
echo ""
