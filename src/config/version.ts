/**
 * Jumper Hub Version
 *
 * Following semantic versioning: MAJOR.MINOR.PATCH
 *
 * PATCH (x.x.N): Auto-incremented by Claude on each commit
 * MINOR (x.N.0): User-signaled feature releases
 * MAJOR (N.0.0): User-signaled breaking changes
 */
export const APP_VERSION = 'v2.1.0';

/**
 * Version history:
 * - v2.1.0 (2024-11-05):
 *   - MAJOR RELEASE: Documentation Cleanup and Consolidation
 *   - Cleaned CLAUDE.md: 1579 → 1288 lines (-291 lines, -18%)
 *   - Fixed script paths (./scripts/ → ./localdev/)
 *   - Removed duplicate sections (Vercel env vars, roadmap, Local Dev)
 *   - Moved Optimization v2.1 technical docs to ARCHITECTURE.md
 *   - Updated all stale metadata (dates, project status)
 *   - ARCHITECTURE.md: Added complete Optimization v2.1 section (+126 lines)
 *   - Improved documentation navigation and clarity
 *   - All critical information preserved and better organized
 *
 * - v2.0.75 (2024-11-05):
 *   - FIX: FK constraint violation on optimization creation (critical bug)
 *   - OptimizationNew.tsx now stores notion_id (TEXT) instead of UUID in account_id
 *   - Fixed handleAccountChange to use account.notion_id
 *   - Fixed handleRecoverDraft to find accounts by notion_id
 *   - Fixed OptimizationRecorder.tsx typo: selectedAccountName → accountName
 *   - Root cause: Dual ID system (UUID for modern tables, TEXT notion_id for legacy)
 *   - Optimization creation now working correctly after commit 412a8ec changes
 *
 * - v2.0.74 (2024-11-03):
 *   - FIX: Upload script authentication issue resolved
 *   - Changed from `npx supabase` to `supabase` (global installation)
 *   - Root cause: npx and global supabase have separate auth sessions
 *   - User was authenticated with global CLI but script used npx
 *   - Script now uses global supabase command directly
 *
 * - v2.0.73 (2024-11-03):
 *   - TOOLS: Created upload script for deck templates with correct Content-Type
 *   - Script: scripts/upload-deck-assets.sh (uses Supabase CLI)
 *   - ROOT CAUSE IDENTIFIED: Storage serving templates as text/plain instead of text/html
 *   - Templates were being served without charset=utf-8, causing mojibake in Edge Function
 *   - Script uploads with explicit Content-Type: "text/html; charset=utf-8"
 *   - Two-phase approach: test (1 file) → all (33 templates + 2 design systems)
 *   - Includes Content-Type validation via curl after upload
 *   - User must delete existing files from bucket before running
 *   - This is the FINAL piece to solve mojibake issue completely
 *
 * - v2.0.72 (2024-11-03):
 *   - FIX: Comprehensive UTF-8 encoding fix across ENTIRE pipeline (mojibake fully resolved)
 *   - CRITICAL: Added TextDecoder('utf-8') to ALL fetch operations in Edge Function
 *   - Request body: Explicit UTF-8 decoding before JSON.parse (line 30-33)
 *   - Template loading: arrayBuffer() + TextDecoder for forced UTF-8 (line 95-108)
 *   - Design system: arrayBuffer() + TextDecoder for forced UTF-8 (line 123-135)
 *   - Claude API: Added Accept/Content-Type charset headers + TextDecoder response (line 254-277)
 *   - Storage upload: UTF-8 Blob with charset (from v2.0.71)
 *   - Response headers: All include charset=utf-8 (from v2.0.71)
 *   - Fixes Portuguese characters (Relatório, Otimização, etc.)
 *   - Fixes all special symbols (→, ✅, emojis like 🇧🇷)
 *   - Root cause: Templates/API responses not explicitly decoded as UTF-8
 *   - Test 1 confirmed: Simple markdown also had mojibake (eliminated user input as cause)
 *   - Edge Function j_hub_deck_generate deployed with comprehensive fixes
 *
 * - v2.0.71 (2024-11-03):
 *   - FIX: UTF-8 encoding issue in deck generation (partial fix - Storage upload only)
 *   - CRITICAL: Added explicit UTF-8 encoding via TextEncoder in Edge Function
 *   - Changed Blob creation to use encoded bytes with charset declaration
 *   - Updated Storage upload Content-Type: 'text/html; charset=utf-8'
 *   - Updated all response headers with 'charset=utf-8'
 *   - Updated Claude prompt to require <meta charset="UTF-8"> as first tag
 *   - Fixes Portuguese characters displaying incorrectly (Relatório → RelatÃ³rio)
 *   - Fixes broken emoji encoding (🇨🇴 → ðŸ‡¨ðŸ‡´)
 *   - Root cause: UTF-8 bytes misinterpreted as ISO-8859-1/Latin-1
 *   - Edge Function j_hub_deck_generate deployed with fixes
 *   - NOTE: This fix was incomplete - v2.0.72 added decoding to all fetch operations
 *
 * - v2.0.70 (2024-11-03):
 *   - FEATURE: Decks system FULLY INTEGRATED into web application (ALL 5 phases complete!)
 *   - PHASE 1 (Backend - Edge Functions):
 *     - j_hub_deck_generate: Claude Sonnet 4.5 AI generation from markdown + templates
 *     - j_hub_deck_create_share: Public sharing with optional password protection (bcrypt)
 *     - j_hub_deck_view_shared: Password-protected viewing for shared decks
 *   - PHASE 2 (Frontend - Components):
 *     - useMyDecks hook: Fetch decks with RLS filtering (follows optimization pattern)
 *     - useDeckGeneration hook: Deck generation workflow with progress tracking
 *     - DeckCard: Card view with badges, metadata, and actions
 *     - DecksPanelList: List/grid view with filters (type, identity, search, sort)
 *     - DeckConfigForm: Complete form with tabs, validation, file upload, preview
 *     - DeckShareModal: Share dialog with password protection and copy link
 *   - PHASE 3 (Frontend - Pages):
 *     - Decks.tsx: Main panel view with role-based permissions
 *     - DeckNew.tsx: Creation page with form and progress tracking
 *     - DeckEditor.tsx: Viewer with iframe, actions (share, download, delete)
 *     - SharedDeck.tsx: Public view with password modal (no auth required)
 *   - PHASE 4 (Integration):
 *     - Added 4 routes to App.tsx (decks, decks/new, decks/:id, decks/share/:slug)
 *     - Added "Decks" navigation link to Header.tsx with Presentation icon
 *   - PHASE 5 (Security & Testing):
 *     - CRITICAL FIX: Type inconsistency (migration: 'mediaplan', code: 'plan')
 *     - CRITICAL FIX: RLS policies - Staff now see decks from managed accounts
 *     - CRITICAL FIX: RLS policies - Admins now have full access
 *     - Migration: 20241103000000_fix_decks_rls_and_types.sql
 *   - PERMISSIONS:
 *     - View: All users see decks from accessible accounts (via j_hub_user_accounts logic)
 *     - Create: Only Admin and Staff can create decks
 *     - Edit: Staff can edit decks from managed accounts, Clients only own decks
 *     - Delete: Only Admins can delete decks
 *   - Progress: 100% complete (16/16 tasks) - SYSTEM READY FOR USE!
 *
 * - v2.0.69 (2024-11-03):
 *   - FEATURE: Decks system integration - Phase 1 & 2 (Backend + Frontend Hooks)
 *   - Backend: 3 Edge Functions created (j_hub_deck_generate, j_hub_deck_create_share, j_hub_deck_view_shared)
 *   - Frontend: 2 React Hooks created (useMyDecks, useDeckGeneration)
 *   - Database: j_hub_decks table with RLS policies already existed (created in earlier migration)
 *   - Storage: decks bucket with RLS policies already configured
 *   - Deck generation via Claude API (Anthropic) with template + design system loading
 *   - Public sharing with optional password protection (bcrypt)
 *   - Follows optimization system patterns (permissions, sharing, storage)
 *   - DOCS: Marked scripts/export-presentation-to-pdf.js as deprecated/non-functional
 *   - DOCS: Added Known Limitations section to decks/decks-readme.md (PDF export workaround)
 *   - Progress: 37.5% complete (6/16 tasks) - Components, Pages, Routes pending
 *
 * - v2.0.68 (2024-10-30):
 *   - FEATURE: Local audio download to prevent data loss
 *   - Added "Baixar Localmente" button in recording and upload tabs
 *   - Auto-download audio when upload fails (network error, storage error)
 *   - User can save 10-minute recording even without internet
 *   - Downloaded file: otimizacao-{account}-{timestamp}.webm
 *   - Toast explains user can upload later using "Enviar Arquivo" tab
 *   - Prevents total data loss in case of network failure
 *
 * - v2.0.67 (2024-10-30):
 *   - FIX: Resilient transcription error handling for OpenAI API failures
 *   - Edge Function: Added HTML response detection (Cloudflare 502/503 errors)
 *   - Edge Function: Implemented exponential backoff retry (3 attempts: 2s, 4s, 8s)
 *   - Edge Function: Classifies errors as TRANSIENT vs PERMANENT
 *   - Frontend: Preserves recording on transient errors (can retry later)
 *   - Frontend: Only deletes recording on permanent errors (invalid file, auth failure)
 *   - User-friendly toast: "OpenAI API está temporariamente indisponível. A gravação foi salva..."
 *   - Fixes data loss issue when OpenAI API returns 502 during high load
 *   - Audio file remains in storage even when transcription fails
 *
 * - v2.0.66 (2024-10-28):
 *   - FEATURE: "Geral" objective now always appears as first option
 *   - All accounts now have "Geral" + Notion-specific objectives
 *   - Ensures all optimizations can be categorized as general if needed
 *
 * - v2.0.65 (2024-10-28):
 *   - FIX: Account objectives now display in OptimizationRecorder
 *   - Added accountObjectives state to store objectives from selected account
 *   - Objectives now passed as notionObjectives prop to OptimizationRecorder
 *   - Fixed draft auto-save to store actual objectives (was storing empty array)
 *   - Fixed draft recovery to restore objectives
 *   - Objectives checkboxes now appear pre-selected from Notion account data
 *
 * - v2.0.64 (2024-10-28):
 *   - FIX: Restored account context and objectives loading in OptimizationNew
 *   - Edge Function j_hub_user_accounts now returns contexto_otimizacao and contexto_transcricao fields
 *   - Updated NotionAccount interface with context fields
 *   - Fixed OptimizationNew to use correct field name (contexto_otimizacao instead of non-existent contexto)
 *   - DOCS: Updated all references from obsolete j_ads_notion_db_* to current j_hub_notion_db_* naming
 *   - Updated CLAUDE.md, ARCHITECTURE.md, and REPORTS-ROADMAP.md with correct table names
 *   - Corrects naming convention from Jumper Hub rebrand (October 2025)
 *
 * - v2.0.63 (2024-10-28):
 *   - FIX: PrioritizedAccountSelect dropdown direction finally resolved
 *   - Added avoidCollisions={false} to disable Radix UI collision detection
 *   - Root cause: Collision detection was overriding side="bottom" prop
 *   - Dropdown now consistently opens downward on all pages
 *   - Verified fix with Playwright MCP testing on OptimizationNew page
 *
 * - v2.0.62 (2024-10-28):
 *   - FIX: PrioritizedAccountSelect dropdown now always opens downward
 *   - Added side="bottom" to SelectContent to prevent upward opening
 *   - Resolves issue where dropdown appeared above trigger on OptimizationNew page
 *
 * - v2.0.61 (2024-10-28):
 *   - MAJOR FEATURE: Prioritized account selection across entire application
 *   - Created accountPriority.ts utils with shared logic (getAccessReasons, sortAccountsByPriority, groupAccountsByPriority)
 *   - Created PrioritizedAccountSelect component with visual separators (GESTOR → SUPERVISOR → GERENTE → ADMIN)
 *   - Refactored MyAccounts to use shared utils (maintains existing behavior)
 *   - Applied to OptimizationNew with "Show Inactive" toggle (admin only)
 *   - Applied to Optimization with "All accounts" option and priority sorting
 *   - Dropdown separators show: "--- GESTOR (3) ---" with emoji icons
 *   - "Mostrar Inativas" toggle appears only for admin users
 *   - All account selectors now use consistent permission-based ordering
 *   - Updated NotionAccount interface to include gestor_email and atendimento_email
 *
 * - v2.0.60 (2024-10-28):
 *   - DOCS: Comprehensive documentation for account selection standardization
 *   - Added JSDoc to useMyNotionAccounts hook with architecture pattern explanation
 *   - Created NotionAccount TypeScript interface for type safety
 *   - Added "Account Selection Pattern" section to ARCHITECTURE.md
 *   - Documented backend (Edge Function) and frontend (React Hook) responsibilities
 *   - Included usage examples, custom sorting patterns, and migration history
 *   - Updated ARCHITECTURE.md table of contents
 *   - Part of account selection standardization (FASE 3 - Documentation)
 *
 * - v2.0.59 (2024-10-28):
 *   - CLEANUP: Removed unused AccountSelector.tsx component from optimization folder
 *   - Component was never imported or used anywhere in the application
 *   - Reduced codebase complexity as part of account selection standardization (FASE 3)
 *   - All pages now use standardized useMyNotionAccounts hook pattern
 *
 * - v2.0.58 (2024-10-28):
 *   - UX: Enhanced account selector with loading and empty states on OptimizationNew
 *   - Select component now shows "Carregando contas..." placeholder while fetching
 *   - Disabled state prevents interaction during account loading
 *   - Loading indicator with Loader2 spinner in dropdown
 *   - Empty state message when no accounts available
 *   - Conditional rendering for better user feedback during fetch operations
 *   - Part of account selection standardization (FASE 2)
 *
 * - v2.0.57 (2024-10-28):
 *   - FIX: Account selector dropdown clipping issue on OptimizationNew page
 *   - Added max-h-[300px] to SelectContent for proper height constraint (~8-10 items visible)
 *   - Added position="popper" to prevent viewport clipping
 *   - Added sideOffset={5} for proper spacing between trigger and dropdown
 *   - Built-in scrollbar now appears when 43 accounts exceed visible area
 *   - Also applied same fix to Optimization.tsx account filter for consistency
 *   - Resolves issue where dropdown was cut off at bottom without scrolling
 *
 * - v2.0.56 (2024-10-28):
 *   - ENHANCEMENT: OptimizationNew date picker now auto-detects matching presets
 *   - AUDIT: Verified account filtering uses correct permission-based logic (same as /my-accounts)
 *   - DateRangePicker component now highlights correct preset when modal opens
 *   - Example: "Últimos 7 dias" preset selected when dates match that range
 *   - Improves UX by showing user which preset they're currently using
 *   - detectMatchingPreset() compares date strings to identify preset vs custom range
 *   - No changes needed to account filtering - already correct via useMyNotionAccounts hook
 *
 * - v2.0.55 (2024-10-28):
 *   - FIX: Corrected import in useDraftManager.ts (useAuth path)
 *   - Import error: "Failed to resolve import @/hooks/useAuth"
 *   - Root cause: useAuth is exported from AuthContext, not a separate hooks file
 *   - Fixed by changing import path: @/hooks/useAuth → @/contexts/AuthContext
 *   - All import errors resolved, feature ready to test
 *
 * - v2.0.54 (2024-10-28):
 *   - FIX: Corrected import in OptimizationNew.tsx (useMyAccounts → useMyNotionAccounts)
 *   - Import error: "Failed to resolve import @/hooks/useMyAccounts"
 *   - Root cause: Hook useMyAccounts doesn't exist in codebase
 *   - Fixed by using correct hook: useMyNotionAccounts
 *   - Feature now ready to test: /optimization/new page with date range, draft auto-save
 *
 * - v2.0.53 (2024-10-27):
 *   - UX: Implemented breadcrumb navigation pattern in OptimizationEditor header
 *   - Breadcrumb structure: "Otimizações > Edição de Otimização - Account Name"
 *   - Clickable "Otimizações" link navigates back to /optimization panel
 *   - ChevronRight separator for visual clarity
 *   - Removed standalone back button (navigation now integrated into breadcrumb)
 *   - Two-row layout: Breadcrumb+Actions (line 1), Timestamp (line 2)
 *   - Cleaner, more professional navigation following industry UX best practices
 *   - Better contextual awareness - user always sees where they are in hierarchy
 *
 * - v2.0.52 (2024-10-27):
 *   - UX ENHANCEMENT: Comprehensive OptimizationEditor UX improvements
 *   - Header: Added subtle shadow for visual separation, improved button hierarchy
 *   - Primary action (Exportar PDF) now uses solid button style with min-width
 *   - Destructive action (Excluir) clearly styled with red outline and warning tooltip
 *   - Date format: Smart relative time ("Gravado hoje às 19:14", "há 2 dias", etc.)
 *   - Card actions: Better spacing with border-left separator, improved hover states
 *   - Tooltips: Enhanced with detailed descriptions explaining functionality
 *   - Accessibility: Added aria-labels to all icon buttons for screen readers
 *   - Flow indicators: Added connecting lines and labels ("Refina em", "Organiza em")
 *   - Admin section: Visually distinct with amber-colored indicator
 *   - Button sizing: Increased from h-8 to h-9 for better touch targets
 *   - Hover effects: Orange/amber tints on action buttons for better feedback
 *
 * - v2.0.51 (2024-10-27):
 *   - UX FIX: Aligned header content with main Header component
 *   - Changed from `px-8` to responsive padding: `px-4 sm:px-6 lg:px-8`
 *   - Added `max-w-7xl mx-auto` container to match Header component
 *   - Page header now aligns with Jumper logo (left) and UserMenu (right)
 *   - Main content also uses same container for consistent alignment
 *   - Clean, professional visual alignment across entire page
 *
 * - v2.0.50 (2024-10-27):
 *   - UX FIX: Reverted to left-aligned header (app standard)
 *   - Two-row layout: Back button above, title + actions below
 *   - Row 1: Back button (standalone)
 *   - Row 2: Title + Date (left) | Action buttons (right)
 *   - Maintains app's left-alignment pattern
 *   - Clean separation between navigation and content
 *
 * - v2.0.49 (2024-10-27):
 *   - UX FIX: Centered header layout in Optimization Editor
 *   - Changed from 2-column to 3-column grid layout
 *   - Left: Back button | Center: Title + Date | Right: Action buttons
 *   - Title and date now horizontally centered
 *   - All elements vertically aligned with `items-center`
 *   - Clean, balanced header layout
 *
 * - v2.0.48 (2024-10-27):
 *   - UX FIX: Simple header alignment fix in Optimization Editor
 *   - Changed from `items-start` to `items-center` for vertical centering
 *   - Removed `mt-8` margin from action buttons
 *   - Buttons now align properly with text content
 *
 * - v2.0.47 (2024-10-27):
 *   - UX FIX: Improved icon alignment for multi-line action text
 *   - Reverted to `items-start` for top alignment with first line
 *   - Added `pt-1` padding to icon container for better baseline alignment
 *   - Icons now stay aligned with first line when text wraps to multiple lines
 *   - Example: Long observations with 2-3 lines now have icon aligned at top
 *
 * - v2.0.46 (2024-10-27):
 *   - UX FIX: Corrected icon alignment in Step 3 Extract viewer
 *   - Changed from `items-start` to `items-center` and removed `mt-0.5`
 *   - Icons now perfectly aligned with text baseline
 *   - BREAKING: Action verbs now display in UPPERCASE: [CRIOU], [OBSERVOU], etc.
 *   - Updated prompt to generate uppercase verbs for better visual hierarchy
 *   - Updated ExtractViewer parsing to handle uppercase verbs
 *   - Updated Edge Function parsing to normalize verbs to uppercase
 *   - All verb mappings (VERB_ICONS, VERB_COLORS) converted to uppercase keys
 *
 * - v2.0.45 (2024-10-27):
 *   - UX: Restored color-coded visual system for Step 3 Extract with RADAR methodology
 *   - Semantic colors by action type: Blue (creation), Purple (activation/pause), Red (deletion),
 *     Green (budget/settings), Orange (correction/testing), Amber (observation), Gray (external)
 *   - Updated prompt format: - [Verb]: Details (with brackets for parsing)
 *   - New icons per verb: Plus, Play, Pause, Trash2, Settings, TrendingUp, Beaker, Eye, MessageSquare, Clock, Send
 *   - Visual separator (border) between internal and external actions
 *   - ExtractViewer now parses dash-based format with [Verb] extraction
 *   - Maintains backward compatibility with action parsing in Edge Function
 *
 * - v2.0.44 (2024-10-27):
 *   - MAJOR CHANGE: Step 3 Extract prompt updated to RADAR methodology
 *   - New structure: Actions separated into INTERNAL (platform) vs EXTERNAL (third-party)
 *   - Internal actions: Pausou, Ativou, Criou, Excluiu, Ajustou, Realocou, Corrigiu, Escalou, Testou, Observou
 *   - External actions: Solicitou, Informou, Aguardando, Abriu, Enviou
 *   - Format changed from bullet points (•) to dashes (-) with verbs: [Verb]: [Details]
 *   - Blank line separator between internal and external actions
 *   - More structured and actionable output aligned with RADAR tracking method
 *   - Updated Edge Function: j_hub_optimization_extract
 *   - Updated parsing logic to handle new verb-based format
 *
 * - v2.0.43 (2024-10-27):
 *   - FEATURE: Added account filter to optimization panel (/optimization)
 *   - Select dropdown shows all accounts with optimizations
 *   - Clear button (X) to reset filter and show all
 *   - Counter updates to show filtered count vs total
 *   - Only displays filter when user has access to multiple accounts
 *   - Accounts sorted alphabetically for easy navigation
 *   - Uses memoization for optimal performance
 *
 * - v2.0.42 (2024-10-27):
 *   - UX: Intelligent step expansion on page load
 *   - Highest completed step automatically opens when entering editor
 *   - Priority: Step 3 > Step 2 > Step 1 (most refined content first)
 *   - Other steps remain collapsed for clean interface
 *   - User immediately sees the most important/complete content
 *   - Can still expand/collapse any step manually
 *
 * - v2.0.41 (2024-10-27):
 *   - FIX: PDF export now includes ALL 3 optimization steps
 *   - Added Step 1 (Transcrição Completa) section with full transcript
 *   - Added Step 2 (Log da Otimização) section with organized bullets
 *   - Added Step 3 (Extrato) section with categorized actions
 *   - PDF structure: Header → Transcrição → Log → Extrato
 *   - Button only enabled when Step 3 (Extrato) is completed
 *   - Updated toast message: "PDF completo gerado com sucesso!"
 *   - Fixed critical bug: extract parameter was missing from export function
 *
 * - v2.0.40 (2024-10-27):
 *   - FIX: Added missing spinner to ReprocessConfirmModal
 *   - Button now shows "Recriando..." with animated Loader2 icon
 *   - Completes loading state audit - all AI operations now have visual feedback
 *   - Consistent UX across all create/recreate operations
 *
 * - v2.0.39 (2024-10-27):
 *   - UX: Added loading states to all AI operation modals
 *   - ExtractEditorModal: Shows "Recriando com IA..." while regenerating
 *   - LogEditorModal: Shows "Recriando com IA..." while reprocessing
 *   - TranscriptEditorModal: Shows "Recriando com Whisper..." while retranscribing
 *   - Modals stay open during AI processing with disabled buttons and spinner
 *   - Prevents user confusion when AI takes 5-30 seconds to process
 *   - Modal closes automatically on success, stays open on error for retry
 *
 * - v2.0.38 (2024-10-27):
 *   - FEATURE: Added [OBSERVAÇÃO] as new action category in Step 3 extract
 *   - Edge Function prompt updated with OBSERVAÇÃO category and example
 *   - ExtractViewer now displays OBSERVAÇÃO with amber color and Info icon
 *   - Use case: Notes, alerts, or important context without concrete actions
 *   - Ordering priority: VERBA > CRIATIVOS > CONJUNTOS > COPY > OBSERVAÇÃO
 *
 * - v2.0.37 (2024-10-27):
 *   - FEATURE: Added delete optimization functionality in editor
 *   - Delete button placed in header alongside "Export PDF"
 *   - Confirmation dialog with warning about permanent deletion
 *   - Deletes audio file from storage and all database records (cascade)
 *   - Redirects to optimization list after successful deletion
 *   - Toast notifications for success/error feedback
 *
 * - v2.0.36 (2024-10-27):
 *   - FEATURE: Added "Copy" button to all optimization steps in editor
 *   - Button order: Edit → Copy → Debug (Admin)
 *   - Copies step content to clipboard with success toast
 *   - Step 1: Copies transcript text
 *   - Step 2: Copies processed log text
 *   - Step 3: Copies extract text
 *
 * - v2.0.35 (2024-10-27):
 *   - UX: Extracts now display with full formatting and colored tags in panel
 *   - Uses ExtractViewer component with icons and category colors (CONJUNTOS purple, CRIATIVOS blue, VERBA green)
 *   - FIX: Removed "0" bug appearing next to manager email (duration_seconds > 0 check)
 *   - Shows complete extract content without truncation (removed line-clamp-4)
 *
 * - v2.0.34 (2024-10-27):
 *   - FIX: Optimization panel extracts now display correctly
 *   - Root cause: Supabase left join returns object, not array
 *   - Changed from rec.j_hub_optimization_extracts?.[0]?.extract_text to rec.j_hub_optimization_extracts?.extract_text
 *   - All 9 extracts now showing inline in optimization cards
 *
 * - v2.0.33 (2024-10-27):
 *   - REDESIGN: Optimization page transformed into panel view with permissions
 *   - Shows all optimizations from user's accessible accounts (like /my-accounts)
 *   - Account names displayed in titles (e.g., "Boiler - 24/10/2025 às 08:39")
 *   - Extract preview shown inline when available
 *   - NEW: useMyOptimizations hook with permission logic via j_hub_user_accounts
 *   - NEW: OptimizationsPanelList component with clean, scannable layout
 *   - Fetches optimizations with j_hub_optimization_extracts join
 *   - 44 otimizações displayed with proper status indicators
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
