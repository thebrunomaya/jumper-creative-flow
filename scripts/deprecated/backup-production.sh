#!/bin/bash
# Backup Production Database to Local
# Usage: ./scripts/backup-production.sh

set -e

echo "🔄 Starting production database backup..."

# Production credentials
PROD_PROJECT_REF="biwwowendjuzvpttyrlb"
PROD_DB_PASSWORD="JumperStudio@7777"

# Try direct connection first (port 5432), fallback to pooler (port 6543)
PROD_DB_URL_DIRECT="postgresql://postgres.${PROD_PROJECT_REF}:${PROD_DB_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
PROD_DB_URL="${PROD_DB_URL_DIRECT}"

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/production_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "📥 Dumping production database..."
echo "   → Project: ${PROD_PROJECT_REF}"
echo "   → Output: ${BACKUP_FILE}"

# Dump production database using Supabase CLI
# The CLI uses pg_dump internally with proper configuration
npx supabase db dump \
  --db-url="${PROD_DB_URL}" \
  --file="${BACKUP_FILE}" \
  --use-copy \
  --data-only=false 2>&1 || {
    echo "❌ Error: Supabase CLI dump failed"
    echo ""
    echo "Alternative: Use Docker-based pg_dump"
    docker run --rm \
      postgres:15 \
      pg_dump "${PROD_DB_URL}" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges > "${BACKUP_FILE}" 2>&1 || {
        echo "❌ Docker fallback also failed"
        exit 1
      }
  }

if [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ Backup completed successfully!"
  echo "   → File: ${BACKUP_FILE}"
  echo "   → Size: ${BACKUP_SIZE}"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Review the backup file if needed"
  echo "   2. Run: ./scripts/restore-to-local.sh ${BACKUP_FILE}"
else
  echo "❌ Backup failed!"
  exit 1
fi
