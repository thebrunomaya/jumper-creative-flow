# Development Environment Setup Agent

**Purpose:** Fully automated setup of local development environment with production data and comprehensive validation.

**Type:** Standalone automation (no external scripts required)
**Duration:** 2-3 minutes
**Safety:** Only affects local environment (production access is read-only)

---

## 🎯 What This Agent Does

Sets up a complete, validated local development environment by:

1. ✅ **Validating Prerequisites** - Docker, Supabase CLI, authentication
2. ✅ **Configuring Edge Functions** - Auto-creates environment files
3. ✅ **Detecting Conflicts** - Checks for system env var overrides
4. ✅ **Syncing Production Data** - Creates/reuses recent backups (<24h)
5. ✅ **Resetting Database Safely** - Applies migrations without data loss
6. ✅ **Setting Development Password** - Ensures senha123 works for bruno@jumper.studio
7. ✅ **Starting Services** - Supabase Local + npm dev server
8. ✅ **Comprehensive Validation** - Tests all components work correctly

---

## 📋 Expected Outcome

After completion, you will have:

- ✅ Supabase local at `http://127.0.0.1:54321`
- ✅ Database with production data
- ✅ Edge Functions with API keys configured
- ✅ Frontend dev server at `http://localhost:8080`
- ✅ Dev credentials: `bruno@jumper.studio` / `senha123`
- ✅ All components validated and tested

---

## 🚀 Usage Context

Use this agent when:

- Starting new development session
- Switching between computers
- Need fresh production data locally
- After pulling new migrations from git
- Onboarding new developers
- Debugging production issues locally

---

## 📖 Step-by-Step Process

### **Step 1: Supabase CLI Authentication Check**

**What:** Verify Supabase CLI can connect to production project.

**Why:** Required for creating backups from production database.

**Execute:**

```bash
# Test authentication by listing projects
npx supabase projects list 2>&1
```

**Expected output:**
```
┌──────────────────────┬──────────────────────┐
│ ID                   │ Name                 │
├──────────────────────┼──────────────────────┤
│ biwwowendjuzvpttyrlb │ jumper-creative-flow │
└──────────────────────┴──────────────────────┘
```

**If fails:**

```bash
# Error: "Invalid access token" or "Not authenticated"
# Solution: Authenticate with Supabase
npx supabase login
```

**Agent action:** If authentication fails, STOP and prompt user to run `npx supabase login`, then restart agent.

---

### **Step 2: Docker Environment Check**

**What:** Verify Docker Desktop is running and accessible.

**Why:** Supabase Local requires Docker containers for PostgreSQL, Auth, Storage, Edge Runtime.

**Execute:**

```bash
# Check Docker daemon is accessible
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker is not running"
  echo "   Please start Docker Desktop and restart this agent"
  exit 1
fi

echo "✅ Docker is running"

# Show Docker version for context
docker --version
```

**Expected output:**
```
✅ Docker is running
Docker version 24.0.6, build ed223bc
```

**If fails:**

- **Error:** "Cannot connect to the Docker daemon"
- **Solution:** Start Docker Desktop application
- **macOS:** Open `/Applications/Docker.app`
- **Wait:** 30-60 seconds for Docker to fully start
- **Validate:** Run `docker ps` to confirm

**Agent action:** If Docker is not running, STOP and prompt user to start Docker Desktop, then restart agent.

---

### **Step 3: Edge Functions Environment Setup** ⭐ **CRITICAL**

**What:** Automatically create `supabase/functions/.env` with API keys.

**Why:** Edge Functions run in Docker container and need API keys (OpenAI, Anthropic) to work. Without this file, optimization features fail with "API_KEY not configured" errors.

**Execute:**

```bash
# Check if source file exists
if [ ! -f "supabase/.env" ]; then
  echo "❌ Missing supabase/.env"
  echo "   This file should contain:"
  echo "   - OPENAI_API_KEY=sk-proj-..."
  echo "   - ANTHROPIC_API_KEY=sk-ant-api03-..."
  echo ""
  echo "   Please add API keys to supabase/.env and restart agent"
  exit 1
fi

# Check if supabase/functions/.env already exists
if [ -f "supabase/functions/.env" ]; then
  echo "✅ supabase/functions/.env already exists"
else
  echo "📝 Creating supabase/functions/.env from supabase/.env..."
  cp supabase/.env supabase/functions/.env
  echo "✅ Created supabase/functions/.env"
fi

# Validate API keys exist in file
if ! grep -q "OPENAI_API_KEY" supabase/functions/.env || \
   ! grep -q "ANTHROPIC_API_KEY" supabase/functions/.env; then
  echo "⚠️  Warning: API keys may be missing in supabase/functions/.env"
  echo "   Edge Functions may fail without:"
  echo "   - OPENAI_API_KEY (for transcription)"
  echo "   - ANTHROPIC_API_KEY (for context extraction)"
fi

echo ""
echo "Edge Functions environment ready:"
cat supabase/functions/.env | grep -E "^[A-Z_]+_API_KEY=" | sed 's/=.*/=***REDACTED***/'
```

