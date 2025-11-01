#!/bin/bash
# Backup Production Database to Local (Alternative Method)
# Uses Supabase link + CLI or manual connection string
# Usage: ./scripts/backup-production-v2.sh

set -e

echo "🔄 Starting production database backup (v2)..."

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/production_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo ""
echo "📋 Choose backup method:"
echo "   1) Use Supabase CLI (requires project linked)"
echo "   2) Manual connection string (provide credentials)"
echo ""
read -p "Select option (1 or 2): " -r OPTION

if [ "$OPTION" = "1" ]; then
  echo ""
  echo "📥 Dumping via Supabase CLI (linked project)..."

  # Check if project is linked
  if ! npx supabase link --project-ref biwwowendjuzvpttyrlb 2>&1 | grep -q "Already linked"; then
    echo "🔗 Linking project..."
    npx supabase link --project-ref biwwowendjuzvpttyrlb
  fi

  # Dump using linked project
  npx supabase db dump --linked --file="${BACKUP_FILE}"

elif [ "$OPTION" = "2" ]; then
  echo ""
  echo "📝 Enter production database credentials:"
  echo ""
  read -p "Database Password: " -s DB_PASSWORD
  echo ""

  # Build connection string
  # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  PROJECT_REF="biwwowendjuzvpttyrlb"
  DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

  echo "📥 Dumping via connection string..."
  npx supabase db dump --db-url="${DB_URL}" --file="${BACKUP_FILE}"

else
  echo "❌ Invalid option"
  exit 1
fi

# Verify backup file was created
if [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo ""
  echo "✅ Backup completed successfully!"
  echo "   → File: ${BACKUP_FILE}"
  echo "   → Size: ${BACKUP_SIZE}"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Review the backup file if needed"
  echo "   2. Run: ./scripts/restore-to-local.sh ${BACKUP_FILE}"
else
  echo ""
  echo "❌ Backup failed! File not created."
  exit 1
fi
