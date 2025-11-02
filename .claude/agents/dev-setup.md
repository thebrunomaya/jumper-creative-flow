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

# Prerequisites - UPDATED

Before running this agent, ensure the following are in place:

## 1. Environment Files

### `.env.local` (Frontend configuration)
**Location:** Project root
**Purpose:** Tells frontend to connect to LOCAL Supabase (not production)

**Required content:**
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Create it:**
```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
```

### `supabase/functions/.env` (Edge Functions API keys)
**Location:** `supabase/functions/.env`
**Purpose:** API keys for OpenAI and Anthropic used by Edge Functions

**Required content:**
```bash
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Where to get keys:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys
- Supabase Service Role: Dashboard → Settings → API → service_role key

**Create it:**
```bash
cat > supabase/functions/.env << 'EOF'
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EOF
```

## 2. Production Database Password

**NEW REQUIREMENT:** Set production database password as environment variable BEFORE running agent.

**Why needed:** Step 5 creates backup of production database using pg_dump, which requires authentication.

**How to set:**
```bash
export PROD_DB_PASSWORD='your-production-db-password'
```

**Where to get password:**
Supabase Dashboard → Settings → Database → Database Password

**IMPORTANT:**
- Do NOT hardcode this password in any files
- Do NOT commit this password to Git
- Set it in your terminal session before running agent
- Agent will validate and stop if not set

**Recommended: Add to your shell profile**
If you run this agent frequently, add to `~/.zshrc` or `~/.bashrc`:
```bash
# Supabase Production DB Password (for local dev agent)
export PROD_DB_PASSWORD='your-password-here'
```

Then reload: `source ~/.zshrc`

## 3. Supabase CLI Authentication

**Verify:**
```bash
npx supabase projects list
```

**Should show:**
```
LINKED | ORG ID | REFERENCE ID         | NAME | REGION
  ●    | ...    | biwwowendjuzvpttyrlb | J-1  | South America (São Paulo)
```

**If not authenticated:**
```bash
npx supabase login
npx supabase link --project-ref biwwowendjuzvpttyrlb
```

## 4. Docker Desktop

**Verify:**
```bash
docker ps
```

Should return without errors (empty list is fine).

**If fails:**
- Open Docker Desktop application
- Wait for Docker to fully start
- Try again

## 5. PostgreSQL Tools (pg_dump/pg_restore)

**NEW REQUIREMENT:** pg_dump must be installed for Step 5 (production backup).

**Verify:**
```bash
pg_dump --version
```

**Should show:**
```
pg_dump (PostgreSQL) 15.x
```

**If not installed:**
```bash
brew install libpq
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Why needed:**
The Supabase CLI's `db dump` command doesn't reliably capture data. Using pg_dump directly ensures complete backups with actual data (6MB vs 73KB schema-only dumps).

## Quick Pre-Flight Check

Run all checks at once:
```bash
echo "1. Frontend env file:"
test -f .env.local && grep -q "127.0.0.1:54321" .env.local && echo "✅ .env.local configured for LOCAL" || echo "❌ Missing or incorrect"

echo ""
echo "2. Edge Functions env file:"
test -f supabase/functions/.env && grep -q "OPENAI_API_KEY" supabase/functions/.env && echo "✅ supabase/functions/.env exists with keys" || echo "❌ Missing or incomplete"

echo ""
echo "3. Production DB password:"
test -n "$PROD_DB_PASSWORD" && echo "✅ PROD_DB_PASSWORD is set" || echo "❌ PROD_DB_PASSWORD not set (run: export PROD_DB_PASSWORD='...')"

echo ""
echo "4. Supabase CLI auth:"
npx supabase projects list 2>&1 | grep -q "biwwowendjuzvpttyrlb" && echo "✅ Authenticated and linked" || echo "❌ Not authenticated or not linked"

echo ""
echo "5. Docker:"
docker ps > /dev/null 2>&1 && echo "✅ Docker running" || echo "❌ Docker not running"

echo ""
echo "6. pg_dump:"
which pg_dump > /dev/null && echo "✅ pg_dump installed" || echo "❌ pg_dump not installed (run: brew install libpq)"
```

## Summary - What Changed

**Previous version required:**
- `.env.local` (agent created it automatically)
- `supabase/functions/.env` (agent created it automatically)
- Supabase CLI auth
- Docker

**New version requires:**
- `.env.local` (user creates manually)
- `supabase/functions/.env` (user creates manually)
- **PROD_DB_PASSWORD environment variable** (NEW)
- Supabase CLI auth
- Docker
- **pg_dump/pg_restore installed** (NEW)

**Why the change:**
- Security: No automatic file creation prevents accidental credential exposure
- Reliability: pg_dump guarantees complete backups with data (Supabase CLI was unreliable)
- Explicitness: User has full control over credentials and knows exactly what's configured