**Expected output:**
```
✅ Created supabase/functions/.env

Edge Functions environment ready:
OPENAI_API_KEY=***REDACTED***
ANTHROPIC_API_KEY=***REDACTED***
```

**Common issue:**

- **Problem:** "OPENAI_API_KEY not configured" error in Edge Functions
- **Root cause:** `supabase/functions/.env` doesn't exist or wasn't loaded
- **Prevention:** This step auto-creates the file BEFORE Supabase starts
- **Validation:** After Supabase starts, we'll verify Docker container has the keys

---

### **Step 4: System Environment Variable Validation** ⭐ **CRITICAL**

**What:** Check for conflicting system environment variables that override `.env.local`.

**Why:** Vite loads env vars in this order: **System vars > .env.local > .env**

If user has `VITE_SUPABASE_URL` in their shell config (`.zshrc`, `.bashrc`), it will override `.env.local` and connect frontend to **PRODUCTION** instead of **LOCAL**. This is dangerous!

**Execute:**

```bash
echo "🔍 Checking for conflicting system environment variables..."

# Check for VITE_* variables in system environment
CONFLICTING_VARS=$(env | grep "^VITE_" || true)

if [ -n "$CONFLICTING_VARS" ]; then
  echo ""
  echo "⚠️  WARNING: Found system environment variables that will override .env.local:"
  echo ""
  echo "$CONFLICTING_VARS" | while IFS= read -r line; do
    echo "   $line"
  done
  echo ""
  echo "These variables are set in your shell config (~/.zshrc or ~/.bash_profile)"
  echo ""
  echo "This means your frontend will connect to PRODUCTION, not LOCAL!"
  echo ""
  echo "🛠️  To fix:"
  echo "   1. Edit your shell config:"
  echo "      nano ~/.zshrc  (or ~/.bash_profile)"
  echo ""
  echo "   2. Comment out or delete lines like:"
  echo "      export VITE_SUPABASE_URL=..."
  echo "      export VITE_SUPABASE_ANON_KEY=..."
  echo ""
  echo "   3. Reload shell:"
  echo "      source ~/.zshrc"
  echo ""
  echo "   4. Restart this agent"
  echo ""
  read -p "Press Enter to continue anyway (RISKY) or Ctrl+C to abort and fix: "
else
  echo "✅ No conflicting system environment variables found"
fi
```

**Expected output (good):**
```
🔍 Checking for conflicting system environment variables...
✅ No conflicting system environment variables found
```

**Expected output (bad):**
```
🔍 Checking for conflicting system environment variables...

⚠️  WARNING: Found system environment variables that will override .env.local:

   VITE_SUPABASE_URL=https://biwwowendjuzvpttyrlb.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...

[Instructions to fix...]
```

**Agent action:** If conflicts found, pause and give user clear instructions. Continue only if user confirms (risky).

---

### **Step 5: Production Backup Creation**

**What:** Create fresh backup from production or reuse recent backup (<24 hours old).

**Why:** Need production data to test locally. Smart reuse saves time (~60 seconds).

**Interactive decision:** Ask user if they want to create backup or skip (if already have data).

**Execute:**

