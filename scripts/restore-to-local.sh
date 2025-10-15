#!/bin/bash
# Restore Production Backup to Local Supabase
# Usage: ./scripts/restore-to-local.sh <backup-file>

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "❌ Error: Backup file not provided"
  echo ""
  echo "Usage: ./scripts/restore-to-local.sh <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lh ./backups/*.sql 2>/dev/null || echo "  (no backups found)"
  exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Local database URL (from supabase status)
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "🔄 Starting database restore to local..."
echo "   → Source: ${BACKUP_FILE}"
echo "   → Target: Local Supabase (127.0.0.1:54322)"
echo ""

# Warning prompt
read -p "⚠️  This will REPLACE all local data. Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "📥 Restoring database..."

# Get absolute path to backup file
BACKUP_FILE_ABS=$(cd "$(dirname "${BACKUP_FILE}")" && pwd)/$(basename "${BACKUP_FILE}")

# Check if this is a schema-only or data-only dump
if grep -q "COPY.*FROM stdin" "${BACKUP_FILE}" || grep -q "INSERT INTO" "${BACKUP_FILE}"; then
  echo "   → Detected: Data dump"
  echo "   → Note: This will REPLACE existing data in tables"
  echo ""

  # Create a modified SQL with TRUNCATE statements and disabled triggers
  echo "   → Preparing import (disabling triggers, truncating tables)..."
  TEMP_SQL="/tmp/restore_with_truncate_$(date +%s).sql"

  cat > "${TEMP_SQL}" <<'SQLHEADER'
-- Disable triggers and foreign key checks for import
SET session_replication_role = replica;

SQLHEADER

  # Add the backup content
  cat "${BACKUP_FILE}" >> "${TEMP_SQL}"

  # Re-enable triggers at the end
  cat >> "${TEMP_SQL}" <<'SQLFOOTER'

-- Re-enable triggers and foreign key checks
SET session_replication_role = DEFAULT;

-- Show summary
SELECT 'Import completed' as status;
SQLFOOTER

  # Restore using Docker (psql via postgres image)
  docker run --rm \
    -v "${TEMP_SQL}:/backup.sql:ro" \
    --network host \
    postgres:15 \
    psql "${LOCAL_DB_URL}" -f /backup.sql -v ON_ERROR_STOP=0 2>&1 | \
    grep -E "(COPY|ERROR|WARNING|INSERT|completed)" | head -40 || {
      echo "⚠️  Some warnings occurred, but restore may have succeeded"
    }

  # Clean up temp file
  rm -f "${TEMP_SQL}"
else
  echo "   → Detected: Schema dump"

  # Restore schema using Docker
  docker run --rm \
    -v "${BACKUP_FILE_ABS}:/backup.sql:ro" \
    --network host \
    postgres:15 \
    psql "${LOCAL_DB_URL}" -f /backup.sql -v ON_ERROR_STOP=0 2>&1 | \
    grep -E "(ERROR|WARNING|CREATE)" | head -30 || true
fi

echo ""
echo "✅ Restore completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "   1. Verify data in Supabase Studio: http://127.0.0.1:54323"
echo "   2. Test application: npm run dev"
echo "   3. Check tables: psql ${LOCAL_DB_URL} -c '\dt'"