**Time investment:**
- First-time setup: 5-10 minutes to create files and set environment variables
- Subsequent runs: 0 minutes (everything already configured)
- Agent execution: 5-7 minutes (down from 22 minutes with improved backup method)

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

### **Step 3: Edge Functions Environment Validation** ⭐ **CRITICAL**

**What:** Validate that `supabase/functions/.env` exists with required API keys.

**Why:** Edge Functions run in Docker container and need API keys (OpenAI, Anthropic) to work. Without this file, optimization features fail with "API_KEY not configured" errors.

**Execute:**

```bash
echo "🔍 Step 3: Edge Functions Environment Validation"
echo ""

# Check if file exists
if [ ! -f "supabase/functions/.env" ]; then
  echo "❌ Missing: supabase/functions/.env"
  echo ""
  echo "This file contains API keys for Edge Functions."
  echo ""
  echo "📝 To create it:"
  echo ""
  echo "1. Create the file:"
  echo "   touch supabase/functions/.env"
  echo ""
  echo "2. Add your API keys:"
  echo "   nano supabase/functions/.env"
  echo ""
  echo "3. Required content:"
  echo ""
  echo "   OPENAI_API_KEY=sk-proj-..."
  echo "   ANTHROPIC_API_KEY=sk-ant-api03-..."
  echo "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci..."
  echo ""
  echo "📍 Where to get these keys:"
  echo ""
  echo "   OpenAI:     https://platform.openai.com/api-keys"
  echo "   Anthropic:  https://console.anthropic.com/settings/keys"
  echo "   Supabase:   Dashboard → Settings → API → service_role key"
  echo ""
  echo "⚠️  This file is gitignored (will not be committed)"
  echo ""
  exit 1
fi

echo "✅ supabase/functions/.env exists"
echo ""

# Validate required keys
MISSING_KEYS=()

if ! grep -q "^OPENAI_API_KEY=" supabase/functions/.env; then
  MISSING_KEYS+=("OPENAI_API_KEY")
fi

if ! grep -q "^ANTHROPIC_API_KEY=" supabase/functions/.env; then
  MISSING_KEYS+=("ANTHROPIC_API_KEY")
fi

if ! grep -q "^SUPABASE_SERVICE_ROLE_KEY=" supabase/functions/.env; then
  MISSING_KEYS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
  echo "❌ Missing required keys in supabase/functions/.env:"
  echo ""
  for key in "${MISSING_KEYS[@]}"; do
    echo "   • $key"
  done
  echo ""
  echo "📝 Add these keys to supabase/functions/.env:"
  echo ""
  echo "   nano supabase/functions/.env"
  echo ""
  echo "📍 Where to get missing keys:"
  echo ""
  
  for key in "${MISSING_KEYS[@]}"; do
    case $key in
      OPENAI_API_KEY)
        echo "   OpenAI:     https://platform.openai.com/api-keys"
        echo "   Format:     OPENAI_API_KEY=sk-proj-..."
        ;;
      ANTHROPIC_API_KEY)
        echo "   Anthropic:  https://console.anthropic.com/settings/keys"
        echo "   Format:     ANTHROPIC_API_KEY=sk-ant-api03-..."
        ;;
      SUPABASE_SERVICE_ROLE_KEY)
        echo "   Supabase:   Dashboard → Settings → API"
        echo "   Format:     SUPABASE_SERVICE_ROLE_KEY=eyJhbGci..."
        ;;
    esac
    echo ""
  done
  
  exit 1
fi

echo "✅ All required API keys present:"
cat supabase/functions/.env | grep -E "^(OPENAI|ANTHROPIC|SUPABASE).*_KEY=" | sed 's/=.*/=***REDACTED***/'

echo ""
```

**Expected output (success):**
```
🔍 Step 3: Edge Functions Environment Validation

✅ supabase/functions/.env exists

✅ All required API keys present:
OPENAI_API_KEY=***REDACTED***
ANTHROPIC_API_KEY=***REDACTED***
SUPABASE_SERVICE_ROLE_KEY=***REDACTED***
```

**Expected output (file missing):**
```
🔍 Step 3: Edge Functions Environment Validation

❌ Missing: supabase/functions/.env

This file contains API keys for Edge Functions.

📝 To create it:

1. Create the file:
   touch supabase/functions/.env

2. Add your API keys:
   nano supabase/functions/.env

3. Required content:

   OPENAI_API_KEY=sk-proj-...
   ANTHROPIC_API_KEY=sk-ant-api03-...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

📍 Where to get these keys:

   OpenAI:     https://platform.openai.com/api-keys
   Anthropic:  https://console.anthropic.com/settings/keys
   Supabase:   Dashboard → Settings → API → service_role key

⚠️  This file is gitignored (will not be committed)
```