```bash
echo "📦 Step 5: Production Backup Management"
echo ""

# Check if local database already has real data
echo "Checking local database for existing data..."
USER_COUNT=$(docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -t -c "SELECT COUNT(*) FROM j_hub_users WHERE email NOT LIKE '%exemplo.com%';" 2>/dev/null | xargs || echo "0")

if [ "$USER_COUNT" != "0" ] && [ -n "$USER_COUNT" ]; then
  echo "✅ Local database has $USER_COUNT real users"
  echo ""
  read -p "Do you want to refresh with latest production data? (yes/no): " REFRESH_DATA

  if [[ ! $REFRESH_DATA =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "⏭️  Skipping backup (using existing local data)"
    SKIP_BACKUP=true
  fi
fi

if [ "$SKIP_BACKUP" != "true" ]; then
  # Look for recent backups
  echo "Looking for recent backups..."
  BACKUP_DIR="./backups"
  mkdir -p "$BACKUP_DIR"

  LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_data_*.sql" -mtime -1 2>/dev/null | sort -r | head -1)

  if [ -n "$LATEST_BACKUP" ]; then
    # Calculate backup age
    if [[ "$OSTYPE" == "darwin"* ]]; then
      BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
    else
      BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
    fi
    CURRENT_TIME=$(date +%s)
    BACKUP_AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))

    echo "✅ Found backup: $(basename "$LATEST_BACKUP")"
    echo "   Age: ${BACKUP_AGE_HOURS} hours old"

    if [ $BACKUP_AGE_HOURS -lt 24 ]; then
      echo "   Using recent backup (less than 24h)"
    else
      echo "   Backup is older than 24 hours, creating fresh one..."
      LATEST_BACKUP=""
    fi
  fi

  # Create new backup if none found or too old
  if [ -z "$LATEST_BACKUP" ]; then
    echo ""
    echo "📥 Creating fresh production backup..."
    BACKUP_FILE="${BACKUP_DIR}/production_data_$(date +%Y%m%d_%H%M%S).sql"

    # Production credentials
    PROD_PROJECT_REF="biwwowendjuzvpttyrlb"
    PROD_DB_PASSWORD="JumperStudio@7777"
    PROD_DB_URL="postgresql://postgres.${PROD_PROJECT_REF}:${PROD_DB_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

    echo "   Project: ${PROD_PROJECT_REF}"
    echo "   Output: ${BACKUP_FILE}"
    echo ""

    # Try Supabase CLI dump
    if npx supabase db dump \
      --db-url="${PROD_DB_URL}" \
      --file="${BACKUP_FILE}" \
      --use-copy \
      --data-only=false 2>&1; then

      BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
      echo ""
      echo "✅ Backup created successfully!"
      echo "   File: ${BACKUP_FILE}"
      echo "   Size: ${BACKUP_SIZE}"
      LATEST_BACKUP="${BACKUP_FILE}"
    else
      echo ""
      echo "❌ Supabase CLI dump failed, trying Docker fallback..."

      # Fallback to Docker-based pg_dump
      docker run --rm postgres:15 \
        pg_dump "${PROD_DB_URL}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges > "${BACKUP_FILE}" 2>&1 && {
          BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
          echo "✅ Backup created via Docker fallback!"
          echo "   File: ${BACKUP_FILE}"
          echo "   Size: ${BACKUP_SIZE}"
          LATEST_BACKUP="${BACKUP_FILE}"
        } || {
          echo "❌ Both backup methods failed!"
          echo ""
          echo "Please check:"
          echo "  1. Supabase CLI authentication (npx supabase login)"
          echo "  2. Production database credentials"
          echo "  3. Network connectivity"
          exit 1
        }
    fi
  fi

  # Export for use in restore step
  export BACKUP_TO_RESTORE="$LATEST_BACKUP"
fi

echo ""
```

**Expected output:**
```
📦 Step 5: Production Backup Management

Checking local database for existing data...
✅ Local database has 0 real users

Looking for recent backups...
✅ Found backup: production_data_20251031_143022.sql
   Age: 3 hours old
   Using recent backup (less than 24h)
```

**Or if creating new:**
```
📥 Creating fresh production backup...
   Project: biwwowendjuzvpttyrlb
   Output: ./backups/production_data_20251031_164533.sql

✅ Backup created successfully!
   File: ./backups/production_data_20251031_164533.sql
   Size: 2.3M
```

---

### **Step 6: Start Supabase Local**

**What:** Launch Docker containers for local Supabase (PostgreSQL, Auth, Storage, Edge Runtime).

**Why:** Need local Supabase running before we can reset database and restore data.

**Execute:**

```bash
echo "🐳 Step 6: Starting Supabase Local"
echo ""

# Check if already running
if npx supabase status > /dev/null 2>&1; then
  echo "✅ Supabase already running"
  echo ""
  echo "Current status:"
  npx supabase status
else
  echo "Starting Supabase containers (this may take 30-60 seconds)..."
  echo ""

  npx supabase start

  echo ""
  echo "✅ Supabase started successfully"
fi

echo ""

# Validate Edge Runtime has API keys
echo "Validating Edge Functions environment..."
if docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep -q "OPENAI_API_KEY"; then
  echo "✅ Edge Runtime has OPENAI_API_KEY"
else
  echo "⚠️  Edge Runtime missing OPENAI_API_KEY"
  echo "   This may cause transcription failures"
fi

if docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep -q "ANTHROPIC_API_KEY"; then
  echo "✅ Edge Runtime has ANTHROPIC_API_KEY"
else
  echo "⚠️  Edge Runtime missing ANTHROPIC_API_KEY"
  echo "   This may cause context extraction failures"
fi

echo ""
```

