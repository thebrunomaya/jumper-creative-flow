# Development Environment Setup Agent

**Purpose:** Automated setup of complete local development environment with production data.

## What This Agent Does

Sets up a fully functional local development environment by:

1. **Validating Prerequisites**
   - Docker is running
   - Supabase CLI is authenticated
   - Required directories exist

2. **Starting Supabase Local**
   - Launches Docker containers
   - Initializes local database
   - Applies all migrations

3. **Syncing Production Data**
   - Creates fresh backup from production (or reuses recent <24h)
   - Resets local database to clean state
   - Restores production data
   - Sets development password (senha123)

4. **Configuring Environment**
   - Validates `.env.local` for frontend
   - Verifies Edge Functions environment variables
   - Ensures API keys are loaded in Edge Runtime

5. **Starting Development Server**
   - Launches `npm run dev`
   - Reports server URL
   - Provides login credentials

## Expected Outcome

After running this agent, you will have:
- ✅ Supabase local running at `http://127.0.0.1:54321`
- ✅ Database with fresh production data
- ✅ Edge Functions with API keys configured
- ✅ Frontend dev server at `http://localhost:8080`
- ✅ Development credentials: `bruno@jumper.studio` / `senha123`

## Usage Context

Use this agent when:
- Starting a new development session
- Switching between computers
- Need fresh production data locally
- After pulling new migrations from git
- Onboarding new developers

## Validation Steps

The agent will verify:
1. Docker daemon is accessible
2. Supabase CLI can authenticate with production
3. Database migrations apply successfully
4. Production backup completes without errors
5. Data restore populates tables correctly
6. Edge Runtime has required API keys
7. Frontend connects to local Supabase (not production)
8. Development server starts and is accessible

## Error Handling

If any step fails, the agent will:
- Report the specific error clearly
- Suggest actionable fix (e.g., "Run: npx supabase login")
- Stop execution to prevent cascading failures
- Preserve existing data when possible

## Tools Available

- **Bash:** Execute shell commands (Docker, Supabase CLI, npm)
- **Read:** Verify configuration files
- **Write/Edit:** Create or fix `.env.local` if needed
- **TodoWrite:** Track progress through setup steps

## Key Commands

```bash
# Check Docker
docker ps

# Authenticate Supabase
npx supabase login

# Start Supabase
npx supabase start

# Create production backup
npx supabase db dump --linked --data-only --use-copy --file="./backups/production_TIMESTAMP.sql"

# Reset database safely
./scripts/db-reset-safe.sh --no-restore

# Restore production data
echo "yes" | ./scripts/restore-to-local.sh <backup-file>

# Verify Edge Runtime env
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep API_KEY

# Start dev server
npm run dev
```

## Important Notes

- **Never skip backup validation** - Ensure backup succeeded before restore
- **Check for recent backups** - Reuse if <24h old to save time
- **Verify environment isolation** - Frontend must connect to LOCAL, not production
- **Validate Edge Functions** - API keys must be loaded in Docker container
- **Report completion summary** - Show URLs, credentials, next steps

## Success Criteria

The agent completes successfully when:
- All 6 setup tasks are marked complete in todo list
- Supabase status shows "running"
- Database has >0 rows in key tables (j_hub_users, j_hub_notion_db_accounts)
- Edge Runtime environment includes OPENAI_API_KEY and ANTHROPIC_API_KEY
- npm dev server is running and accessible
- No errors reported in any step

## Files to Monitor

- `.env.local` - Frontend environment (must point to localhost)
- `supabase/functions/.env` - Edge Functions API keys
- `backups/production_*.sql` - Database dumps
- `supabase/migrations/*.sql` - Schema definitions

## Common Issues & Solutions

**Issue:** "Connection to production failed"
**Solution:** Run `npx supabase login` to re-authenticate

**Issue:** "Docker not running"
**Solution:** Start Docker Desktop application

**Issue:** "Edge Functions missing API keys"
**Solution:** Copy `supabase/.env` to `supabase/functions/.env` and restart Supabase

**Issue:** "Frontend connects to PRODUCTION"
**Solution:** Check for system env vars with `env | grep VITE` and remove from shell config

**Issue:** "Database restore shows duplicate key errors"
**Solution:** Run `./scripts/db-reset-safe.sh --no-restore` first to clean database

## Post-Setup Actions

After agent completes:
1. Open browser to `http://localhost:8080`
2. Login with `bruno@jumper.studio` / `senha123`
3. Verify data loads correctly (accounts, managers, dashboards)
4. Check Supabase Studio at `http://127.0.0.1:54323`
5. Test Edge Functions if working on optimization/sync features

---

**Agent Type:** Development workflow automation
**Estimated Duration:** 2-3 minutes
**Safe to Run:** Yes (only affects local environment)
**Production Impact:** None (read-only backup from production)
