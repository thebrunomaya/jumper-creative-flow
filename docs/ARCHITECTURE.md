# Architecture - Detalhes Técnicos

> Documentação técnica do Jumper Flow Platform
> **Atualizado:** 2026-01-23 | **Versão:** v2.2.6

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
16. [WooCommerce Integration](#-woocommerce-integration)
17. [Daily Report System](#-daily-report-system)

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

## ⚠️ Account ID System

> **Atualizado em 2026-01-22:** Todas as tabelas agora usam UUID consistentemente.

### Overview

| Tabela | account_id FK |
|--------|---------------|
| `j_hub_decks` | UUID → `j_hub_notion_db_accounts(id)` |
| `j_hub_optimization_recordings` | UUID → `j_hub_notion_db_accounts(id)` |
| `j_hub_optimization_context` | UUID → `j_hub_notion_db_accounts(id)` |

### Lookup Table

`j_hub_notion_db_accounts` mantém ambos os IDs para compatibilidade com Notion:

```typescript
{
  id: "uuid",           // Supabase UUID (usado em FKs)
  notion_id: "text",    // Notion page ID (usado para sync com Notion)
  name: "Account Name",
  // ... other fields
}
```

### Frontend Pattern

```typescript
// Todas as tabelas usam UUID
const accountIds = data.account_ids;
await supabase.from('j_hub_decks').select('*').in('account_id', accountIds);
await supabase.from('j_hub_optimization_recordings').select('*').in('account_id', accountIds);
```

### Migração Histórica (2026-01-22)

As tabelas `j_hub_optimization_recordings` e `j_hub_optimization_context` foram migradas de TEXT notion_id para UUID:
- Migration 1: Adicionou coluna `account_uuid`, populou dados, criou FK
- Migration 2: Removeu coluna antiga `account_id` (TEXT), renomeou `account_uuid` → `account_id`
- Edge Functions e frontend atualizados para usar apenas UUID

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
| `notion_user_id` | TEXT | Notion workspace user ID for people field updates |
| `is_active` | BOOLEAN | Account status |
| `login_count` | INTEGER | Login counter |
| `last_login_at` | TIMESTAMPTZ | Last login |

### Roles & Access

| Role | Description | Access |
|------|-------------|--------|
| `admin` | System administrators | ALL accounts |
| `staff` | Traffic managers (Gestores) | Accounts where assigned as Gestor/Atendimento |
| `client` | Client managers (Gerentes) | Accounts via email matching in managers database |

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
  id_google_ads?: string;        // Google Ads account ID (e.g., "701-905-2125")
  id_google_analytics?: string;  // GA4 property ID (e.g., "291741002")
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
  notion_user_id TEXT,
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
  account_id UUID REFERENCES j_hub_notion_db_accounts(id),  -- UUID (migrated 2026-01-22)
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
  account_id UUID REFERENCES j_hub_notion_db_accounts(id),  -- UUID (migrated 2026-01-22)
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

### Reports Tables (Windsor.ai)

#### j_rep_metaads_bronze
Windsor.ai synchronized Meta Ads data with 40+ metrics:
- IDs: `account_id`, `campaign_id`, `adset_id`, `ad_id`, `creative_id`
- Spend: `spend`, `impressions`, `reach`, `frequency`
- Clicks: `clicks`, `link_clicks`
- Video: `video_p25`, `video_p50`, `video_p75`, `thruplays`
- Conversions: `purchases`, `revenue`, `leads`, `registrations`
- Creative: `thumbnail_url`, `thumbnail_storage_url`, `image_url`, `body`, `title`

#### j_rep_googleads_bronze
Windsor.ai synchronized Google Ads data:
- IDs: `account_id` (e.g., "701-905-2125"), `campaign_id`, `ad_group_id`
- Spend: `cost`, `impressions`, `clicks`
- Conversions: `conversions`, `conversion_value`
- RLS: Authenticated users can read

#### j_rep_ga4_bronze
Windsor.ai synchronized Google Analytics 4 data:
- IDs: `account_id` (GA4 property ID, e.g., "291741002")
- Dimensions: `source_medium`, `campaign`, `event_name`, `date`
- Metrics: `sessions`, `users`, `event_count`, `event_value`
- Note: Multiple events may be marked as conversions (purchase, add_to_cart, etc.)
- RLS: Authenticated users can read

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

## 🛒 WooCommerce Integration

> **Added:** 2026-01-23 | **Status:** Production

### Overview

Integração com WooCommerce para sincronizar dados de e-commerce (pedidos, produtos, clientes).

### Tables

#### j_rep_woocommerce_bronze
```sql
CREATE TABLE j_rep_woocommerce_bronze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,              -- FK to j_hub_notion_db_accounts(id)
  order_id BIGINT NOT NULL,
  line_item_id BIGINT NOT NULL DEFAULT 0, -- 0 = order record, >0 = line item
  order_date DATE NOT NULL,
  order_status TEXT NOT NULL,
  order_total NUMERIC(12,2),
  customer_id BIGINT,
  customer_email TEXT,
  payment_method TEXT,
  product_id BIGINT,
  product_name TEXT,
  product_sku TEXT,
  quantity INTEGER,
  item_total NUMERIC(12,2),
  meta_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index for UPSERT
CREATE UNIQUE INDEX idx_woo_bronze_upsert
  ON j_rep_woocommerce_bronze(account_id, order_id, line_item_id);
```

#### j_hub_woocommerce_sync_status
```sql
CREATE TABLE j_hub_woocommerce_sync_status (
  account_id UUID PRIMARY KEY REFERENCES j_hub_notion_db_accounts(id),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,  -- 'success', 'error'
  last_sync_orders_count INTEGER,
  last_error_message TEXT
);
```

### Edge Function: j_hub_woocommerce_sync

Sincroniza dados do WooCommerce para o Supabase.

**Parameters:**
- `account_id` - UUID da conta (opcional, sincroniza todas se omitido)
- `backfill_days` - Dias para backfill (default: 2)
- `chunk_days` - Dias por chunk para evitar timeout (default: 14)
- `start_date` - Data inicial para continuação de backfill

**Supported Statuses:**
- `completed`, `processing`, `enviado`, `shipped`, `delivered`, `entregue`

### UI Component: WooCommerceSyncControl

Painel de controle na aba Plataformas do AccountForm:
- **Sync Now** - Sincroniza últimas 24h
- **Backfill** - Sincroniza N dias com progresso em chunks
- Status do último sync

### Account Configuration

Campos em `j_hub_notion_db_accounts`:
- `Woo Site URL` - Base URL da loja (ex: https://boiler.fit)
- `Woo Consumer Key` - Consumer Key da API REST
- `Woo Consumer Secret` - Consumer Secret da API REST

---

## 📱 Daily Report System

> **Added:** 2026-01-23 | **Status:** Production

### Overview

Sistema de relatórios diários automatizados via WhatsApp com insights de AI.

### Edge Function: j_hub_daily_report

**CRON:** 8:00 BRT (11:00 UTC)

**Data Sources:**
- WooCommerce (j_rep_woocommerce_bronze) - Vendas, pedidos, produtos
- Meta Ads (j_rep_metaads_bronze) - Investimento, impressões, cliques
- Google Ads (j_rep_googleads_bronze) - Investimento, impressões, cliques
- GA4 (j_rep_ga4_bronze) - Sessões

**Parameters:**
- `account_id` - UUID da conta (opcional, processa todas se omitido)
- `test_mode` - Se true, gera relatório mas não envia WhatsApp
- `override_phone` - Número para envio de teste

### Message Format

**Mensagem 1 - Dados:**
```
🏃‍♀️ BOILER:

💰 VENDAS
6 pedidos | Ticket: R$ 271,38 | CPA: R$ 97,27
Faturamento: R$ 1.628,26 | Meta: R$ 5.000,00 (33%)

🏆 TOP 3 PRODUTOS
1. Whey Protein (R$ 523,40)
2. Creatina (R$ 312,00)
3. BCAA (R$ 189,90)

📊 TRÁFEGO
Investimento: R$ 583,59 | ROAS: 2.79x
Sessões: 694 | Conv: 0.86% | Custo/Sessão: R$ 0.84

📊 Meta: R$ 173,91 (30%) | CTR: 2.73%
📊 Google: R$ 410,21 (70%) | CTR: 1.90%

⚠️ ROAS 2.79x abaixo da meta (3.5x)
```

**Mensagem 2 - Insights:**
```
💡 INSIGHTS BOILER:

• CPA de R$ 97 está alto - considere pausar anúncios com CTR < 1%
• Ticket médio subiu 15% - oportunidade para upsell
• Taxa de conversão abaixo do esperado - revisar checkout
```

### Account Configuration

Campos em `j_hub_notion_db_accounts`:
- `report_enabled` - Boolean para ativar relatórios
- `report_roas_target` - ROAS alvo (ex: 3.5)
- `report_cpa_max` - CPA máximo (ex: 80)
- `report_conv_min` - Conversão mínima % (ex: 1.5)
- `report_daily_target` - Meta diária R$ (ex: 5000)
- `report_whatsapp_numbers` - Array de números/grupos

### UI Component: ReportDispatchControl

Painel de controle na aba Relatórios do AccountForm:
- **Modo Teste** - Gera relatório sem enviar
- **Override Número** - Enviar para número diferente
- **Disparar Agora** - Executa relatório manualmente

### Dependencies

- **Evolution API** - Envio de mensagens WhatsApp
- **Anthropic API** - Geração de insights (Claude Haiku)

---

## 📚 Related Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project overview and setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Development history
- **[ROADMAP-DASHBOARDS.md](./ROADMAP-DASHBOARDS.md)** - Dashboards roadmap

---

**Last Updated:** 2026-01-23
**Version:** v2.2.6
**Maintained by:** Claude Code Assistant