**Expected output:**
```
🐳 Step 6: Starting Supabase Local

Starting Supabase containers (this may take 30-60 seconds)...

Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323

✅ Supabase started successfully

Validating Edge Functions environment...
✅ Edge Runtime has OPENAI_API_KEY
✅ Edge Runtime has ANTHROPIC_API_KEY
```

---

### **Step 7: Database Reset (Safe)**

**What:** Reset local database and apply all migrations.

**Why:** Ensures clean schema state before restoring production data.

**Safety:** Uses safe wrapper that preserves data via backup/restore.

**Execute:**

```bash
echo "🗄️  Step 7: Resetting Local Database"
echo ""
echo "This will:"
echo "  - Drop all data (preserves schema structure)"
echo "  - Reapply all migrations from scratch"
echo "  - Leave database empty (0 rows)"
echo ""
echo "⚠️  Data will be restored in next step from backup"
echo ""

read -p "Continue with database reset? (yes/no): " CONFIRM_RESET

if [[ ! $CONFIRM_RESET =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Setup cancelled by user"
  exit 1
fi

echo ""
echo "Resetting database..."

npx supabase db reset --local

echo ""
echo "✅ Database reset completed"
echo "   All migrations have been applied"
echo "   Database is now empty (0 rows)"
echo ""
```

**Expected output:**
```
🗄️  Step 7: Resetting Local Database

This will:
  - Drop all data (preserves schema structure)
  - Reapply all migrations from scratch
  - Leave database empty (0 rows)

⚠️  Data will be restored in next step from backup

Continue with database reset? (yes/no): yes

Resetting database...
Applying migration 20240701000000_initial_schema.sql...
Applying migration 20240815000000_add_optimization_tables.sql...
... (all migrations)

✅ Database reset completed
   All migrations have been applied
   Database is now empty (0 rows)
```

---

### **Step 8: Data Restoration**

**What:** Restore production backup to local database.

**Why:** Populate local database with real production data for realistic testing.

**Safety:** Disables triggers during import, handles duplicate keys, sets dev password.

**Execute:**

```bash
echo "📥 Step 8: Restoring Production Data"
echo ""

if [ -z "$BACKUP_TO_RESTORE" ]; then
  echo "⏭️  No backup to restore (skipped backup step)"
  echo ""
else
  echo "Backup file: $(basename "$BACKUP_TO_RESTORE")"
  echo ""

  # Get absolute path
  BACKUP_FILE_ABS=$(cd "$(dirname "${BACKUP_TO_RESTORE}")" && pwd)/$(basename "${BACKUP_TO_RESTORE}")

  # Local database URL
  LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

  echo "Preparing import (disabling triggers, truncating tables)..."

  # Create modified SQL with trigger disabling
  TEMP_SQL="/tmp/restore_with_truncate_$(date +%s).sql"

  cat > "${TEMP_SQL}" <<'SQLHEADER'
-- Disable triggers and foreign key checks for import
SET session_replication_role = replica;

SQLHEADER

  # Add backup content
  cat "${BACKUP_FILE_ABS}" >> "${TEMP_SQL}"

  # Re-enable triggers
  cat >> "${TEMP_SQL}" <<'SQLFOOTER'

-- Re-enable triggers and foreign key checks
SET session_replication_role = DEFAULT;

-- Show summary
SELECT 'Import completed' as status;
SQLFOOTER

  # Restore using Docker psql
  echo "Importing data..."
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

  echo ""
  echo "✅ Data restored successfully!"
fi

echo ""
```

**Expected output:**
```
📥 Step 8: Restoring Production Data

Backup file: production_data_20251031_143022.sql

Preparing import (disabling triggers, truncating tables)...
Importing data...
COPY 9
COPY 48
COPY 24
... (progress indicators)
Import completed

✅ Data restored successfully!
```

---

### **Step 8.5: Development Password Setup** 🔐

**What:** Set development password AFTER data is fully restored.

**Why:** Password must be set after restore completes to ensure user exists and avoid race conditions.

**Safety:** Includes validation checks and clear error messages.

**Execute:**