**Expected output (keys missing):**
```
🔍 Step 3: Edge Functions Environment Validation

✅ supabase/functions/.env exists

❌ Missing required keys in supabase/functions/.env:

   • OPENAI_API_KEY
   • ANTHROPIC_API_KEY

📝 Add these keys to supabase/functions/.env:

   nano supabase/functions/.env

📍 Where to get missing keys:

   OpenAI:     https://platform.openai.com/api-keys
   Format:     OPENAI_API_KEY=sk-proj-...

   Anthropic:  https://console.anthropic.com/settings/keys
   Format:     ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Agent action:** 
- If file missing → STOP, show instructions
- If keys missing → STOP, show which keys and where to get them
- If all valid → Continue to next step

**Note:** This step does NOT create the file automatically. The user must manually create and populate it with their API keys. This ensures keys stay secure and are never in Git history or terminal history.

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

**What:** Create fresh backup from production using pg_dump (more reliable than Supabase CLI).

**Why:** We need production data to test locally with realistic scenarios. The smart reuse feature saves time by avoiding redundant downloads when you already have fresh data.

**Prerequisites:** `PROD_DB_PASSWORD` environment variable must be set before running agent.

**Interactive decision:** The agent will ask if you want to create a new backup or skip this step if you already have data locally.

**Execute:**

```bash
echo "📦 Step 5: Production Backup Management"
echo ""

# Check if local database already has real data
echo "Checking local database for existing data..."
USER_COUNT=$(docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -t -c "SELECT COUNT(*) FROM auth.users WHERE email NOT LIKE '%@example.com%';" 2>/dev/null | xargs || echo "0")

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
  # Validate PROD_DB_PASSWORD is set
  if [ -z "$PROD_DB_PASSWORD" ]; then
    echo "❌ PROD_DB_PASSWORD not set"
    echo ""
    echo "This environment variable is required to connect to production database."
    echo ""
    echo "📝 To set it:"
    echo ""
    echo "   export PROD_DB_PASSWORD='your-production-password'"
    echo ""
    echo "📍 Where to get the password:"
    echo ""
    echo "   Supabase Dashboard → Settings → Database → Database Password"
    echo ""
    echo "⚠️  Do NOT hardcode this password in the agent or commit it to Git."
    echo ""
    exit 1
  fi

  # Look for recent backups
  echo "Looking for recent backups..."
  BACKUP_DIR="./backups"
  mkdir -p "$BACKUP_DIR"

  LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_data_*.dump" -mtime -1 2>/dev/null | sort -r | head -1)

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
    BACKUP_FILE="${BACKUP_DIR}/production_data_$(date +%Y%m%d_%H%M%S).dump"

    echo "   Using pg_dump (authenticated via PROD_DB_PASSWORD)"
    echo "   Output: ${BACKUP_FILE}"
    echo ""

    # Use pg_dump with custom format (more reliable than Supabase CLI)
    if PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
      "postgresql://postgres.biwwowendjuzvpttyrlb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
      --format=custom \
      --no-owner \
      --file="${BACKUP_FILE}" 2>&1; then

      BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
      echo ""
      echo "✅ Backup created successfully!"
      echo "   File: ${BACKUP_FILE}"
      echo "   Size: ${BACKUP_SIZE}"
      
      # Validate backup has data (should be > 1MB)
      BACKUP_SIZE_BYTES=$(stat -f %z "${BACKUP_FILE}" 2>/dev/null || stat -c %s "${BACKUP_FILE}" 2>/dev/null)
      if [ "$BACKUP_SIZE_BYTES" -lt 1000000 ]; then
        echo ""
        echo "⚠️  Warning: Backup file is suspiciously small (< 1MB)"
        echo "   This may indicate the backup contains only schema, not data."
        echo "   Production database might be empty or connection had issues."
        echo ""
      fi
      
      LATEST_BACKUP="${BACKUP_FILE}"
    else
      echo ""
      echo "❌ Backup creation failed!"
      echo ""
      echo "This usually happens due to:"
      echo ""
      echo "1. Incorrect password:"
      echo "   Verify password in Dashboard → Settings → Database"
      echo "   Re-export: export PROD_DB_PASSWORD='correct-password'"
      echo ""
      echo "2. Network connectivity issues:"
      echo "   Check your internet connection"
      echo "   Verify firewall allows connections to aws-0-sa-east-1.pooler.supabase.com:5432"
      echo ""
      echo "3. pg_dump not installed:"
      echo "   Install: brew install libpq"
      echo "   Add to PATH: export PATH=\"/opt/homebrew/opt/libpq/bin:\$PATH\""
      echo ""
      echo "After fixing, restart this agent."
      echo ""
      exit 1
    fi
  fi

  # Export for use in restore step
  export BACKUP_TO_RESTORE="$LATEST_BACKUP"
fi

echo ""
```

**Expected output (using existing data):**
```
📦 Step 5: Production Backup Management

