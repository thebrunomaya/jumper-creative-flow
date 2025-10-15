#!/bin/bash
# Quick Start - Development Environment with Production Data
# Usage: ./scripts/start-dev.sh

set -e

echo "🚀 Jumper Hub - Development Environment Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo "📦 Step 1/7: Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running${NC}"
  echo "   Please start Docker Desktop and try again"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Start Supabase Local
echo "🐳 Step 2/7: Starting Supabase Local..."
if npx supabase status > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Supabase already running${NC}"
else
  echo "   Starting containers (this may take 30-60 seconds)..."
  npx supabase start
  echo -e "${GREEN}✅ Supabase started${NC}"
fi
echo ""

# Step 3: Check if database has data
echo "📊 Step 3/7: Checking local database..."
USER_COUNT=$(docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -t -c "SELECT COUNT(*) FROM j_hub_users WHERE email NOT LIKE '%exemplo.com%';" 2>/dev/null | xargs)

if [ "$USER_COUNT" -eq "0" ] || [ -z "$USER_COUNT" ]; then
  echo -e "${YELLOW}⚠️  No production data found (or only dummy data)${NC}"
  echo ""
  echo "   Do you want to import production data? (yes/no)"
  read -p "   → " IMPORT_DATA

  if [[ $IMPORT_DATA =~ ^[Yy][Ee][Ss]$ ]]; then
    echo ""
    echo "   Looking for recent backups..."

    # Find most recent backup
    LATEST_BACKUP=$(ls -t backups/production_data_*.sql 2>/dev/null | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
      echo -e "${YELLOW}   No backup found. Creating new backup...${NC}"
      BACKUP_FILE="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"
      npx supabase db dump --linked --data-only --use-copy --file="${BACKUP_FILE}"
      echo -e "${GREEN}   ✅ Backup created: ${BACKUP_FILE}${NC}"
      LATEST_BACKUP="${BACKUP_FILE}"
    else
      echo -e "${GREEN}   ✅ Using backup: ${LATEST_BACKUP}${NC}"
    fi

    echo ""
    echo "   Importing data..."
    echo "yes" | ./scripts/restore-to-local.sh "${LATEST_BACKUP}" > /dev/null 2>&1
    echo -e "${GREEN}✅ Production data imported${NC}"
  else
    echo -e "${YELLOW}⚠️  Skipping data import (using local data)${NC}"
  fi
else
  echo -e "${GREEN}✅ Database has ${USER_COUNT} real users${NC}"
fi
echo ""

# Step 4: Install dependencies
echo "📦 Step 4/7: Checking NPM dependencies..."
if [ ! -d "node_modules" ]; then
  echo "   Installing dependencies..."
  npm install > /dev/null 2>&1
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 5: Check environment variables
echo "🔧 Step 5/7: Checking environment variables..."
if [ -f ".env.local" ]; then
  if grep -q "127.0.0.1:54321" .env.local; then
    echo -e "${GREEN}✅ .env.local configured for LOCAL${NC}"
    USE_ENV_LOCAL=true
  else
    echo -e "${YELLOW}⚠️  .env.local exists but not configured for LOCAL${NC}"
    USE_ENV_LOCAL=false
  fi
else
  echo -e "${YELLOW}⚠️  No .env.local found${NC}"
  echo "   Creating .env.local for LOCAL development..."
  cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
  echo -e "${GREEN}✅ .env.local created${NC}"
  USE_ENV_LOCAL=true
fi
echo ""

# Step 6: Start Edge Functions
echo "⚡ Step 6/7: Starting Edge Functions locally..."
if pgrep -f "supabase functions serve" > /dev/null; then
  echo -e "${GREEN}✅ Edge Functions already running${NC}"
else
  echo "   Starting Edge Functions server..."
  npx supabase functions serve > /tmp/supabase-functions.log 2>&1 &
  FUNCTIONS_PID=$!
  sleep 3

  if kill -0 $FUNCTIONS_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Edge Functions started (PID: ${FUNCTIONS_PID})${NC}"
  else
    echo -e "${RED}❌ Failed to start Edge Functions${NC}"
    echo "   Check logs: tail -f /tmp/supabase-functions.log"
    exit 1
  fi
fi
echo ""

# Step 7: Show summary and next steps
echo "🎯 Step 7/7: Ready to start!"
echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Environment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🐳 Supabase Local:  http://127.0.0.1:54321"
echo "   🗄️  Database:        postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "   🎨 Studio:          http://127.0.0.1:54323"
echo "   📧 Mailpit:         http://127.0.0.1:54324"
echo "   ⚡ Edge Functions:  http://127.0.0.1:54321/functions/v1/"
echo "   👥 Real Users:      ${USER_COUNT:-Unknown}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Development Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start dev server in background
echo "   Starting Vite development server..."
if [ "$USE_ENV_LOCAL" = true ]; then
  npm run dev > /tmp/vite-dev.log 2>&1 &
else
  # Use inline env vars as fallback
  VITE_SUPABASE_URL=http://127.0.0.1:54321 \
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
  npm run dev > /tmp/vite-dev.log 2>&1 &
fi

VITE_PID=$!
sleep 3

# Check if Vite started successfully
if kill -0 $VITE_PID 2>/dev/null; then
  echo -e "${GREEN}✅ Vite dev server started (PID: ${VITE_PID})${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 Development Environment Ready!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "   🌐 Open: http://localhost:8080"
  echo ""
  echo "   📝 View logs:"
  echo "      Edge Functions: tail -f /tmp/supabase-functions.log"
  echo "      Vite:          tail -f /tmp/vite-dev.log"
  echo ""
else
  echo -e "${RED}❌ Failed to start Vite dev server${NC}"
  echo "   Check logs: tail -f /tmp/vite-dev.log"
  exit 1
fi