```bash
echo "🔐 Step 8.5: Development Password Setup"
echo ""

# Only proceed if we restored data
if [ -z "$BACKUP_TO_RESTORE" ]; then
  echo "⏭️  No data was restored, skipping password setup"
  echo ""
else
  echo "Setting development password for bruno@jumper.studio..."
  echo ""

  # 1. Verify user exists
  echo "Checking if user exists..."
  USER_EXISTS=$(docker exec -i supabase_db_biwwowendjuzvpttyrlb psql -U postgres -d postgres -t -c \
    "SELECT COUNT(*) FROM auth.users WHERE email = 'bruno@jumper.studio';" 2>&1 | xargs)

  if [ "$USER_EXISTS" != "1" ]; then
    echo "⚠️  Warning: bruno@jumper.studio not found in database"
    echo "   Password cannot be set"
    echo "   You may need to create this user manually or use different credentials"
    echo ""
  else
    echo "   ✅ User found in database"
    echo ""

    # 2. Ensure pgcrypto extension exists
    echo "Ensuring pgcrypto extension is available..."
    docker exec -i supabase_db_biwwowendjuzvpttyrlb psql -U postgres -d postgres -c \
      "CREATE EXTENSION IF NOT EXISTS pgcrypto;" > /dev/null 2>&1
    echo "   ✅ pgcrypto extension ready"
    echo ""

    # 3. Update password WITH full error output
    echo "Updating password to 'senha123'..."

    UPDATE_RESULT=$(docker exec -i supabase_db_biwwowendjuzvpttyrlb psql -U postgres -d postgres -c \
      "UPDATE auth.users SET encrypted_password = crypt('senha123', gen_salt('bf')) WHERE email = 'bruno@jumper.studio';" 2>&1)

    UPDATE_EXIT_CODE=$?

    if [ $UPDATE_EXIT_CODE -eq 0 ] && echo "$UPDATE_RESULT" | grep -q "UPDATE 1"; then
      echo "   ✅ Password successfully set to 'senha123'"
      echo ""

      # 4. VALIDATE password actually works
      echo "Validating password hash..."
      HASH_CHECK=$(docker exec -i supabase_db_biwwowendjuzvpttyrlb psql -U postgres -d postgres -t -c \
        "SELECT encrypted_password = crypt('senha123', encrypted_password) FROM auth.users WHERE email = 'bruno@jumper.studio';" 2>&1 | xargs)

      if [ "$HASH_CHECK" = "t" ]; then
        echo "   ✅ Password validation successful"
      else
        echo "   ⚠️  Password set but validation failed (hash may not match)"
        echo "   Try logging in - if it doesn't work, manually reset password"
      fi
    else
      echo "   ❌ Password update FAILED!"
      echo ""
      echo "Error details:"
      echo "$UPDATE_RESULT"
      echo ""
      echo "⚠️  This means you won't be able to login with senha123"
      echo ""
      echo "Possible solutions:"
      echo "  1. Check if bruno@jumper.studio exists in auth.users"
      echo "  2. Manually reset password in Supabase Studio (http://127.0.0.1:54323)"
      echo "  3. Try logging in with your actual production password"
      echo ""
    fi
  fi
fi

echo ""
```

**Expected output (success):**
```
🔐 Step 8.5: Development Password Setup

Setting development password for bruno@jumper.studio...

Checking if user exists...
   ✅ User found in database

Ensuring pgcrypto extension is available...
   ✅ pgcrypto extension ready

Updating password to 'senha123'...
   ✅ Password successfully set to 'senha123'

Validating password hash...
   ✅ Password validation successful
```

**Expected output (failure - now visible!):**
```
🔐 Step 8.5: Development Password Setup

Setting development password for bruno@jumper.studio...

Checking if user exists...
   ✅ User found in database

Ensuring pgcrypto extension is available...
   ✅ pgcrypto extension ready

Updating password to 'senha123'...
   ❌ Password update FAILED!

Error details:
ERROR:  function gen_salt(unknown) does not exist
LINE 1: ...ypted_password = crypt('senha123', gen_salt('bf')) WHERE...

⚠️  This means you won't be able to login with senha123

Possible solutions:
  1. Check if bruno@jumper.studio exists in auth.users
  2. Manually reset password in Supabase Studio (http://127.0.0.1:54323)
  3. Try logging in with your actual production password
```

---

### **Step 9.5: Frontend Environment Setup**

**What:** Create/validate `.env.local` file for frontend to connect to local Supabase.

**Why:** Without this, frontend connects to production (dangerous!).

**Execute:**

```bash
echo "🔧 Step 9: Frontend Environment Setup"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  if grep -q "127.0.0.1:54321" .env.local; then
    echo "✅ .env.local configured for LOCAL"
  else
    echo "⚠️  .env.local exists but NOT configured for LOCAL"
    echo "   Current content:"
    cat .env.local | grep "VITE_SUPABASE_URL"
    echo ""
    echo "   Overwriting with LOCAL configuration..."

    cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF

    echo "   ✅ Overwritten with LOCAL config"
  fi
else
  echo "⚠️  No .env.local found"
  echo "   Creating .env.local for LOCAL development..."

  cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF

  echo "   ✅ .env.local created"
fi

echo ""

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing NPM dependencies..."
  npm install > /dev/null 2>&1
  echo "✅ Dependencies installed"
  echo ""
fi
```