Checking local database for existing data...
✅ Local database has 9 real users

Do you want to refresh with latest production data? (yes/no): no
⏭️  Skipping backup (using existing local data)
```

**Expected output (using recent backup):**
```
📦 Step 5: Production Backup Management

Checking local database for existing data...
✅ Local database has 0 real users

Looking for recent backups...
✅ Found backup: production_data_20251101_133922.dump
   Age: 3 hours old
   Using recent backup (less than 24h)
```

**Expected output (creating new backup):**
```
📦 Step 5: Production Backup Management

Checking local database for existing data...
✅ Local database has 0 real users

Looking for recent backups...

📥 Creating fresh production backup...
   Using pg_dump (authenticated via PROD_DB_PASSWORD)
   Output: ./backups/production_data_20251101_133922.dump

✅ Backup created successfully!
   File: ./backups/production_data_20251101_133922.dump
   Size: 6.0M
```

**Expected output (failure - password not set):**
```
📦 Step 5: Production Backup Management

Checking local database for existing data...
✅ Local database has 0 real users

Looking for recent backups...

❌ PROD_DB_PASSWORD not set

This environment variable is required to connect to production database.

📝 To set it:

   export PROD_DB_PASSWORD='your-production-password'

📍 Where to get the password:

   Supabase Dashboard → Settings → Database → Database Password

⚠️  Do NOT hardcode this password in the agent or commit it to Git.
```

**Key improvements:**

1. **No hardcoded credentials** - Requires PROD_DB_PASSWORD env var
2. **Uses pg_dump instead of Supabase CLI** - More reliable, actually captures data (6MB vs 73KB)
3. **Custom format (.dump)** - Better for pg_restore, handles large databases efficiently
4. **Validates backup size** - Warns if backup suspiciously small
5. **Better error messages** - Specific troubleshooting steps for common failures

**Why pg_dump is better:**

The Supabase CLI `db dump --linked` command has issues:
- Often captures only schema, missing actual data
- Depends on pg_dump being in PATH but doesn't validate it
- Less control over dump format and options
- Version-specific bugs (e.g., v2.54.11 doesn't capture data properly)

Using pg_dump directly:
- Guarantees data capture with `--format=custom`
- More reliable across different environments
- Standard PostgreSQL tool with consistent behavior
- Better error messages and debugging

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

MISSING_KEYS=()

if ! docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env 2>/dev/null | grep -q "^OPENAI_API_KEY="; then
  MISSING_KEYS+=("OPENAI_API_KEY")
fi

if ! docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env 2>/dev/null | grep -q "^ANTHROPIC_API_KEY="; then
  MISSING_KEYS+=("ANTHROPIC_API_KEY")
fi

if ! docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env 2>/dev/null | grep -q "^SUPABASE_SERVICE_ROLE_KEY="; then
  MISSING_KEYS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
  echo "❌ Edge Runtime container missing required keys:"
  echo ""
  for key in "${MISSING_KEYS[@]}"; do
    echo "   • $key"
  done
  echo ""
  echo "This means the keys in supabase/functions/.env were not loaded into the container."
  echo ""
  echo "🔧 To fix:"
  echo ""
  echo "1. Stop Supabase:"
  echo "   npx supabase stop"
  echo ""
  echo "2. Verify supabase/functions/.env has correct format:"
  echo "   cat supabase/functions/.env"
  echo ""
  echo "   Should look like:"
  echo "   OPENAI_API_KEY=sk-proj-..."
  echo "   ANTHROPIC_API_KEY=sk-ant-api03-..."
  echo "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci..."
  echo ""
  echo "   ⚠️  No spaces around '=' sign"
  echo "   ⚠️  No quotes around values"
  echo "   ⚠️  No empty lines between keys"
  echo ""
  echo "3. Restart this agent"
  echo ""
  exit 1
fi

echo "✅ Edge Runtime has OPENAI_API_KEY"
echo "✅ Edge Runtime has ANTHROPIC_API_KEY"
echo "✅ Edge Runtime has SUPABASE_SERVICE_ROLE_KEY"

echo ""
```

**Expected output (success):**
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
✅ Edge Runtime has SUPABASE_SERVICE_ROLE_KEY
```

**Expected output (failure):**
```
🐳 Step 6: Starting Supabase Local

✅ Supabase already running

Current status:
[status output...]

Validating Edge Functions environment...
❌ Edge Runtime container missing required keys:

   • OPENAI_API_KEY
   • ANTHROPIC_API_KEY

This means the keys in supabase/functions/.env were not loaded into the container.

🔧 To fix:

1. Stop Supabase:
   npx supabase stop

2. Verify supabase/functions/.env has correct format:
   cat supabase/functions/.env

   Should look like:
   OPENAI_API_KEY=sk-proj-...
   ANTHROPIC_API_KEY=sk-ant-api03-...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

   ⚠️  No spaces around '=' sign
   ⚠️  No quotes around values
   ⚠️  No empty lines between keys

