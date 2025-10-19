/**
 * Jumper Hub Version
 *
 * Following semantic versioning: MAJOR.MINOR.PATCH
 *
 * PATCH (x.x.N): Auto-incremented by Claude on each commit
 * MINOR (x.N.0): User-signaled feature releases
 * MAJOR (N.0.0): User-signaled breaking changes
 */
export const APP_VERSION = 'v2.0.15';

/**
 * Version history:
 * - v2.0.15 (2024-10-19):
 *   - FIX: Enhanced Claude prompt to correct common PT-BR phonetic errors in transcriptions
 *   - Added explicit corrections: "edge"→"ad", "roaz"→"ROAS", "cê-pê-cê"→"CPC", etc.
 *   - FEATURE: DebugModal now shows BOTH Whisper and Enhancement logs for Step 1
 *   - Admin can now inspect what Claude changed during automatic post-processing
 *   - Improved transcription quality for paid traffic terminology
 *
 * - v2.0.14 (2024-10-17):
 *   - ENHANCEMENT: Step 2 prompt now includes temporal context intelligence
 *   - Added CRITICAL section for date/time resolution (Priority 1: extract from audio, Priority 2: use system timestamp)
 *   - AI now converts relative periods ("yesterday", "last 7 days") to absolute dates (DD/MM/YYYY)
 *   - Mandatory output format includes "CONTEXTO DA OTIMIZAÇÃO" section
 *   - All analysis sections specify exact periods (complete/partial) with "Análise realizada em" timestamp
 *   - Recording timestamp passed to AI in Brazil Time (UTC-3) format
 *   - Eliminates ambiguous temporal references in optimization reports
 *
 * - v2.0.13 (2024-10-17):
 *   - REVERT: Removed expandable UI from v2.0.11 (unnecessary after v2.0.12 fix)
 *   - Textareas now have fixed larger sizes: Input (8), Prompt (20), Output (15)
 *   - Simpler UX - no expand/collapse buttons needed
 *   - Data truncation was fixed in v2.0.12, so larger fixed sizes work well
 *
 * - v2.0.12 (2024-10-17):
 *   - FIX: Increased debug log preview limits from 500 to 5000 characters
 *   - Edge Functions: j_hub_optimization_transcribe, process, analyze, improve_transcript, improve_processed
 *   - Fixes actual data truncation issue (not just visual)
 *   - Admin debug modal now shows complete output for troubleshooting
 *   - User reported: "Output realmente está pela metade" - now fixed!
 *
 * - v2.0.11 (2024-10-17): [REVERTED in v2.0.13]
 *   - UX: Added expandable textareas in DebugModal (Optimization Editor)
 *   - This was unnecessary complexity after discovering real issue was data truncation
 *
 * - v2.0.10 (2024-10-15):
 *   - FIX: Optimization RLS policies now allow admins to view ALL recordings
 *   - Added policies: "Admins can view/update all transcripts" and "Admins can view/update all context"
 *   - Fixed issue where admin users couldn't access optimizations created by other users
 *   - Migration: 20251015000000_fix_optimization_rls_for_admins.sql
 *
 * - v2.0.9 (2024-10-15):
 *   - FIX: start-dev.sh now runs Vite in background (prevents timeout/zombie process)
 *   - Script completes successfully on first run (no more "second try" needed)
 *   - Logs saved to /tmp/vite-dev.log for debugging
 *   - Clear success message with URL and log locations
 *
 * - v2.0.8 (2024-10-15):
 *   - DEV SETUP: Added Edge Functions to start-dev.sh script (auto-start)
 *   - DOCS: Updated DEV-SETUP.md with Edge Functions requirement (critical step)
 *   - DOCS: Updated CLAUDE.md workflow to include Edge Functions
 *   - FIX: Prevents "Edge Function returned a non-2xx status code" error
 *   - Now script automatically serves functions locally on port 54321
 *
 * - v2.0.7 (2024-10-14):
 *   - PRODUCTION FIX: Resolved login issues caused by corrupted Vercel env vars
 *   - Root cause: Vercel environment variables had invalid API key format
 *   - Solution: Removed Vercel env vars, app now uses hardcoded fallback values
 *   - Removed diagnostic logs from v2.0.6 (no longer needed)
 *   - Login with email and Notion OAuth both working in production ✅
 *
 * - v2.0.6 (2024-10-14):
 *   - DIAGNOSTIC: Added detailed Supabase config logging
 *   - Shows URL, key source, and whether using local or production
 *   - Helps diagnose environment variable issues in production
 *
 * - v2.0.5 (2024-10-14):
 *   - CRITICAL FIX: Fixed .env configuration for local vs production
 *   - .env now contains PRODUCTION credentials (used by Vercel)
 *   - .env.local contains LOCAL credentials (gitignored, dev only)
 *   - No more switching env vars between local/production!
 *
 * - v2.0.4 (2024-10-14):
 *   - CRITICAL FIX: Corrected environment variable name mismatch
 *   - Code was looking for VITE_SUPABASE_PUBLISHABLE_KEY
 *   - Vercel has VITE_SUPABASE_ANON_KEY
 *   - Now checks both + correct production fallback
 *
 * - v2.0.3 (2024-10-14):
 *   - Fixed production login issues (email + Notion OAuth)
 *   - Improved userExists() with RLS-safe fallback strategy
 *   - Added OAuth hash cleanup to prevent redirect loops
 *   - Enhanced error handling in ensureUserRole()
 *   - Added detailed production logging
 *
 * - v2.0.2 (2024-10-14):
 *   - Fixed CLAUDE.md deployment documentation (clarified Vercel auto-deploy vs Supabase manual)
 *
 * - v2.0.1 (2024-10-14):
 *   - Centralized version management
 *
 * - v2.0.0 (2024-10-14):
 *   - Composite authorization system
 *   - Role auto-detection (@jumper.studio)
 *   - Local dev environment safety
 *   - Environment variable precedence fix
 *
 * - v1.0.0 (2024-09-XX): Initial release
 *   - Creative submission system
 *   - 9 specialized dashboards
 *   - Notion integration
 *   - Resilient architecture
 */