**Expected output:**
```
🔧 Step 9.5: Frontend Environment Setup

✅ .env.local configured for LOCAL

📦 Installing NPM dependencies...
✅ Dependencies installed
```

---

### **Step 10.5: Service Startup**

**What:** Start npm development server.

**Why:** Need Vite dev server running to access application.

**Execute:**

```bash
echo "🚀 Step 10: Starting Development Server"
echo ""

echo "Starting Vite development server..."

# Kill any existing dev server
pkill -f "vite" 2>/dev/null || true

# Start dev server in background
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

# Wait for server to start
sleep 3

# Check if started successfully
if kill -0 $VITE_PID 2>/dev/null; then
  echo "✅ Vite dev server started (PID: ${VITE_PID})"
  echo ""

  # Extract URL from log
  if grep -q "Local:" /tmp/vite-dev.log; then
    DEV_URL=$(grep "Local:" /tmp/vite-dev.log | awk '{print $NF}')
    echo "   🌐 URL: ${DEV_URL}"
  else
    echo "   🌐 URL: http://localhost:8080"
  fi
else
  echo "❌ Failed to start Vite dev server"
  echo ""
  echo "Check logs:"
  tail -20 /tmp/vite-dev.log
  exit 1
fi

echo ""
```

**Expected output:**
```
🚀 Step 10.5: Starting Development Server

Starting Vite development server...
✅ Vite dev server started (PID: 12345)

   🌐 URL: http://localhost:8080
```

---

### **Step 11.5: Comprehensive Validation** ⭐ **ENHANCED**

**What:** Test all components to ensure setup succeeded.

**Why:** Catch issues early instead of discovering during development.

**Validations:**
1. ✅ Docker containers running
2. ✅ Database has real data
3. ✅ Edge Functions responding
4. ✅ Frontend connects to LOCAL (not production)
5. ✅ Development server running
6. ✅ Development password set correctly

**Execute:**

```bash
echo "🔍 Step 11: Comprehensive Validation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 System Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Docker containers
echo "1. Docker Containers:"
SUPABASE_CONTAINERS=$(docker ps --filter "name=supabase" --format "{{.Names}}" | wc -l | xargs)
if [ "$SUPABASE_CONTAINERS" -ge "6" ]; then
  echo "   ✅ All containers running ($SUPABASE_CONTAINERS/6+)"
else
  echo "   ⚠️  Some containers may be missing ($SUPABASE_CONTAINERS/6+)"
fi
echo ""

# 2. Database data
echo "2. Database Data:"
USER_COUNT=$(docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -t -c "SELECT COUNT(*) FROM j_hub_users;" 2>/dev/null | xargs || echo "0")
ACCOUNT_COUNT=$(docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -t -c "SELECT COUNT(*) FROM j_hub_notion_db_accounts;" 2>/dev/null | xargs || echo "0")

if [ "$USER_COUNT" != "0" ]; then
  echo "   ✅ Database has $USER_COUNT users"
  echo "   ✅ Database has $ACCOUNT_COUNT accounts"
else
  echo "   ⚠️  Database appears empty (0 users)"
fi
echo ""

# 3. Edge Functions connectivity
echo "3. Edge Functions:"
EDGE_TEST=$(curl -s http://127.0.0.1:54321/functions/v1/ 2>&1 || echo "failed")
if [[ "$EDGE_TEST" != "failed" ]]; then
  echo "   ✅ Edge Functions endpoint responding"
else
  echo "   ⚠️  Edge Functions not responding"
fi
echo ""

# 4. Frontend environment
echo "4. Frontend Configuration:"
if [ -f ".env.local" ] && grep -q "127.0.0.1:54321" .env.local; then
  echo "   ✅ .env.local configured for LOCAL"
else
  echo "   ⚠️  .env.local not configured for LOCAL"
fi
echo ""

# 5. Dev server
echo "5. Development Server:"
if pgrep -f "vite" > /dev/null; then
  echo "   ✅ Vite dev server running"
else
  echo "   ⚠️  Vite dev server not running"
fi
echo ""

# 6. Development password validation
echo "6. Development Password:"
PW_VALID=$(docker exec -i supabase_db_biwwowendjuzvpttyrlb psql -U postgres -d postgres -t -c \
  "SELECT encrypted_password = crypt('senha123', encrypted_password) FROM auth.users WHERE email = 'bruno@jumper.studio';" 2>/dev/null | xargs || echo "f")

if [ "$PW_VALID" = "t" ]; then
  echo "   ✅ Password 'senha123' is set correctly"
else
  echo "   ⚠️  Password may not be set correctly"
  echo "   Try logging in to verify, or check Step 8.5 output for errors"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access Points:"
echo "   🌐 Frontend:       http://localhost:8080"
echo "   🗄️  Database:       postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "   🎨 Supabase Studio: http://127.0.0.1:54323"
echo "   📧 Mailpit (emails): http://127.0.0.1:54324"
echo "   ⚡ Edge Functions:  http://127.0.0.1:54321/functions/v1/"
echo ""
echo "🔑 Development Credentials:"
echo "   Email:    bruno@jumper.studio"
echo "   Password: senha123"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:8080 in browser"
echo "   2. Open DevTools Console (F12) and verify:"
echo "      → Should show: 🔗 Supabase: LOCAL (http://127.0.0.1:54321)"
echo "      → If shows PRODUCTION, STOP and check system env vars"
echo "   3. Login with credentials above"
echo "   4. Verify data loads correctly"
echo ""
echo "📝 View Logs:"
echo "   Vite:           tail -f /tmp/vite-dev.log"
echo "   Edge Functions: docker logs -f supabase_edge_runtime_biwwowendjuzvpttyrlb"
echo "   Database:       docker logs -f supabase_db_biwwowendjuzvpttyrlb"
echo ""
```