3. Restart this agent
```

**Key improvements:**

1. **Stops execution** if keys are missing (consistent with Opção A)
2. **Checks all three required keys** systematically
3. **Provides actionable fix steps** that address the root cause
4. **Includes format validation tips** to prevent common mistakes
5. **Clear exit code** (exit 1) so automation tools can detect failure

**Why keys might be missing:**

- File created AFTER Supabase was already started
- File has formatting issues (spaces, quotes, etc.)
- File permissions prevent CLI from reading it
- Supabase CLI didn't detect the file during startup

**The fix workflow:**

Stop Supabase → Verify file format → Restart agent (which restarts Supabase with correct env vars loaded)

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

**What:** Import production data into local database using pg_restore.

**Why:** Local database has correct schema from migrations (Step 7), now we populate it with production data for realistic testing.

**Critical:** Uses `--data-only` to avoid overwriting local auth schema permissions. Uses `--disable-triggers` to handle circular foreign key constraints.

**Execute:**

```bash
echo "📥 Step 8: Restoring Production Data"
echo ""

# Check if we have a backup to restore
if [ -z "$BACKUP_TO_RESTORE" ] && [ -z "$SKIP_BACKUP" ]; then
  # Find most recent backup
  BACKUP_TO_RESTORE=$(find ./backups -name "production_data_*.dump" -type f 2>/dev/null | sort -r | head -1)
fi

