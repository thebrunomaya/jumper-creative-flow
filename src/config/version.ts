/**
 * Jumper Hub Version
 *
 * Following semantic versioning: MAJOR.MINOR.PATCH
 *
 * PATCH (x.x.N): Auto-incremented by Claude on each commit
 * MINOR (x.N.0): User-signaled feature releases
 * MAJOR (N.0.0): User-signaled breaking changes
 */
export const APP_VERSION = 'v2.0.37';

/**
 * Version history:
 * - v2.0.37 (2024-10-21):
 *   - FIX: RLS recordings também bloqueava - adicionada public read
 *   - MIGRATION: 20251022030000 - Public read access para recordings
 *   - Policy: "Authenticated users can view all recordings" (qual = true)
 *   - Fix completo: extracts + recordings com acesso público de leitura
 *   - Debug logs temporários adicionados ao OptimizationCard
 *
 * - v2.0.36 (2024-10-21):
 *   - FIX: RLS policy bloqueava acesso a extracts de outros usuários
 *   - MIGRATION: 20251022024700 - Public read access para extracts
 *   - Policy: "Authenticated users can view all extracts" (qual = true)
 *   - Query: Corrigida sintaxe j_hub_optimization_extracts!recording_id
 *   - Tags RADAR agora aparecem corretamente no painel executivo
 *
 * - v2.0.35 (2024-10-21):
 *   - REDESIGN: OptimizationCard layout horizontal tipo tabela
 *   - Row 1: [Icon] Nome da conta - Gestor    Data Hora
 *   - Row 2:        Tags tags tags     Ver Extrato - Abrir
 *   - Data formatada: dd/MM/yyyy HH:mm (não mais relative time)
 *   - Layout mais compacto e organizado
 *
 * - v2.0.34 (2024-10-21):
 *   - FIX: Collapse inteligente - apenas step mais recente aberto por padrão
 *   - FIX: ExtractViewer agora renderiza formato RADAR corretamente
 *   - Auto-detecção de formato RADAR via box characters (┌─, │)
 *   - Preservação de formatação original em <pre> para RADAR
 *   - Backward compatibility com formato legacy (bullet list)
 *
 * - v2.0.33 (2024-10-21):
 *   - FEAT: Painel Executivo de Otimizações completo com Método RADAR
 *   - NEW: OptimizationCard component - Card-based layout com tags RADAR
 *   - NEW: RadarDrawer component - visualização rápida sem abrir editor completo
 *   - NEW: TagBadge/TagBadgeList - badges coloridos por categoria
 *   - REDESIGN: /optimization page - mostra TODAS otimizações (não apenas uma conta)
 *   - FEATURE: Filtro opcional por conta com opção "Todas as Contas"
 *   - FEATURE: Paginação com scroll infinito ("Carregar Mais")
 *   - UX: Layout elegante seguindo design de produção existente
 *   - Display: Panorama + Top 2 Actions com contador "+X" para restantes
 *   - Navigation: Quick view (drawer) vs Full editor (route)
 *
 * - v2.0.32 (2024-10-21):
 *   - CHORE: Removed debug console.log statements from OptimizationEditor
 *   - Production-ready code with clean logging
 *
 * - v2.0.31 (2024-10-21):
 *   - FIX: Editor modals now correctly save edited text to database
 *   - Root cause: Modals called onSave() without passing edited text parameter
 *   - Fixed TranscriptEditorModal and LogEditorModal to pass editedText
 *   - Parent functions now receive and use the new text parameter
 *   - DATABASE: Fixed ambiguous column references in save_transcript_edit RPC
 *   - Added DECLARE variables to eliminate PostgreSQL column/parameter ambiguity
 *   - Migrations: 20251021152046 (optimize RPC return data), 20251021153000 (fix ambiguous refs)
 *
 * - v2.0.30 (2024-10-21):
 *   - NEW: dev-setup agent for automated development environment setup
 *   - Agent reduces setup from ~10 manual steps to single invocation (~2 min)
 *   - Validates Docker + Supabase CLI, creates/reuses backups, restores data
 *   - FIX: Migration 20251020220000 now fully idempotent (IF EXISTS checks)
 *   - FIX: Backup script corrected region endpoint (us-east-1 → sa-east-1)
 *   - DOCS: Added .claude/agents/README.md with agent development guidelines
 *   - DOCS: Updated CLAUDE.md with "Claude Code Agents" section
 *
 * - v2.0.29 (2024-10-20):
 *   - PRODUCTION FIX: Resolved error 500 in Step 3 Extract generation
 *   - Applied 3 pending migrations: create optimization_extracts table + api_logs constraint
 *   - BREAKING: Complete naming standardization j_ads_users → j_hub_users
 *   - Renamed 5 constraints, 1 trigger, updated has_role() function
 *   - Regenerated TypeScript types (zero j_ads_users references)
 *   - DOCS: Added critical naming convention warnings to ARCHITECTURE.md + CLAUDE.md
 *   - Prevention: Documented incident report to prevent future table duplication
 *
 * - v2.0.28 (2024-10-20):
 *   - DEPLOY: j_hub_optimization_extract Edge Function deployed with Claude Sonnet 4.5
 *   - Model upgrade: claude-3-5-sonnet-20241022 → claude-sonnet-4-5-20250929
 *   - All optimization steps now use Sonnet 4.5 (transcribe, process, extract)
 *   - Improved extraction quality with newer model version
 *
 * - v2.0.27 (2024-10-20):
 *   - CODE: Updated Step 3 Extract to use Claude Sonnet 4.5 (not deployed yet)
 *   - Changed model identifier in j_hub_optimization_extract/index.ts
 *
 * - v2.0.26 (2024-10-20):
 *   - NEW: Safe database reset script (db-reset-safe.sh)
 *   - Auto backup/restore workflow prevents data loss during resets
 *   - Updated all documentation (CLAUDE.md, DEV-TROUBLESHOOTING.md, QUICK-START.md)
 *   - Added package.json npm script: npm run db:reset
 *
 * - v2.0.25 (2024-10-20):
 *   - FIX: Debug modal for Step 3 (Extract) now working
 *   - Migration: Added 'extract' to j_hub_optimization_api_logs step constraint
 *   - Edge Function: Corrected API logging field names
 *   - DebugModal: Added label for 'extract' step
 *
 * - v2.0.24 (2024-10-20):
 *   - DOCS: Comprehensive local development setup documentation
 *   - NEW: DEV-TROUBLESHOOTING.md with solutions for common issues
 *   - NEW: QUICK-START.md for rapid onboarding
 *   - Updated CLAUDE.md with environment variable warnings
 *
 * - v2.0.23 (2024-10-20):
 *   - MAJOR CHANGE: Step 3 transformed from "Análise Estruturada" to "Extrato da Otimização"
 *   - NEW: AI now extracts concrete actions from log into categorized bullet list
 *   - 4 action categories: [VERBA], [CRIATIVOS], [CONJUNTOS], [COPY]
 *   - ExtractViewer component: displays actions with category icons and colors
 *   - ExtractEditorModal: manual editing, AI regeneration, undo support
 *   - Edge Function: j_hub_optimization_extract (Claude analyzes Step 2 log)
 *   - Database: j_hub_optimization_extracts table with versioning
 *   - Focused on WHAT was done (actions) vs WHY (analysis moved to Step 4 Oracle)
 *   - Cleaner interface: compact bullet format instead of verbose JSON
 *
 * - v2.0.22 (2024-10-20):
 *   - UX: All optimization steps now collapsible for cleaner interface
 *   - NEW: Click header to expand/collapse any step (except action buttons)
 *   - All steps start collapsed by default - user expands what they want to see
 *   - Smooth animations: 300ms transitions with slide-in effect
 *   - Chevron indicator shows expand/collapse state
 *   - Header hover effect for better discoverability
 *   - Oracle Framework (Step 4) remains always expanded (admin only)
 *   - Locked steps show lock message when user expands them
 *
 * - v2.0.21 (2024-10-20):
 *   - UX: Optimization steps inverted - most refined content at top (3→2→1)
 *   - NEW: Edit icons in card headers (minimalista) - removed body "Editar" buttons
 *   - NEW: Locked state indicators - Steps show lock icon when dependencies not met
 *   - Step 3 locked until Step 2 completed, Step 2 locked until Step 1 completed
 *   - ChevronUp arrows show refinement flow upward (Step 1 → Step 2 → Step 3)
 *   - Edit icons always visible but disabled when step incomplete
 *   - Cleaner, more focused interface with priority on final output
 *
 * - v2.0.20 (2024-10-20):
 *   - UX: Step 1 consolidated - single "Editar Transcrição" button
 *   - NEW: TranscriptViewer component - displays formatted text with paragraphs
 *   - NEW: TranscriptEditorModal component - edit with all actions in modal
 *   - ENHANCEMENT: Claude now adds punctuation and breaks into paragraphs automatically
 *   - Edge Function: Updated j_hub_optimization_transcribe prompt for formatting
 *   - Improved readability: formatted text view with natural paragraph breaks
 *   - "Ver Mudanças IA" moved inside modal
 *   - Consistent UX pattern with Step 2 (Log da Otimização)
 *
 * - v2.0.19 (2024-10-20):
 *   - FIX: LogViewer now preserves line breaks in Markdown
 *   - Added remark-breaks plugin to treat single line breaks as <br />
 *   - Fixes rendering issue where multi-line context was displayed as single line
 *   - Dependencies: +remark-breaks
 *
 * - v2.0.18 (2024-10-20):
 *   - UX: Step 2 renamed to "Log da Otimização" (was "Organização em Tópicos")
 *   - NEW: Created LogViewer component - renders Markdown as formatted HTML
 *   - NEW: Created LogEditorModal component - edit Log in Markdown format
 *   - Step 2 now shows rendered HTML view by default (emojis, formatting preserved)
 *   - Edit button opens modal with all actions (Save, AI Improve, Recreate, Undo)
 *   - Cleaner UX: Single "Editar Log" button in view mode
 *   - Dependencies: react-markdown + remark-gfm (already installed)
 *
 * - v2.0.17 (2024-10-20):
 *   - FIX: Debug Modal now correctly shows enhancement logs (Step 1 substep 2)
 *   - Removed conditional `if` that prevented enhancement logs from being saved
 *   - Added `enhance_transcription` to CHECK CONSTRAINT in j_hub_optimization_api_logs
 *   - Migration: 20251020104215_add_enhance_transcription_step.sql
 *   - LOCAL DEV: Added storage RLS policies for local development
 *   - Migration: 20251020102407_storage_rls_policies.sql
 *   - Users can now upload optimization audio files in local dev environment
 *   - Admin Debug Modal now shows both Whisper (substep 1) and Enhancement (substep 2) logs
 *
 * - v2.0.16 (2024-10-19):
 *   - UX: Improved enhancement UI - moved AI changes view to cleaner modal interface
 *   - Added robot icon (🤖) next to debug icon in Step 1 header
 *   - Removed "Ver mudanças da IA" and "Reverter para original" buttons from main list
 *   - Created dedicated EnhancementDiffModal with revert button inside
 *   - FIX: Enhancement debug logging now saves full prompt and token count (was placeholder before)
 *   - Cleaner, less cluttered interface for reviewing AI transcription enhancements
 *
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