**Expected output:**
```
🔍 Step 11.5: Comprehensive Validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 System Status Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Docker Containers:
   ✅ All containers running (7/6+)

2. Database Data:
   ✅ Database has 9 users
   ✅ Database has 48 accounts

3. Edge Functions:
   ✅ Edge Functions endpoint responding

4. Frontend Configuration:
   ✅ .env.local configured for LOCAL

5. Development Server:
   ✅ Vite dev server running

6. Development Password:
   ✅ Password 'senha123' is set correctly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Access points and credentials...]
```

---

## 🛠️ Error Recovery Guide

### **Error: "Invalid access token" (Step 1)**

**Problem:** Supabase CLI not authenticated.

**Solution:**
```bash
npx supabase login
# Follow browser authentication flow
# Restart agent after authentication
```

---

### **Error: "Cannot connect to Docker daemon" (Step 2)**

**Problem:** Docker Desktop not running.

**Solution:**
1. Open Docker Desktop application
2. Wait 30-60 seconds for full startup
3. Verify with: `docker ps`
4. Restart agent

---

### **Error: "OPENAI_API_KEY not configured" (Step 3)**

**Problem:** API keys missing from `supabase/.env`.

**Solution:**
```bash
# 1. Edit source file
nano supabase/.env

# 2. Add required keys:
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...

# 3. Restart agent (will auto-copy to supabase/functions/.env)
```

---

### **Error: Frontend shows "PRODUCTION" in console (Step 4)**

**Problem:** System environment variables overriding `.env.local`.

**Solution:**
```bash
# 1. Find conflicting variables
env | grep VITE

# 2. Edit shell config
nano ~/.zshrc  # or ~/.bash_profile

# 3. Comment out exports:
# export VITE_SUPABASE_URL=...

# 4. Reload shell
source ~/.zshrc

# 5. Restart agent
```

---

### **Error: Backup fails with "connection refused" (Step 5)**

**Problem:** Cannot connect to production database.

**Solutions:**

1. **Check authentication:**
   ```bash
   npx supabase login
   npx supabase projects list
   ```

2. **Verify credentials:**
   - Project ref: `biwwowendjuzvpttyrlb`
   - Password: Check `supabase/.env`

3. **Test connection:**
   ```bash
   npx supabase db dump --linked --help
   ```

---

### **Error: Database restore shows duplicate key errors (Step 8)**

**Problem:** Database not properly reset before restore.

**Solution:**
```bash
# 1. Stop Supabase
npx supabase stop

# 2. Clean database files
npx supabase db reset --local

# 3. Restart agent
# Agent will reset again and restore cleanly
```

---

### **Error: Edge Functions returning 500 errors (Step 11)**

**Problem:** Edge Functions not loading API keys.

**Diagnosis:**
```bash
# Check if keys are in container
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep API_KEY
```

**Solutions:**

1. **If no keys found:**
   ```bash
   # Verify file exists
   cat supabase/functions/.env | grep API_KEY

   # Restart Supabase to reload
   npx supabase stop
   npx supabase start
   ```

2. **If file missing:**
   ```bash
   # Create file
   cp supabase/.env supabase/functions/.env

   # Restart
   npx supabase stop
   npx supabase start
   ```

---

## 🔍 Troubleshooting Reference

### **Common Issue #1: Frontend connects to PRODUCTION**