if [ -n "$BACKUP_TO_RESTORE" ]; then
  echo "Using backup: $(basename "$BACKUP_TO_RESTORE")"
  BACKUP_SIZE=$(du -h "$BACKUP_TO_RESTORE" | cut -f1)
  echo "Backup size: ${BACKUP_SIZE}"
  echo ""

  echo "Starting restore (this may take 1-3 minutes)..."
  echo ""

  # Restore data only (schema already correct from Step 7 reset)
  # --data-only: Only restore data, not schema (prevents permission issues)
  # --disable-triggers: Allows data insertion despite circular FK constraints
  # --no-owner: Don't try to restore ownership (we're not superuser)
  if pg_restore \
    --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    --data-only \
    --disable-triggers \
    --no-owner \
    "$BACKUP_TO_RESTORE" 2>&1 | tee /tmp/restore.log; then

    echo ""
    echo "✅ Data restoration completed"
    echo ""

    # Verify data was imported
    USER_COUNT=$(docker run --rm --network host postgres:15 \
      psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
      -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")

    ACCOUNT_COUNT=$(docker run --rm --network host postgres:15 \
      psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
      -t -c "SELECT COUNT(*) FROM j_hub_notion_db_accounts;" 2>/dev/null | xargs || echo "0")

    if [ "$USER_COUNT" != "0" ]; then
      echo "✅ Imported $USER_COUNT users"
      echo "✅ Imported $ACCOUNT_COUNT accounts"
    else
      echo "⚠️  Warning: No users found after restore"
      echo "   The backup file may have been empty or restore may have failed partially"
      echo "   Check logs: cat /tmp/restore.log"
    fi

  else
    echo ""
    echo "❌ Data restoration failed"
    echo ""
    echo "Common issues:"
    echo ""
    echo "1. Backup file corrupted:"
    echo "   Re-run Step 5 to create fresh backup"
    echo ""
    echo "2. Permission errors (should not happen with --data-only):"
    echo "   This indicates schema mismatch between local and production"
    echo "   Run: supabase db reset"
    echo "   Then re-run this agent"
    echo ""
    echo "3. Foreign key constraint violations:"
    echo "   The --disable-triggers flag should handle this"
    echo "   If still failing, check /tmp/restore.log for details"
    echo ""
    echo "Detailed logs: cat /tmp/restore.log"
    echo ""
    exit 1
  fi

elif [ "$SKIP_BACKUP" = "true" ]; then
  echo "⏭️  Skipping restore (using existing data from previous setup)"

else
  echo "⚠️  No backup file found"
  echo ""
  echo "Step 5 should have created a backup, but none exists."
  echo ""
  echo "Options:"
  echo "1. Re-run the agent (it will create backup in Step 5)"
  echo "2. Manually create backup:"
  echo "   export PROD_DB_PASSWORD='your-password'"
  echo "   mkdir -p backups"
  echo "   PGPASSWORD=\"\$PROD_DB_PASSWORD\" pg_dump \\"
  echo "     \"postgresql://postgres.biwwowendjuzvpttyrlb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres\" \\"
  echo "     --format=custom --no-owner --file=backups/production_manual.dump"
  echo ""
  exit 1
fi

echo ""
```

**Expected output (success):**
```
📥 Step 8: Restoring Production Data

Using backup: production_data_20251101_133922.dump
Backup size: 6.0M

Starting restore (this may take 1-3 minutes)...

✅ Data restoration completed

✅ Imported 9 users
✅ Imported 48 accounts
```

**Expected output (using existing data):**
```
📥 Step 8: Restoring Production Data

⏭️  Skipping restore (using existing data from previous setup)
```

**Expected output (no backup found):**
```
📥 Step 8: Restoring Production Data

⚠️  No backup file found

Step 5 should have created a backup, but none exists.

Options:
1. Re-run the agent (it will create backup in Step 5)
2. Manually create backup:
   export PROD_DB_PASSWORD='your-password'
   mkdir -p backups
   PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
     "postgresql://postgres.biwwowendjuzvpttyrlb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
     --format=custom --no-owner --file=backups/production_manual.dump
```

**Why these flags matter:**

**`--data-only`:**
- Critical for avoiding the "permission denied for table users" error you encountered
- Local Supabase has correct auth schema with proper permissions from migrations
- Production dump includes schema that would overwrite these permissions
- By using --data-only, we keep local schema intact and only import the data

**`--disable-triggers`:**
- Handles circular foreign key constraints (e.g., tables that reference each other)
- Without this, restore would fail with FK constraint violations
- Safe in local environment - triggers will work normally after restore completes
- Production backups warned about this: "You might not be able to restore the dump without using --disable-triggers"

**Why this is better than full restore:**

The original approach (`pg_restore --clean --if-exists`) had issues:
- Overwrote local auth schema, breaking permissions
- Caused "permission denied" errors on login
- Required superuser privileges that local setup doesn't have

New approach separates concerns:
- Step 7 (db reset): Applies migrations → correct schema with correct permissions
- Step 8 (data restore): Populates tables → production data without touching schema

This matches PostgreSQL best practices: schema from migrations (version controlled), data from backups (environment-specific).

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

### **Step 9: Frontend Environment Validation**

**What:** Validate that `.env.local` exists and is configured for LOCAL development.

**Why:** Without this, frontend connects to production (dangerous!).

**Execute:**

```bash
echo "🔧 Step 9: Frontend Environment Validation"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ Missing: .env.local"
  echo ""
  echo "This file tells the frontend where to connect."
  echo ""
  echo "📝 To create it:"
  echo ""
  echo "1. Create the file:"
  echo "   touch .env.local"
  echo ""
  echo "2. Add local Supabase configuration:"
  echo "   nano .env.local"
  echo ""
  echo "3. Required content:"
  echo ""
  echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
  echo "   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
  echo ""
  echo "⚠️  This file is gitignored (will not be committed)"
  echo ""
  exit 1
fi

echo "✅ .env.local exists"
echo ""

# Validate it points to LOCAL, not PRODUCTION
if grep -q "127.0.0.1:54321" .env.local; then
  echo "✅ .env.local configured for LOCAL"
elif grep -q "supabase.co" .env.local; then
  echo "❌ .env.local is pointing to PRODUCTION!"
  echo ""
  echo "Current configuration:"
  grep "VITE_SUPABASE_URL" .env.local
  echo ""
  echo "This is DANGEROUS - changes will affect production data."
  echo ""
  echo "🔧 To fix:"
  echo ""
  echo "1. Edit .env.local:"
  echo "   nano .env.local"
  echo ""
  echo "2. Change to local configuration:"
  echo ""
  echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
  echo "   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
  echo ""
  exit 1
else
  echo "⚠️  .env.local exists but configuration unclear"
  echo ""
  echo "Current content:"
  cat .env.local | grep "VITE_SUPABASE"
  echo ""
  echo "For local development, it should be:"
  echo ""
  echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
  echo "   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
  echo ""
  read -p "Continue anyway? (yes/no): " CONTINUE
  if [[ ! $CONTINUE =~ ^[Yy][Ee][Ss]$ ]]; then
    exit 1
  fi
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

**Expected output (success):**
```
🔧 Step 9: Frontend Environment Validation

✅ .env.local exists

✅ .env.local configured for LOCAL

📦 Installing NPM dependencies...
✅ Dependencies installed
```

**Expected output (file missing):**
```
🔧 Step 9: Frontend Environment Validation

❌ Missing: .env.local

This file tells the frontend where to connect.

📝 To create it:

1. Create the file:
   touch .env.local

2. Add local Supabase configuration:
   nano .env.local

3. Required content:

   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

⚠️  This file is gitignored (will not be committed)
```

**Expected output (pointing to production - CRITICAL):**
```
🔧 Step 9: Frontend Environment Validation

✅ .env.local exists

❌ .env.local is pointing to PRODUCTION!

Current configuration:
VITE_SUPABASE_URL=https://biwwowendjuzvpttyrlb.supabase.co

This is DANGEROUS - changes will affect production data.

🔧 To fix:

1. Edit .env.local:
   nano .env.local

2. Change to local configuration:

   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

**Key improvements:**

1. **Validates, doesn't create** - Consistent with Opção A
2. **Checks if pointing to production** - Prevents dangerous mistakes
3. **Preserves other variables** - No risk of overwriting
4. **Actionable instructions** - User knows exactly what to do
5. **Safety first** - Stops if production URL detected

**Note:** The local Supabase anon key shown is the default demo key that Supabase Local always uses - it's safe to hardcode in instructions.

---

### **Step 10: Service Startup**

**What:** Start npm development server.

**Why:** Need Vite dev server running to access application.

**Execute:**

```bash
echo "🚀 Step 10: Starting Development Server"
echo ""

echo "Starting Vite development server..."

# Check if port 8080 is already in use
PORT_PID=$(lsof -ti:8080 2>/dev/null)

if [ -n "$PORT_PID" ]; then
  echo "⚠️  Port 8080 already in use by process $PORT_PID"
  echo "   Stopping existing process..."
  kill -9 $PORT_PID 2>/dev/null
  sleep 2
fi

# Start dev server in background
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

# Wait for server to start
echo "Waiting for server to initialize..."
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
  echo "Check logs for errors:"
  tail -20 /tmp/vite-dev.log
  echo ""
  echo "Common issues:"
  echo "  • Port conflict: Another service using port 8080"
  echo "  • Missing dependencies: Run 'npm install'"
  echo "  • Configuration errors: Check vite.config.ts"
  echo ""
  exit 1
fi

echo ""
```

**Expected output (success):**
```
🚀 Step 10: Starting Development Server

Starting Vite development server...
Waiting for server to initialize...
✅ Vite dev server started (PID: 12345)

   🌐 URL: http://localhost:8080
```

**Expected output (port conflict):**
```
🚀 Step 10: Starting Development Server

Starting Vite development server...
⚠️  Port 8080 already in use by process 67890
   Stopping existing process...
Waiting for server to initialize...
✅ Vite dev server started (PID: 12345)

   🌐 URL: http://localhost:8080
```

**Expected output (failure):**
```
🚀 Step 10: Starting Development Server

Starting Vite development server...
Waiting for server to initialize...
❌ Failed to start Vite dev server

Check logs for errors:
[error output from /tmp/vite-dev.log]

Common issues:
  • Port conflict: Another service using port 8080
  • Missing dependencies: Run 'npm install'
  • Configuration errors: Check vite.config.ts
```

**Key improvements:**

1. **Surgical process killing** - Only kills process on port 8080, not all vite processes
2. **Clear feedback** - Shows which PID was killed and why
3. **Better error handling** - Displays logs and common solutions if startup fails
4. **Graceful handling** - 2 second sleep after kill to ensure port is released

**Why this is better:**

Using `lsof -ti:8080` targets only the process using port 8080, preventing accidental termination of unrelated processes (e.g., another project's vite server on different port, or vite processes in other terminals).

---

### **Step 11: Comprehensive Validation** ⭐ **FINAL CHECK**

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
if lsof -ti:8080 > /dev/null 2>&1; then
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
🔍 Step 11: Comprehensive Validation

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

📍 Access Points:
   🌐 Frontend:       http://localhost:8080
   🗄️  Database:       postgresql://postgres:postgres@127.0.0.1:54322/postgres
   🎨 Supabase Studio: http://127.0.0.1:54323
   📧 Mailpit (emails): http://127.0.0.1:54324
   ⚡ Edge Functions:  http://127.0.0.1:54321/functions/v1/

🔑 Development Credentials:
   Email:    bruno@jumper.studio
   Password: senha123

🎯 Next Steps:
   1. Open http://localhost:8080 in browser
   2. Open DevTools Console (F12) and verify:
      → Should show: 🔗 Supabase: LOCAL (http://127.0.0.1:54321)
      → If shows PRODUCTION, STOP and check system env vars
   3. Login with credentials above
   4. Verify data loads correctly

📝 View Logs:
   Vite:           tail -f /tmp/vite-dev.log
   Edge Functions: docker logs -f supabase_edge_runtime_biwwowendjuzvpttyrlb
   Database:       docker logs -f supabase_db_biwwowendjuzvpttyrlb
```

**Note:** Step 11 only reports status - it does not stop execution. All critical validations that should block progress have already been done in Steps 1-10.

**Reference updated:** Changed "check Step 8.5 output" to reflect original numbering in agent.

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

### **Error: "Missing: supabase/functions/.env" (Step 3)**

**Problem:** API keys file for Edge Functions doesn't exist.

**Solution:**
```bash
# 1. Create the file
touch supabase/functions/.env

# 2. Add required keys:
nano supabase/functions/.env

# Content:
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 3. Restart agent
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

### **Error: Backup creation failed (Step 5)**

**Problem:** Cannot connect to production database.

**Solutions:**

1. **Check password is set:**
```bash
   echo $PROD_DB_PASSWORD
```

2. **Verify password correct:**
   Dashboard → Settings → Database → Database Password

3. **Check pg_dump installed:**
```bash
   which pg_dump
```

4. **Test connection:**
```bash
   PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
     "postgresql://postgres.biwwowendjuzvpttyrlb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
     --version
```

5. **Network issues:**
   Verify firewall allows port 5432 to aws-0-sa-east-1.pooler.supabase.com

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

### **Common Issue #2: Agent stops at Step 3 or Step 6**

**Symptoms:**
- Step 3: "Missing: supabase/functions/.env"
- Step 6: "Edge Runtime container missing required keys"

**Root cause:** API keys not properly configured

**Fix:** 
Step 3 failure = File doesn't exist or missing keys. Create/edit `supabase/functions/.env`
Step 6 failure = File exists but wasn't loaded. Stop Supabase (`npx supabase stop`), verify file format (no spaces around `=`, no quotes), restart agent.

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

### **Validated (must exist before running agent):**
- `.env.local` - Frontend environment (must point to local Supabase)
- `supabase/functions/.env` - Edge Functions API keys

### **Created:**
- `backups/production_data_*.sql` - Production database dumps

### **Read Only:**
- `supabase/migrations/*.sql` - Database schema
- `supabase/config.toml` - Supabase configuration

### **Monitored:**
- `/tmp/vite-dev.log` - Vite dev server logs
- Docker containers - Supabase service health

---

## ⚙️ Tools Used

- **Bash:** Shell commands, scripts, Docker operations
- **Read:** Configuration file validation
- **TodoWrite:** Progress tracking (optional)

---

## 🎯 Success Criteria

Agent completes successfully when ALL of these are true:

**Prerequisites (must exist BEFORE running agent):**
- ✅ `supabase/functions/.env` exists with API keys
- ✅ `.env.local` exists and points to LOCAL (127.0.0.1:54321)
- ✅ Supabase CLI authenticated (`npx supabase projects list` works)
- ✅ Project linked (`npx supabase link` completed)

**Runtime checks (validated during execution):**
- ✅ Docker containers running (6+ containers)
- ✅ Supabase status shows "running"
- ✅ Database has >0 users in `j_hub_users`
- ✅ Edge Runtime container has API keys loaded
- ✅ No conflicting system environment variables
- ✅ Vite dev server running on port 8080
- ✅ Edge Functions responding to requests
- ✅ Dev password validated: `bruno@jumper.studio` / `senha123`
- ✅ Password hash verification passes in Step 11

---

## 🚨 Critical Warnings

1. **NEVER modify production directly** - Agent only READS from production (via pg_dump)

2. **Check console EVERY TIME** - Verify frontend shows "LOCAL" not "PRODUCTION"

3. **Backup rotation** - Old backups (>7 days) should be deleted to save disk space

4. **API keys security** - `supabase/functions/.env` is gitignored (contains secrets)

5. **System env vars** - If Step 4 shows conflicts, FIX before continuing (high risk!)

6. **Prerequisites required** - Agent validates but doesn't create `supabase/functions/.env` or `.env.local`. These files must exist with correct configuration before running agent. This design prevents accidental credential exposure and gives user full control over secrets management.

---

**Agent Version:** 3.0
**Last Updated:** 2025-11-01
**Maintained by:** Claude Code Assistant

**Changelog v3.0 (Security & Consistency Update):**
- 🔒 Security: Removed hardcoded production credentials from Step 5
- 🔒 Security: Agent now validates files instead of creating them (Steps 3, 9)
- 🛡️ Safety: Step 6 stops execution if API keys missing from container
- 🔧 Improvement: Step 5 uses `--linked` flag (cleaner, more secure)
- 🔢 Renumbering: Steps 9.5→9, 10.5→10, 11.5→11
- 📝 Philosophy: "Validate and instruct" instead of "create automatically"
- ⚡ Process: Surgical port killing in Step 10 (only kills :8080, not all vite)

**Changelog v2.1:**
- 🐛 Fixed password setup failing silently (moved to dedicated Step 8.5)
- ✅ Added password validation with clear error messages
- ✅ Added password hash verification in Step 11

---

## Resumo das Mudanças Filosóficas

O agente mudou de uma abordagem **"helpful automation"** (cria arquivos automaticamente) para **"safe validation"** (valida e instrui o usuário).

**Razão:** Prevenir exposição acidental de credenciais e dar ao usuário controle total sobre secrets management.

**Impacto:**
- Usuário deve preparar `supabase/functions/.env` e `.env.local` ANTES de rodar agente
- Agente para imediatamente se algo estiver faltando ou incorreto
- Instruções claras e acionáveis em cada erro
- Nenhuma credencial é criada, copiada ou manipulada automaticamente pelo script