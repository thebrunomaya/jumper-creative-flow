# Architecture - Detalhes Técnicos

> Documentação técnica do Jumper Hub Platform
> **Atualizado:** 2026-01-11 | **Versão:** v2.1.102

---

## Índice

1. [Table Naming Convention](#️-critical-table-naming-convention)
2. [Dual ID System](#️-critical-dual-id-system-uuid-vs-text-notion_id)
3. [User Management System](#-user-management-system)
4. [Account Selection Pattern](#-account-selection-pattern)
5. [Estrutura de Pastas](#️-estrutura-de-pastas)
6. [Database Schema](#️-database-schema)
7. [Edge Functions](#-edge-functions)
8. [Autenticação e Permissões](#-autenticação-e-permissões)
9. [Integração Notion](#-integração-notion)
10. [Sistema de Resiliência](#️-sistema-de-resiliência)
11. [Supabase Integration](#-supabase-integration)
12. [Optimization System](#-optimization-system)
13. [Decks System](#-decks-system)
14. [Top Creatives System](#-top-creatives-system)
15. [Dashboards System](#-dashboards-system)

---

## ⚠️ CRITICAL: Table Naming Convention

> **ALWAYS use:** `j_hub_*` prefix
> **NEVER use:** `j_ads_*` for new tables (legacy only)

### Naming Standards

**Current Tables:**
- `j_hub_users` - User management (PRIMARY)
- `j_hub_notion_db_accounts` - Synced accounts from Notion
- `j_hub_notion_db_managers` - Synced managers from Notion
- `j_hub_optimization_*` - Optimization system tables
- `j_hub_decks` - Presentation decks

**Legacy Tables (still in use):**
- `j_ads_creative_submissions` - Creative submissions
- `j_ads_creative_files` - Creative file attachments
- `j_ads_creative_variations` - Creative text variations
- `j_ads_error_logs` - Error tracking

### Migration History

- **2024-10-09:** Migrated `j_ads_users` → `j_hub_users`
- **2024-10-20:** Standardized constraints and triggers
- **2024-11:** New tables use `j_hub_*` prefix

---

## ⚠️ CRITICAL: Dual ID System (UUID vs TEXT notion_id)

> The database uses a **dual ID system** for accounts. Understanding this prevents FK constraint violations.

### Overview

| ID Type | Format | Used By |
|---------|--------|---------|
| **UUID** | Supabase auto-generated | Modern tables (j_hub_decks) |
| **TEXT notion_id** | Notion page ID | Legacy tables (j_hub_optimization_recordings) |

### Table Classification

**Modern Tables (UUID FK):**
```sql
-- j_hub_decks uses UUID
account_id UUID REFERENCES j_hub_notion_db_accounts(id)
```

**Legacy Tables (TEXT FK):**
```sql
-- j_hub_optimization_recordings uses TEXT
account_id TEXT REFERENCES j_hub_notion_db_accounts(notion_id)
```

### Edge Function Response Format

`j_hub_user_accounts` returns **BOTH** formats:

```typescript
{
  account_ids: ["uuid1", "uuid2"],           // UUIDs for modern tables
  account_notion_ids: ["notion1", "notion2"], // TEXT for legacy tables
  accounts: [{
    id: "uuid",           // Supabase UUID
    notion_id: "text",    // Notion page ID
    name: "Account Name",
    // ... other fields
  }]
}
```

### Frontend Pattern

```typescript
// Modern table (j_hub_decks)
const accountIds = data.account_ids;
await supabase.from('j_hub_decks').select('*').in('account_id', accountIds);

// Legacy table (j_hub_optimization_recordings)
const accountNotionIds = data.account_notion_ids;
await supabase.from('j_hub_optimization_recordings').select('*').in('account_id', accountNotionIds);
```

### Common Mistake

```typescript
// ❌ WRONG - Using UUID for legacy tables
<PrioritizedAccountSelect
  onChange={(accountId) => setSelectedAccountId(accountId)} // UUID!
/>
// Later: INSERT fails with FK violation

// ✅ CORRECT - Extract notion_id for legacy tables
const handleAccountChange = (accountId: string) => {
  const account = accounts.find(a => a.id === accountId);
  setSelectedAccountId(account.notion_id);  // TEXT
};
```

---

## 👥 User Management System

> **PRIMARY TABLE:** `j_hub_users` - Single source of truth

### j_hub_users Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | References `auth.users(id)` |
| `email` | TEXT | User email (unique) |
| `role` | TEXT | `'admin'` \| `'staff'` \| `'client'` |
| `nome` | TEXT | Full name |
| `telefone` | TEXT | Phone number |
| `organizacao` | TEXT | Organization |
| `avatar_url` | TEXT | Profile picture |
| `notion_manager_id` | TEXT | Links to DB_Gerentes |
| `is_active` | BOOLEAN | Account status |
| `login_count` | INTEGER | Login counter |
| `last_login_at` | TIMESTAMPTZ | Last login |

### Roles & Access

| Role | Description | Access |
|------|-------------|--------|
| `admin` | System administrators | ALL accounts |
| `staff` | Traffic managers (Gestores) | Accounts where assigned as Gestor/Atendimento |
| `client` | Client managers (Gerentes) | Accounts via notion_manager_id |

### Role Checking Hook

**Location:** `src/hooks/useUserRole.ts`

```typescript
const { userRole, isAdmin, isManager, isLoading } = useUserRole();

// Helper functions
shouldShowDebugLogs(): boolean  // admin or manager
isPrivilegedUser(): boolean     // admin or manager
```

**Note:** Database uses `admin/staff/client`, hook returns `admin/manager/supervisor/gerente`.

---

## 🔄 Account Selection Pattern

> Standardized backend-centralized account fetching

### Architecture

```
┌──────────────────────────────────────────────┐
│  Edge Function: j_hub_user_accounts          │
│  - Permission filtering (admin/staff/client) │
│  - Alphabetical sorting                      │
│  - Name resolution (emails → names)          │
│  - Balance calculation                       │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│  Hook: useMyNotionAccounts()                 │
│  - Returns: accounts, accountIds, isAdmin    │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│  Component: PrioritizedAccountSelect         │
│  - Visual priority groups                    │
│  - GESTOR → SUPERVISOR → GERENTE → ADMIN     │
└──────────────────────────────────────────────┘
```

### NotionAccount Interface

**Location:** `src/hooks/useMyNotionAccounts.ts`

```typescript
interface NotionAccount {
  id: string;                    // UUID
  notion_id: string;             // TEXT (legacy compatibility)
  name: string;                  // Account name
  objectives?: string[];         // ["Vendas", "Tráfego"]
  status?: string;
  tier?: string;
  gestor?: string;               // Resolved names
  atendimento?: string;
  gerente?: string;
  gestor_email?: string;         // Original emails
  atendimento_email?: string;
  meta_ads_id?: string;
  id_google_ads?: string;
  contexto_otimizacao?: string;  // Full context for AI
  contexto_transcricao?: string; // Summary for Whisper
  payment_method?: string;       // Boleto, Cartão, etc.
  days_remaining?: number;       // Balance days left
  current_balance?: number;      // Current BRL balance
}
```

### Priority Utils

**Location:** `src/utils/accountPriority.ts`

```typescript
type AccessReason = 'GESTOR' | 'SUPERVISOR' | 'GERENTE' | 'ADMIN';

// Get priority for sorting (1=highest)
getAccessPriority('GESTOR')     // 1
getAccessPriority('SUPERVISOR') // 2
getAccessPriority('GERENTE')    // 3
getAccessPriority('ADMIN')      // 4

// Sort accounts by priority
sortAccountsByPriority(accounts, userEmail, userRole)

// Group for visual display
groupAccountsByPriority(accounts, userEmail, userRole)
```

---

## 🗂️ Estrutura de Pastas

```
jumper-creative-flow/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboards/            # Dashboard components
│   │   │   ├── GeneralDashboard.tsx
│   │   │   ├── SalesDashboard.tsx
│   │   │   ├── TrafficDashboard.tsx
│   │   │   ├── LeadsDashboard.tsx
│   │   │   ├── EngagementDashboard.tsx
│   │   │   ├── BrandAwarenessDashboard.tsx
│   │   │   ├── ReachDashboard.tsx
│   │   │   ├── VideoViewsDashboard.tsx
│   │   │   ├── ConversionsDashboard.tsx
│   │   │   ├── SeguidoresDashboard.tsx
│   │   │   ├── ConversasDashboard.tsx
│   │   │   ├── CadastrosDashboard.tsx
│   │   │   ├── TopCreativesSection.tsx
│   │   │   ├── TopCreativeCard.tsx
│   │   │   └── CreativeDetailModal.tsx
│   │   ├── optimization/          # Optimization components
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── ContextEditor.tsx
│   │   │   ├── TranscriptViewer.tsx
│   │   │   └── ExtractViewer.tsx
│   │   ├── decks/                 # Deck components
│   │   │   ├── DeckCard.tsx
│   │   │   ├── DeckConfigForm.tsx
│   │   │   ├── DeckShareModal.tsx
│   │   │   └── MarkdownEditor.tsx
│   │   └── shared/                # Shared components
│   │       └── PrioritizedAccountSelect.tsx
│   ├── pages/
│   │   ├── Admin.tsx
│   │   ├── Optimization.tsx
│   │   ├── OptimizationNew.tsx
│   │   ├── OptimizationEditor.tsx
│   │   ├── Decks.tsx
│   │   ├── DeckNew.tsx
│   │   ├── DeckEditor.tsx
│   │   ├── DeckEditorPage.tsx
│   │   ├── DeckPreview.tsx
│   │   ├── SharedDeck.tsx
│   │   ├── SharedOptimization.tsx
│   │   ├── DashboardsPage.tsx
│   │   ├── DashboardsMultiAccountPage.tsx
│   │   ├── Templates.tsx
│   │   └── MyAccounts.tsx
│   ├── hooks/
│   │   ├── useMyNotionAccounts.ts
│   │   ├── useUserRole.ts
│   │   ├── useMyOptimizations.ts
│   │   ├── useMyDecks.ts
│   │   ├── useTopCreatives.ts
│   │   ├── useCreativeInstances.ts
│   │   ├── useDraftManager.ts
│   │   └── useDeckGeneration.ts
│   ├── utils/
│   │   ├── accountPriority.ts
│   │   ├── creativeRankingMetrics.ts
│   │   ├── dashboardObjectives.ts
│   │   ├── fileValidation.ts
│   │   └── metricPerformance.ts
│   └── integrations/
│       └── supabase/
│           ├── client.ts
│           └── types.ts
├── supabase/
│   ├── functions/                 # Edge Functions (32 total)
│   └── migrations/
├── docs/
│   ├── ARCHITECTURE.md (this file)
│   ├── CHANGELOG.md
│   └── ROADMAP-DASHBOARDS.md
└── public/
    └── decks/
        └── identities/            # Brand assets
```

---

## 🗄️ Database Schema

### Core Tables

#### j_hub_users
```sql
CREATE TABLE j_hub_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
  nome TEXT,
  telefone TEXT,
  organizacao TEXT,
  avatar_url TEXT,
  notion_manager_id TEXT,
  is_active BOOLEAN DEFAULT true,
  login_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### j_hub_notion_db_accounts
Synchronized from Notion with 65+ fields including:
- Basic: `Conta`, `Status`, `Tier`, `Objetivos`
- Team: `Gestor`, `Atendimento`, `Gerente`
- IDs: `ID Meta Ads`, `ID Google Ads`, `ID Tiktok Ads`
- Context: `Contexto para Otimização`, `Contexto para Transcrição`
- Balance: `META: Saldo`, `META: Saldo Em Dias`

#### j_hub_notion_db_managers
```sql
CREATE TABLE j_hub_notion_db_managers (
  id UUID PRIMARY KEY,
  notion_id TEXT UNIQUE NOT NULL,
  "Nome" TEXT,
  "E-Mail" TEXT,
  "Contas" TEXT,           -- Comma-separated account IDs
  "Função" TEXT,
  "Organização" TEXT,
  "Telefone" TEXT
);
```

### Optimization Tables

#### j_hub_optimization_recordings
```sql
CREATE TABLE j_hub_optimization_recordings (
  id UUID PRIMARY KEY,
  account_id TEXT REFERENCES j_hub_notion_db_accounts(notion_id),
  recorded_by UUID REFERENCES j_hub_users(id),
  audio_file_path TEXT,
  duration_seconds INTEGER,
  platform TEXT,                    -- 'meta' | 'google'
  selected_objectives TEXT[],
  account_context TEXT,
  override_context TEXT,
  transcription_status TEXT,        -- 'pending' | 'processing' | 'completed' | 'error'
  processing_status TEXT,
  analysis_status TEXT,
  -- Sharing fields
  share_enabled BOOLEAN DEFAULT false,
  public_slug TEXT UNIQUE,
  password_hash TEXT
);
```

#### j_hub_optimization_transcripts
```sql
CREATE TABLE j_hub_optimization_transcripts (
  id UUID PRIMARY KEY,
  recording_id UUID UNIQUE REFERENCES j_hub_optimization_recordings(id),
  full_text TEXT NOT NULL,          -- Raw transcription
  processed_text TEXT,              -- AI-improved version
  original_text TEXT,               -- Backup before edits
  confidence_score NUMERIC,
  language TEXT,
  segments JSONB,                   -- Timestamp segments
  edit_count INTEGER DEFAULT 0
);
```

#### j_hub_optimization_extracts
```sql
CREATE TABLE j_hub_optimization_extracts (
  id UUID PRIMARY KEY,
  recording_id UUID UNIQUE REFERENCES j_hub_optimization_recordings(id),
  extract_text TEXT NOT NULL,       -- Structured extraction
  actions JSONB,                    -- Identified actions
  edit_count INTEGER DEFAULT 0
);
```

#### j_hub_optimization_context
```sql
CREATE TABLE j_hub_optimization_context (
  id UUID PRIMARY KEY,
  recording_id UUID UNIQUE REFERENCES j_hub_optimization_recordings(id),
  account_id TEXT,
  summary TEXT,
  strategy JSONB,
  actions_taken JSONB,
  metrics_mentioned JSONB,
  timeline JSONB,
  confidence_level TEXT
);
```

### Deck Tables

#### j_hub_decks
```sql
CREATE TABLE j_hub_decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES j_hub_users(id),
  account_id UUID REFERENCES j_hub_notion_db_accounts(id),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('report', 'plan', 'pitch')),
  brand_identity TEXT DEFAULT 'jumper',
  template_id TEXT,
  markdown_source TEXT,
  html_output TEXT,                 -- For srcDoc rendering
  file_url TEXT,                    -- Storage URL (fallback)
  -- Generation pipeline
  analysis_status TEXT,             -- Stage 1
  generation_status TEXT,           -- Stage 3
  generation_plan JSONB,            -- AI analysis result
  -- Versioning
  current_version_id UUID,
  -- Sharing
  slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  password_hash TEXT
);
```

#### j_hub_deck_versions
```sql
CREATE TABLE j_hub_deck_versions (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES j_hub_decks(id),
  version_number INTEGER,
  version_type TEXT,                -- 'edit' | 'refine' | 'regenerate'
  markdown_source TEXT,
  html_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Reports Table

#### j_rep_metaads_bronze
Windsor.ai synchronized data with 40+ metrics:
- IDs: `account_id`, `campaign_id`, `adset_id`, `ad_id`, `creative_id`
- Spend: `spend`, `impressions`, `reach`, `frequency`
- Clicks: `clicks`, `link_clicks`
- Video: `video_p25`, `video_p50`, `video_p75`, `thruplays`
- Conversions: `purchases`, `revenue`, `leads`, `registrations`
- Creative: `thumbnail_url`, `thumbnail_storage_url`, `image_url`, `body`, `title`

---

## ⚡ Edge Functions

### Current Functions (32 total)

#### User & Auth
| Function | Purpose |
|----------|---------|
| `j_hub_user_accounts` | Get user's accessible accounts with permissions |
| `j_hub_auth_roles` | Role verification |
| `j_hub_admin_users` | Admin user management |
| `j_hub_admin_dashboard` | Admin dashboard data |
| `j_hub_manager_dashboard` | Manager dashboard data |

#### Notion Sync
| Function | Purpose |
|----------|---------|
| `j_hub_notion_sync_accounts` | Sync DB_Contas from Notion |
| `j_hub_notion_sync_managers` | Sync DB_Gerentes from Notion |
| `j_hub_notion_sync_scheduler` | Scheduled sync coordinator |

#### Optimization Pipeline
| Function | Purpose |
|----------|---------|
| `j_hub_optimization_transcribe` | Audio → Text (Whisper API) |
| `j_hub_optimization_improve_transcript` | AI transcript enhancement |
| `j_hub_optimization_extract` | Extract structured data |
| `j_hub_optimization_analyze` | Generate analysis |
| `j_hub_optimization_process` | Full pipeline orchestrator |
| `j_hub_optimization_improve_processed` | Improve processed output |
| `j_hub_optimization_update_context` | Update account context |
| `j_hub_optimization_create_share` | Create public share link |
| `j_hub_optimization_view_shared` | View shared optimization |

#### Decks Pipeline
| Function | Purpose |
|----------|---------|
| `j_hub_deck_create` | Create new deck |
| `j_hub_deck_analyze` | Stage 1: Content analysis |
| `j_hub_deck_generate` | Stage 3: HTML generation |
| `j_hub_deck_refine` | Refine existing deck |
| `j_hub_deck_upload_html` | Direct HTML upload |
| `j_hub_deck_template_list` | List available templates |
| `j_hub_deck_template_read` | Read template content |
| `j_hub_deck_create_share` | Create public share |
| `j_hub_deck_view_shared` | View shared deck |
| `j_hub_template_versions` | Template version management |

#### Other
| Function | Purpose |
|----------|---------|
| `j_hub_balance_check_alerts` | Check account balance alerts |
| `j_hub_dashboards_multi_account` | Multi-account dashboard data |
| `j_ads_submit_ad` | Creative submission to Notion |
| `sync-creative-thumbnails` | Sync thumbnails to Storage |

### Deployment Notes

**Public Functions (require `--no-verify-jwt`):**
```bash
npx supabase functions deploy j_hub_deck_view_shared --no-verify-jwt
npx supabase functions deploy j_hub_optimization_view_shared --no-verify-jwt
```

**Standard Functions:**
```bash
npx supabase functions deploy <function-name> --project-ref PROJECT_REF
```

---

## 🔐 Autenticação e Permissões

### Authentication System

- **Provider:** Supabase Auth
- **Methods:** Email/password, Magic links, OAuth (Google)
- **Session:** JWT tokens with auto-refresh

### React Hooks

#### useAuth() - Session Management
**Location:** `src/contexts/AuthContext.tsx`

```typescript
const { currentUser, session, isAuthenticated, login, logout } = useAuth();
```

#### useUserRole() - Role Checking
**Location:** `src/hooks/useUserRole.ts`

```typescript
const { userRole, isAdmin, isManager, isLoading } = useUserRole();

// Helpers
shouldShowDebugLogs()  // admin || manager
isPrivilegedUser()     // admin || manager
```

### has_role() Function

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Access Control Matrix

| Feature | Admin | Staff | Client |
|---------|-------|-------|--------|
| View ALL accounts | ✅ | ❌ | ❌ |
| View assigned accounts | ✅ | ✅ | ✅ |
| Upload creatives | ✅ | ✅ | ✅ |
| Publish creatives | ✅ | ✅ | ❌ |
| Create optimizations | ✅ | ✅ | ❌ |
| Create decks | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |

---

## 🔗 Integração Notion

### Architecture

```
┌─────────────────────┐
│   Notion Databases  │
│   (Source of Truth) │
└──────────┬──────────┘
           │ Scheduled Sync
           ▼
┌─────────────────────┐
│  Supabase Tables    │
│  j_hub_notion_db_*  │
└──────────┬──────────┘
           │ Real-time queries
           ▼
┌─────────────────────┐
│   React Frontend    │
└─────────────────────┘
```

### Synced Databases

| Notion DB | Supabase Table | Sync Frequency |
|-----------|----------------|----------------|
| DB_Contas | `j_hub_notion_db_accounts` | 1 hour |
| DB_Gerentes | `j_hub_notion_db_managers` | 1 hour |

### Performance

- **Before (Real-time API):** 3-5s per request
- **After (Synced tables):** <100ms

---

## 🛡️ Sistema de Resiliência

### Retry Logic

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Error Logging

```typescript
await supabase.from('j_ads_error_logs').insert({
  error_type: 'API_ERROR',
  message: error.message,
  severity: 'high',
  metadata: { endpoint, payload },
  user_email: currentUser?.email
});
```

---

## 🔌 Supabase Integration

### Client Configuration

**Location:** `src/integrations/supabase/client.ts`

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-fast validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Environment Files

```
.env.local                 → Frontend (gitignored)
supabase/.env              → API keys source (gitignored)
supabase/functions/.env    → Edge Functions (gitignored)
```

### Credential Rotation

**Critical:** Edge Functions cache credentials at deployment time.

```bash
# After rotating credentials, redeploy ALL functions:
for func in $(ls supabase/functions); do
  npx supabase functions deploy $func --project-ref PROJECT_REF
done
```

---

## 🎙️ Optimization System

### Pipeline Overview

```
Audio Upload → Transcribe → Improve → Extract → Analyze
     │            │           │          │         │
     │     Whisper API   Claude AI  Claude AI  Claude AI
     │            │           │          │         │
     ▼            ▼           ▼          ▼         ▼
 Storage    transcript    processed   extract   context
            full_text       text       text     summary
```

### Components

**Pages:**
- `OptimizationNew.tsx` - Create new optimization
- `Optimization.tsx` - List optimizations
- `OptimizationEditor.tsx` - Edit/view optimization

**Key Components:**
- `DateRangePicker` - Facebook-style date selection
- `ContextEditor` - Account context editing
- `TranscriptViewer` - View/edit transcription
- `ExtractViewer` - View extracted data

### Status Fields

| Field | Values |
|-------|--------|
| `transcription_status` | pending, processing, completed, error |
| `processing_status` | pending, processing, completed, error |
| `analysis_status` | pending, processing, completed, error |

---

## 🎨 Decks System

### Pipeline Overview

```
Markdown Input → Stage 1: Analyze → Stage 2: Review → Stage 3: Generate
       │              │                  │                   │
       │         j_hub_deck_analyze      │          j_hub_deck_generate
       │              │                  │                   │
       ▼              ▼                  ▼                   ▼
   markdown      generation_plan    User approval       html_output
```

### Rendering Pattern

**Critical:** Always use `srcDoc` for rendering, NOT Storage URLs.

```typescript
// ✅ CORRECT
{deck.html_output ? (
  <iframe srcDoc={deck.html_output} />
) : deck.file_url ? (
  <iframe src={deck.file_url} />  // Fallback only
) : null}

// ❌ WRONG - Storage URLs have CSP restrictions
<iframe src={deck.file_url} />
```

### Asset URLs

**Critical:** All asset URLs must be ABSOLUTE.

```html
<!-- ✅ CORRECT -->
<img src="https://hub.jumper.studio/decks/identities/jumper/logos/logo.png">

<!-- ❌ WRONG -->
<img src="/decks/identities/jumper/logos/logo.png">
```

### Password Hashing

**Critical:** Use Web Crypto API, NOT bcrypt (Workers not available in Edge Runtime).

```typescript
// _shared/crypto.ts
import { hashPassword, verifyPassword } from '../_shared/crypto.ts';

const hash = await hashPassword(password);      // PBKDF2-SHA256
const valid = await verifyPassword(password, hash);
```

---

## 🏆 Top Creatives System

### Overview

Displays top 3 performing creatives in all dashboards with aggregation by `creative_id`.

### Components

**TopCreativesSection** - Main section component
```typescript
<TopCreativesSection
  accountId={metaAdsId}
  objective="vendas"
  dateStart={startDate}
  dateEnd={endDate}
/>
```

**TopCreativeCard** - Individual card with medal
**CreativeDetailModal** - Full details modal

### Objective Mapping

| Dashboard | Objective | Ranking Metric |
|-----------|-----------|----------------|
| SalesDashboard | `vendas` | ROAS |
| TrafficDashboard | `trafego` | Link Clicks |
| LeadsDashboard | `leads` | CPL (inverted) |
| EngagementDashboard | `engajamento` | Engagement |
| VideoViewsDashboard | `video` | Video Views |
| ConversionsDashboard | `conversoes` | Purchases |

### Filtering

Creatives must have **≥10% of total spend** to appear in rankings.

### Thumbnail System

Permanent thumbnails synced to Supabase Storage:
```
criativos/thumbnails/{account_id}/{creative_id}.{ext}
```

Priority: `thumbnail_storage_url` > `thumbnail_url` > `image_url`

---

## 📊 Dashboards System

### Available Dashboards

| Dashboard | File | Objective |
|-----------|------|-----------|
| General | `GeneralDashboard.tsx` | geral |
| Sales | `SalesDashboard.tsx` | vendas |
| Traffic | `TrafficDashboard.tsx` | trafego |
| Leads | `LeadsDashboard.tsx` | leads |
| Engagement | `EngagementDashboard.tsx` | engajamento |
| Brand Awareness | `BrandAwarenessDashboard.tsx` | reconhecimento |
| Reach | `ReachDashboard.tsx` | alcance |
| Video Views | `VideoViewsDashboard.tsx` | video |
| Conversions | `ConversionsDashboard.tsx` | conversoes |
| Seguidores | `SeguidoresDashboard.tsx` | seguidores |
| Conversas | `ConversasDashboard.tsx` | conversas |
| Cadastros | `CadastrosDashboard.tsx` | cadastros |

### Multi-Account Dashboard

**Route:** `/dashboards/multi`
**Component:** `DashboardsMultiAccountPage.tsx`

Aggregates metrics across multiple accounts for admin/staff users.

---

## 📚 Related Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project overview and setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Development history
- **[ROADMAP-DASHBOARDS.md](./ROADMAP-DASHBOARDS.md)** - Dashboards roadmap

---

**Last Updated:** 2026-01-11
**Version:** v2.1.102
**Maintained by:** Claude Code Assistant