**Symptoms:**
- Console shows: `🔗 Supabase: PRODUCTION`
- Changes don't appear in local database
- Production data being modified (DANGEROUS!)

**Root cause:** System environment variables override `.env.local`

**Fix:** See "Error Recovery Guide" above for Step 4.

---

### **Common Issue #2: Edge Functions fail with API_KEY errors**

**Symptoms:**
- Transcription fails: "OPENAI_API_KEY not configured"
- Context extraction fails: "ANTHROPIC_API_KEY not configured"

**Root cause:** `supabase/functions/.env` doesn't exist or wasn't loaded into Docker container

**Fix:** See "Error Recovery Guide" above for Step 3.

---

### **Common Issue #3: Database has 0 users after restore**

**Symptoms:**
- Validation shows: "Database has 0 users"
- Login fails: "Invalid credentials"

**Root causes:**
1. Backup file is empty or corrupt
2. Restore failed silently
3. Wrong backup file used

**Fix:**
```bash
# 1. Verify backup file has data
grep -A 5 "COPY.*j_hub_users" ./backups/production_data_*.sql | head -10

# 2. If empty, create fresh backup
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/fresh_$(date +%Y%m%d_%H%M%S).sql"

# 3. Restart agent with fresh backup
```

---

### **Common Issue #4: Vite dev server won't start**

**Symptoms:**
- Error: "Port 8080 already in use"
- Dev server crashes immediately

**Fixes:**

1. **Port already in use:**
   ```bash
   # Find process using port
   lsof -ti:8080

   # Kill it
   kill -9 $(lsof -ti:8080)

   # Restart agent
   ```

2. **Module errors:**
   ```bash
   # Clear node_modules
   rm -rf node_modules package-lock.json

   # Reinstall
   npm install

   # Restart agent
   ```

---

### **Common Issue #5: Supabase won't start**

**Symptoms:**
- `npx supabase start` hangs
- Containers crash immediately
- Port conflicts

**Fixes:**

1. **Clean restart:**
   ```bash
   npx supabase stop --no-backup
   npx supabase start
   ```

2. **Check Docker resources:**
   - Docker Desktop → Preferences → Resources
   - Ensure: 4GB+ RAM, 2+ CPUs

3. **Check port conflicts:**
   ```bash
   # Ports used by Supabase: 54321-54324, 54322
   lsof -i:54321
   lsof -i:54322
   lsof -i:54323
   ```

---

## 📚 Files Managed by Agent

### **Created/Modified:**
- `.env.local` - Frontend environment (points to local Supabase)
- `supabase/functions/.env` - Edge Functions API keys
- `backups/production_data_*.sql` - Production database dumps

### **Read Only:**
- `supabase/.env` - Source of truth for API keys
- `supabase/migrations/*.sql` - Database schema

### **Monitored:**
- `/tmp/vite-dev.log` - Vite dev server logs
- Docker containers - Supabase service health

---

## ⚙️ Tools Used

- **Bash:** Shell commands, scripts, Docker operations
- **Read:** Configuration file validation
- **Write:** Creating `.env.local` and Edge Functions env
- **TodoWrite:** Progress tracking (optional)

---

## 🎯 Success Criteria

Agent completes successfully when ALL of these are true:

- ✅ Docker containers running (6+ containers)
- ✅ Supabase status shows "running"
- ✅ Database has >0 users in `j_hub_users`
- ✅ `supabase/functions/.env` exists with API keys
- ✅ Edge Runtime container has API keys loaded
- ✅ `.env.local` points to `127.0.0.1:54321`
- ✅ No conflicting system environment variables
- ✅ Vite dev server running on port 8080
- ✅ Edge Functions responding to requests
- ✅ Dev password validated: `bruno@jumper.studio` / `senha123`
- ✅ Password hash verification passes in Step 11.5

---

## 🚨 Critical Warnings

1. **NEVER modify production directly** - Agent only READS from production (via pg_dump)

2. **Check console EVERY TIME** - Verify frontend shows "LOCAL" not "PRODUCTION"

3. **Backup rotation** - Old backups (>7 days) should be deleted to save disk space

4. **API keys security** - `supabase/functions/.env` is gitignored (contains secrets)

5. **System env vars** - If Step 4 shows conflicts, FIX before continuing (high risk!)

---

**Agent Version:** 2.1
**Last Updated:** 2025-10-31
**Maintained by:** Claude Code Assistant

**Changelog v2.1:**
- 🐛 Fixed password setup failing silently (moved to dedicated Step 8.5)
- ✅ Added password validation with clear error messages
- ✅ Added password hash verification in Step 11.5
- ✅ No more error suppression - all failures visible to user
- ✅ Step renumbering (9→9.5, 10→10.5, 11→11.5)
