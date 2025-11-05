# Architecture - Detalhes Técnicos

> 📖 Documentação técnica aprofundada do Jumper Ads Platform

---

## 📑 Índice

1. [Table Naming Convention](#️-critical-table-naming-convention) ⚠️ **CRITICAL**
2. [Dual ID System](#️-critical-dual-id-system-uuid-vs-text-notionid) ⚠️ **CRITICAL** ⭐ **NOVO (2024-11-05)**
3. [User Management System](#-user-management-system)
4. [Account Selection Pattern](#-account-selection-pattern-standard-pattern) ⭐ **ATUALIZADO (2024-10-28)**
5. [Estrutura de Pastas](#-estrutura-de-pastas)
6. [Database Schema](#-database-schema)
7. [Edge Functions](#-edge-functions)
8. [Autenticação e Permissões](#-autenticação-e-permissões)
9. [Integração Notion](#-integração-notion)
10. [Sistema de Resiliência](#-sistema-de-resiliência)
11. [Supabase Integration](#-supabase-integration)
12. [UI/UX Patterns](#-uiux-patterns)
13. [Performance](#-performance)

---

## ⚠️ CRITICAL: Table Naming Convention

> **ALWAYS use:** `j_hub_users`
> **NEVER use:** `j_ads_users` (obsolete, DO NOT CREATE)

### History & Context

- **2024-10-09:** Migrated from `j_ads_users` → `j_hub_users`
- **2024-10-20:** Standardized all related objects (constraints, triggers, foreign keys)
- **Incident:** Claude Code created duplicate `j_ads_users` table based on legacy constraint names
- **Root Cause:** Constraints had old naming (`j_ads_users_role_check`) while table was already `j_hub_users`

### Naming Standards (2024-10-20)

**Table:** `j_hub_users`

**Related Objects (all standardized):**
- ✅ Constraint: `j_hub_users_role_check` (not `j_ads_users_role_check`)
- ✅ Constraint: `j_hub_users_email_key` (not `j_ads_users_email_key`)
- ✅ Trigger: `update_j_hub_users_updated_at` (not `update_j_ads_users_updated_at`)
- ✅ Foreign Key: `j_hub_users_deactivated_by_fkey` (not `j_ads_users_deactivated_by_fkey`)
- ✅ Foreign Key: `j_hub_users_id_fkey` (not `j_ads_users_id_fkey`)
- ✅ Function: `has_role()` references `j_hub_users` (not `j_ads_users`)

### If You See `j_ads_users` Anywhere

1. **STOP** - Do not create this table
2. Check this document for correct table name
3. Use `j_hub_users` instead
4. Report inconsistency to be fixed

---

## ⚠️ CRITICAL: Dual ID System (UUID vs TEXT notion_id)

> **CRITICAL ARCHITECTURAL DECISION (2024-11-05):**
> The database uses a **dual ID system** for accounts. Understanding this is CRITICAL to avoid FK constraint violations.

### Overview

**Two ID formats coexist:**

| ID Type | Format | Used By | Example |
|---------|--------|---------|---------|
| **UUID** | Supabase auto-generated | Modern tables (2024+) | `123e4567-e89b-12d3-a456-426614174000` |
| **TEXT notion_id** | Notion page ID | Legacy tables (<2024) | `9c4f39ed1234567890abcdef12345678` |

### Table Classification

#### **Modern Tables (use UUID FK)**

Tables created in 2024 or refactored to use Supabase-native IDs:

```sql
-- Example: j_hub_decks
CREATE TABLE j_hub_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID,  -- ✅ References j_hub_notion_db_accounts(id)
  ...
);
```

**Tables:**
- `j_hub_decks` (created 2024-11)
- `j_hub_users` (refactored 2024-10)
- Future tables (should use UUID)

#### **Legacy Tables (use TEXT notion_id FK)**

Tables created before 2024 migration, still referencing Notion IDs:

```sql
-- Example: j_hub_optimization_recordings
CREATE TABLE j_hub_optimization_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT,  -- ⚠️ References j_hub_notion_db_accounts(notion_id), NOT id
  ...
  FOREIGN KEY (account_id) REFERENCES j_hub_notion_db_accounts(notion_id)
);
```

**Tables:**
- `j_hub_optimization_recordings`
- `j_hub_optimization_transcripts`
- `j_hub_optimization_context`
- `j_hub_creative_submissions`

### Edge Function Compatibility Layer

**`j_hub_user_accounts` Edge Function returns BOTH formats:**

```typescript
// Response structure (commit 412a8ec, 2024-11-05)
{
  account_ids: ["uuid1", "uuid2", ...],           // UUIDs for modern tables
  account_notion_ids: ["notion1", "notion2", ...], // TEXT for legacy tables
  accounts: [
    {
      id: "uuid",          // Supabase UUID
      notion_id: "text",   // Notion page ID
      name: "Account Name",
      ...
    }
  ]
}
```

**Why both formats?**
- Modern tables (decks) query with `account_ids` (UUID array)
- Legacy tables (optimizations) query with `account_notion_ids` (TEXT array)
- Frontend components receive both and choose based on target table

### Frontend Pattern

**React hooks select correct ID format based on table:**

```typescript
// Modern table example (useMyDecks.ts)
const { data: accountsData } = await supabase.functions.invoke('j_hub_user_accounts');

const accountIds = accountsData.account_ids; // UUID array
const { data: decks } = await supabase
  .from('j_hub_decks')
  .select('*')
  .in('account_id', accountIds); // ✅ UUID FK match

// Legacy table example (useMyOptimizations.ts)
const accountNotionIds = accountsData.account_notion_ids; // TEXT array
const { data: optimizations } = await supabase
  .from('j_hub_optimization_recordings')
  .select('*')
  .in('account_id', accountNotionIds); // ✅ TEXT FK match
```

### Common Mistake: PrioritizedAccountSelect

**Problem:** Component returns UUID but form needs TEXT

```typescript
// ❌ WRONG - Causes FK constraint violation on legacy tables
<PrioritizedAccountSelect
  value={selectedAccountId}  // User selects account
  onChange={(accountId) => {
    setSelectedAccountId(accountId); // ⚠️ This is UUID!
    // Later: INSERT account_id = uuid → FK violation if table expects TEXT
  }}
/>
```

**Solution:** Find account object and extract correct ID type

```typescript
// ✅ CORRECT - OptimizationNew.tsx pattern (lines 95-118)
const handleAccountChange = (accountId: string) => {
  // accountId parameter is UUID from PrioritizedAccountSelect
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    // Store notion_id (TEXT) for legacy table
    setSelectedAccountId(account.notion_id);  // ✅ Correct format
    setSelectedAccountName(account.name);
  }
};
```

### Incident Report (2024-11-05)

**Symptoms:**
```
Error: insert or update on table "j_hub_optimization_recordings"
violates foreign key constraint "j_ads_optimization_recordings_account_id_fkey"
```

**Root Cause:**
- Commit 412a8ec changed `j_hub_user_accounts` to return UUIDs (for decks system)
- `OptimizationNew.tsx` was storing UUID from `account.id`
- `j_hub_optimization_recordings.account_id` is TEXT (expects `notion_id`)
- UUID inserted into TEXT column → FK constraint violation

**Fix Applied (v2.0.75):**
1. Modified `handleAccountChange` to store `account.notion_id` instead of `accountId`
2. Modified `handleRecoverDraft` to find accounts by `a.notion_id` instead of `a.id`
3. Fixed typo in `OptimizationRecorder.tsx`: `selectedAccountName` → `accountName`

### Migration Strategy (Future)

**Option 1: Migrate legacy tables to UUID (RECOMMENDED)**

```sql
-- Add new UUID column
ALTER TABLE j_hub_optimization_recordings ADD COLUMN account_uuid UUID;

-- Populate from accounts table
UPDATE j_hub_optimization_recordings o
SET account_uuid = a.id
FROM j_hub_notion_db_accounts a
WHERE o.account_id = a.notion_id;

-- Drop old FK, add new FK
ALTER TABLE j_hub_optimization_recordings
  DROP CONSTRAINT j_ads_optimization_recordings_account_id_fkey,
  ADD CONSTRAINT j_hub_optimization_recordings_account_uuid_fkey
    FOREIGN KEY (account_uuid) REFERENCES j_hub_notion_db_accounts(id);

-- Rename columns
ALTER TABLE j_hub_optimization_recordings
  DROP COLUMN account_id,
  RENAME COLUMN account_uuid TO account_id;
```

**Option 2: Keep dual system (CURRENT)**
- Less risky (no data migration)
- Requires careful ID type awareness
- Edge Function provides both formats

### Decision Checklist

**Before creating/modifying table with account_id FK:**

1. ✅ Check target table: UUID or TEXT?
2. ✅ Use correct ID format from Edge Function response
3. ✅ If PrioritizedAccountSelect used: extract `account.notion_id` for legacy tables
4. ✅ Test FK constraint with actual insert before deploying

**Before querying accounts:**

1. ✅ Identify table type (modern=UUID, legacy=TEXT)
2. ✅ Use `account_ids` (UUID) for modern tables
3. ✅ Use `account_notion_ids` (TEXT) for legacy tables
4. ✅ Never assume ID format without checking table schema

---

## 👥 User Management System

> ⚠️ **PRIMARY TABLE:** `j_hub_users` - Single source of truth for all user data and roles
> ❌ **DEPRECATED:** `user_roles`, `j_ads_user_roles`, `j_ads_users` - DO NOT USE

### **`j_hub_users` - Single Source of Truth** (v2.0)

**Purpose:** Unified user management consolidating auth, roles, and profile data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | References `auth.users(id)` |
| `email` | TEXT | UNIQUE, NOT NULL | User email |
| `role` | TEXT | NOT NULL | `'admin'` \| `'staff'` \| `'client'` |
| `nome` | TEXT | | Full name (from OAuth or Notion) |
| `telefone` | TEXT | | Phone number |
| `organizacao` | TEXT | | Organization name |
| `avatar_url` | TEXT | | Profile picture URL |
| `notion_manager_id` | UUID | | Links to `j_hub_notion_db_managers.notion_id` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update |
| `last_login_at` | TIMESTAMPTZ | | Last login timestamp |

**Indexes:**
```sql
CREATE INDEX idx_j_hub_users_email ON j_hub_users(email);
CREATE INDEX idx_j_hub_users_role ON j_hub_users(role);
CREATE INDEX idx_j_hub_users_notion_manager_id ON j_hub_users(notion_manager_id);
```

**Backwards Compatibility (v2.0):**
```sql
-- Legacy table name still works via VIEW
CREATE OR REPLACE VIEW j_ads_users AS SELECT * FROM j_hub_users;
```

### **Roles & Access Levels**

| Role | Description | Users | Access |
|------|-------------|-------|--------|
| `admin` | System administrators | bruno@jumper.studio | ALL accounts (unrestricted) |
| `staff` | Traffic managers (Gestores) | pedro@jumper.studio | Accounts where assigned as Gestor/Supervisor |
| `client` | Client managers (Gerentes) | External users | Accounts where assigned as Gerente (via notion_manager_id) |

### **User Lookup Strategy** (v2.0)

```typescript
// Check user role
SELECT role FROM j_hub_users WHERE id = <auth.uid()>;

// Get user's accessible accounts (admin)
IF role = 'admin':
  SELECT * FROM j_hub_notion_db_accounts; // ALL accounts

// Get user's accessible accounts (staff - OAuth)
IF role = 'staff':
  SELECT * FROM j_hub_notion_db_accounts
  WHERE "Gestor" ILIKE '%' || (SELECT email FROM j_hub_users WHERE id = <auth.uid()>) || '%'
     OR "Supervisor" ILIKE '%' || (SELECT email FROM j_hub_users WHERE id = <auth.uid()>) || '%';

// Get user's accessible accounts (client)
IF role = 'client':
  SELECT a.* FROM j_hub_notion_db_accounts a
  JOIN j_hub_users u ON a."Gerente" ILIKE '%' || u.notion_manager_id || '%'
  WHERE u.id = <auth.uid()>;
```

### **Name Resolution**

Names are resolved using this priority order (v2.0):

1. **`j_hub_users.nome`** (cached from OAuth or Notion) ⭐ PRIMARY
2. **`auth.users.user_metadata.full_name`** (OAuth users)
3. **`j_hub_notion_db_managers."Nome"`** (Client users)
4. **Email fallback** (last resort)

### **⚠️ DEPRECATED Tables**

**DO NOT USE these tables in new code:**

- ❌ **`user_roles`** - Deleted 2025-10-09 (replaced by `j_hub_users.role`)
- ❌ **`j_ads_user_roles`** - Never existed in production
- ⚠️ **`j_ads_users`** - Legacy name (use `j_hub_users` in v2.0+, backwards compatible via VIEW)

### **✨ v2.0 Rebrand Summary** (2025-10-12)

**Renamed Tables:**
- `j_ads_users` → `j_hub_users`
- `j_ads_user_audit_log` → `j_hub_user_audit_log`
- `j_hub_notion_db_accounts` → `j_hub_notion_db_accounts`
- `j_hub_notion_db_managers` → `j_hub_notion_db_managers`
- `j_ads_notion_sync_logs` → `j_hub_notion_sync_logs`

**Backwards Compatibility:**
- All old table names work via SQL VIEWs
- Zero downtime migration
- 29/29 tests passing ✅

**Unchanged (by design):**
- `j_ads_creative_*` tables (creative system)
- `j_ads_submit_ad` function (creative submission)
- `j_rep_*` tables (reports system)

---

## 🔄 Account Selection Pattern (Standard Pattern)

> ⭐ **Updated:** 2024-10-28 - Standardized across entire application

### **Architecture Overview**

**Pattern:** Backend-centralized account fetching with permission-based filtering

**Components:**
1. **Edge Function:** `j_hub_user_accounts` - Handles ALL permission logic and sorting
2. **React Hook:** `useMyNotionAccounts` - Standard interface for all pages
3. **Frontend:** Optional custom sorting for special cases (e.g., MyAccounts priority tiers)

### **Backend: j_hub_user_accounts Edge Function**

**Location:** `supabase/functions/j_hub_user_accounts/index.ts`

**Responsibilities:**
- ✅ User authentication verification
- ✅ Role-based account filtering (Admin/Staff/Client)
- ✅ Alphabetical sorting by account name (`.order('"Conta"', { ascending: true })`)
- ✅ Name resolution (Gestor/Atendimento/Gerente IDs → Names)
- ✅ Complete account data formatting

**Permission Logic:**

| Role | Account Access |
|------|----------------|
| **Admin** | ALL accounts (unrestricted) |
| **Staff** | Accounts where user is in `Gestor` or `Atendimento` fields |
| **Client** | Accounts where user's `notion_manager_id` is in `Gerente` field |

**Response Format:**
```typescript
{
  success: true,
  accounts: NotionAccount[], // Pre-sorted alphabetically
  account_ids: string[],     // Legacy compatibility
  is_admin: boolean,
  user_role: 'admin' | 'staff' | 'client',
  source: 'complete_sync'
}
```

### **Frontend: useMyNotionAccounts Hook**

**Location:** `src/hooks/useMyNotionAccounts.ts`

**Usage (Standard Pattern):**
```tsx
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';

function MyComponent() {
  const { accounts, loading, error, isAdmin } = useMyNotionAccounts();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Select>
      {accounts.map(account => (
        <SelectItem key={account.id} value={account.id}>
          {account.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

**Return Type:**
```typescript
{
  accountIds: string[];        // Legacy field (array of Notion IDs)
  accounts: NotionAccount[];   // Complete account data (pre-sorted)
  isAdmin: boolean;            // Admin flag from Edge Function
  loading: boolean;            // Fetch state
  error: string | null;        // Error message if failed
}
```

**NotionAccount Interface:**
```typescript
interface NotionAccount {
  id: string;              // Notion page ID
  name: string;            // Account name (from "Conta" field)
  objectives?: string[];   // ["Vendas", "Tráfego", ...]
  status?: string;         // Account status
  tier?: string;           // Account tier
  gestor?: string;         // Gestor names (resolved)
  atendimento?: string;    // Atendimento names (resolved)
  gerente?: string;        // Gerente names (resolved)
  meta_ads_id?: string;    // Meta Ads account ID
  id_google_ads?: string;  // Google Ads account ID
}
```

### **Pages Using This Pattern**

✅ **OptimizationNew** (`src/pages/OptimizationNew.tsx`)
- Uses accounts directly from hook
- Enhanced with loading/empty states
- Alphabetical sorting from backend

✅ **Optimization** (`src/pages/Optimization.tsx`)
- Derives unique accounts from optimization records
- Applies alphabetical sorting on derived list
- Filter dropdown for multi-account users

✅ **MyAccounts** (`src/pages/MyAccounts.tsx`)
- Uses accounts from hook
- **Custom frontend sorting:** Priority-based (Gestor > Supervisor > Gerente) + User choice (name/tier/status)
- Applies custom logic on top of alphabetical base

### **Custom Frontend Sorting (Advanced)**

For special cases like MyAccounts that need custom sorting logic:

```tsx
const sortedAccounts = useMemo(() => {
  return [...accounts].sort((a, b) => {
    // 1st tier: Custom priority logic
    const priorityA = getAccessPriority(a);
    const priorityB = getAccessPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2nd tier: User-selected sorting
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'tier':
        return (a.tier || '').localeCompare(b.tier || '');
      // ... other cases
    }
  });
}, [accounts, sortBy]);
```

### **Migration History**

**Before (Inconsistent):**
- ❌ Different implementations across pages
- ❌ Some pages had no sorting (OptimizationNew)
- ❌ Confusion with unused AccountSelector component
- ❌ Manual filtering logic duplicated

**After (Standardized - v2.0.58+):**
- ✅ Single Edge Function for all permission logic
- ✅ Alphabetical sorting at database level (consistent)
- ✅ Standard hook for all pages
- ✅ Optional custom frontend sorting for special cases
- ✅ Removed unused AccountSelector.tsx component

**Commits:**
- `bf6e634` - Added alphabetical sorting to Edge Function (FASE 1)
- `f83fa1b` - Enhanced OptimizationNew with loading states (FASE 2)
- `129da30` - Removed unused AccountSelector component (FASE 3)

### **Prioritized Account Selection (v2.0.61+)** ⭐ NEW

**Purpose:** Display accounts in dropdowns with visual priority groups based on user's relationship with each account

**Architecture:** Shared utilities + reusable component pattern

**Components:**
1. **Utils:** `src/utils/accountPriority.ts` - Centralized priority logic
2. **Component:** `src/components/shared/PrioritizedAccountSelect.tsx` - Reusable dropdown with visual separators
3. **Pages:** OptimizationNew, Optimization, MyAccounts - All use same pattern

#### **Priority Order**

Accounts are grouped by user's relationship (highest to lowest priority):

1. **GESTOR (📊)** - User is the traffic manager (`gestor_email` field)
2. **SUPERVISOR (👁️)** - User is supervisor/atendimento (`atendimento_email` field)
3. **GERENTE (📝)** - User is manager/client (other accounts)
4. **ADMIN (👑)** - Admin-only access (no direct assignment)

**Visual Pattern:**
```
┌─────────────────────────────────────────┐
│ Selecione uma conta                  ▼ │
└─────────────────────────────────────────┘
  ┌───────────────────────────────────┐
  │ 📊 GESTOR (3)                     │
  │   • Clínica Seven                 │
  │   • Boiler                        │
  │   • Mini                          │
  ├───────────────────────────────────┤ ← Visual separator
  │ 👁️ SUPERVISOR (2)                 │
  │   • A Tu Lado                     │
  │   • Jumper                        │
  ├───────────────────────────────────┤
  │ 👑 ADMIN (20)                     │
  │   • Almanara                      │
  │   • Almeida Prado                 │
  │   • ...                           │
  └───────────────────────────────────┘
```

#### **accountPriority.ts - Shared Utils**

**Location:** `src/utils/accountPriority.ts`

**Key Functions:**

```typescript
// Types
export type AccessReason = 'GESTOR' | 'SUPERVISOR' | 'GERENTE' | 'ADMIN';
export type UserRole = 'admin' | 'staff' | 'client';

// Get all access reasons for a user (accumulated, not replaced)
export function getAccessReasons(
  account: NotionAccount,
  userEmail: string,
  userRole: UserRole
): AccessReason[] {
  // Returns array like: ['GESTOR', 'ADMIN']
}

// Get numeric priority (1=highest, 4=lowest)
export function getAccessPriority(reason: AccessReason): number {
  // GESTOR=1, SUPERVISOR=2, GERENTE=3, ADMIN=4
}

// Get primary (highest priority) reason for sorting
export function getPrimaryAccessReason(
  account: NotionAccount,
  userEmail: string,
  userRole: UserRole
): AccessReason;

// Sort accounts by priority + alphabetically
export function sortAccountsByPriority(
  accounts: NotionAccount[],
  userEmail: string,
  userRole: UserRole
): NotionAccount[];

// Group accounts into priority buckets
export function groupAccountsByPriority(
  accounts: NotionAccount[],
  userEmail: string,
  userRole: UserRole
): Record<AccessReason, NotionAccount[]>;

// UI helpers
export function getAccessReasonLabel(reason: AccessReason): string;
export function getAccessReasonIcon(reason: AccessReason): string;
```

**Why This Works:**
- **Single source of truth** for priority logic across entire app
- **Accumulated badges** - User can be GESTOR + ADMIN on same account
- **Email-based matching** - Uses gestor_email, atendimento_email fields
- **Alphabetical within groups** - Clean, scannable lists

#### **PrioritizedAccountSelect Component**

**Location:** `src/components/shared/PrioritizedAccountSelect.tsx`

**Props:**
```typescript
interface PrioritizedAccountSelectProps {
  accounts: NotionAccount[];
  value?: string | null;  // null = "all accounts"
  onChange: (accountId: string) => void;
  userEmail?: string;
  userRole?: UserRole;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  showInactiveToggle?: boolean;  // Admin-only toggle
  showAllOption?: boolean;        // "Todas as contas" option
  className?: string;
}
```

**Features:**
- ✅ Visual separators between priority groups
- ✅ Group headers with emoji icons and counts: "📊 GESTOR (3)"
- ✅ "Mostrar Inativas" toggle (admin only) - filters inactive accounts
- ✅ "Todas as contas" option (for filters)
- ✅ Loading states with spinner
- ✅ Empty states
- ✅ Dropdown always opens downward (`avoidCollisions={false}`)

**Usage Example:**
```tsx
import { PrioritizedAccountSelect } from '@/components/shared/PrioritizedAccountSelect';
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

function MyPage() {
  const { accounts, loading } = useMyNotionAccounts();
  const { userRole } = useUserRole();
  const { currentUser } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  return (
    <PrioritizedAccountSelect
      accounts={accounts}
      loading={loading}
      value={selectedAccountId}
      onChange={setSelectedAccountId}
      userEmail={currentUser?.email}
      userRole={userRole}
      placeholder="Selecione uma conta"
      showInactiveToggle={true}  // Enable admin toggle
      showAllOption={false}       // No "all" option
    />
  );
}
```

#### **Implementation Commits (v2.0.61-v2.0.63)**

| Version | Changes |
|---------|---------|
| **v2.0.61** | 🎉 Major feature - Prioritized account selection across entire app |
| | - Created `accountPriority.ts` utils with shared logic |
| | - Created `PrioritizedAccountSelect` component with visual separators |
| | - Refactored MyAccounts to use shared utils (maintains existing behavior) |
| | - Applied to OptimizationNew with "Show Inactive" toggle |
| | - Applied to Optimization with "All accounts" option |
| | - Updated NotionAccount interface with email fields |
| **v2.0.62** | 🐛 Fix - Added `side="bottom"` to SelectContent (attempted fix) |
| **v2.0.63** | ✅ Fix - Added `avoidCollisions={false}` to force downward opening |
| | - Root cause: Radix UI collision detection overriding side prop |
| | - Verified with Playwright MCP testing |

**Git Branch:** `feature/standardize-account-selection`

**Related Files:**
- `src/utils/accountPriority.ts` (NEW - 200 lines)
- `src/components/shared/PrioritizedAccountSelect.tsx` (NEW - 240 lines)
- `src/pages/OptimizationNew.tsx` (MODIFIED - uses component)
- `src/pages/Optimization.tsx` (MODIFIED - uses component)
- `src/pages/MyAccounts.tsx` (MODIFIED - uses utils)
- `src/hooks/useMyNotionAccounts.ts` (MODIFIED - added email fields to interface)

---

## 🗂️ Estrutura de Pastas

```
jumper-creative-flow/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── steps/                 # Multi-step form components
│   │   ├── sections/              # Content sections
│   │   ├── reports/               # Dashboard components
│   │   │   ├── GeneralDashboard.tsx
│   │   │   ├── SalesDashboard.tsx
│   │   │   ├── TrafficDashboard.tsx
│   │   │   ├── EngagementDashboard.tsx
│   │   │   ├── LeadsDashboard.tsx
│   │   │   ├── BrandAwarenessDashboard.tsx
│   │   │   ├── ReachDashboard.tsx
│   │   │   ├── VideoViewsDashboard.tsx
│   │   │   ├── ConversionsDashboard.tsx
│   │   │   ├── ComingSoonTemplate.tsx
│   │   │   ├── ReportAccessControl.tsx
│   │   │   └── ReportsDashboard.tsx
│   │   ├── PasswordModal.tsx
│   │   ├── UserMenu.tsx
│   │   ├── LoginPageNew.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/                     # Route components
│   │   ├── Admin.tsx              # Admin dashboard
│   │   ├── Manager.tsx            # Manager dashboard
│   │   ├── Create.tsx             # Creative upload
│   │   └── Reports.tsx            # Reports page
│   ├── hooks/                     # Custom React hooks
│   │   ├── useMyNotionAccounts.ts
│   │   ├── useNotionData.ts
│   │   └── useCreativeSubmission.ts
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx
│   ├── integrations/              # External service integrations
│   │   └── supabase/
│   ├── utils/                     # Utility functions
│   │   ├── fileValidation.ts
│   │   └── metricPerformance.ts
│   └── assets/                    # Static assets
│       └── fonts/                 # Haffer font files
├── supabase/
│   ├── functions/                 # Edge Functions
│   │   ├── j_ads_admin_actions/
│   │   ├── j_ads_manager_actions/
│   │   ├── j_ads_submit_creative/
│   │   ├── j_ads_complete_notion_sync/
│   │   ├── j_ads_my_accounts_complete/
│   │   └── j_ads_scheduled_notion_sync/
│   └── migrations/                # Database migrations
├── docs/                          # Documentation
│   ├── CHANGELOG.md
│   └── ARCHITECTURE.md (este arquivo)
├── public/                        # Public assets
└── CLAUDE.md                      # Main configuration
```

---

## 🗄️ Database Schema

### **Creative Management**

#### `j_ads_creative_submissions`
Main submissions table
```sql
CREATE TABLE j_ads_creative_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_objective TEXT,
  creative_type TEXT,
  status TEXT DEFAULT 'draft', -- draft, submitted, published
  submitted_by TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  notion_page_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_ads_creative_files`
File attachments with Supabase Storage
```sql
CREATE TABLE j_ads_creative_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES j_ads_creative_submissions(id),
  file_path TEXT NOT NULL,
  file_type TEXT, -- image/video
  file_size BIGINT,
  placement TEXT, -- square, vertical, horizontal, carousel_1_1, carousel_4_5
  dimensions JSONB, -- {width, height, aspect_ratio}
  duration_seconds INT, -- para vídeos
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_ads_creative_variations`
Multiple creative variations
```sql
CREATE TABLE j_ads_creative_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES j_ads_creative_submissions(id),
  variation_number INT,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  call_to_action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Synchronized Tables (Notion → Supabase)**

#### `j_hub_notion_db_managers`
Gestores completos sincronizados (10 campos)
```sql
CREATE TABLE j_hub_notion_db_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_id TEXT UNIQUE NOT NULL,
  nome TEXT,
  email TEXT,
  contas TEXT, -- IDs das contas separados por vírgula
  tipo TEXT, -- gestor, supervisor, gerente
  ativo BOOLEAN,
  permissoes JSONB,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_hub_notion_db_accounts`
Contas completas sincronizadas (75 campos)
```sql
CREATE TABLE j_hub_notion_db_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_id TEXT UNIQUE NOT NULL,
  nome TEXT,
  cliente TEXT,
  objetivos TEXT, -- ou JSONB array
  status TEXT,
  gestor_responsavel TEXT,
  budget_mensal NUMERIC,
  plataforma TEXT,

  -- Meta Ads fields (75+ campos disponíveis)
  account_id TEXT,
  account_name TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  ad_id TEXT,
  ad_name TEXT,

  -- Métricas básicas
  impressions BIGINT,
  clicks BIGINT,
  spend NUMERIC,
  reach BIGINT,
  frequency NUMERIC,

  -- Conversões
  conversions BIGINT,
  conversion_value NUMERIC,
  cpa NUMERIC,
  roas NUMERIC,

  -- Engagement
  post_engagement BIGINT,
  link_clicks BIGINT,
  video_views BIGINT,

  -- Timestamps
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_hub_notion_db_partners`
Parceiros sincronizados
```sql
CREATE TABLE j_hub_notion_db_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_id TEXT UNIQUE NOT NULL,
  nome TEXT,
  tipo TEXT, -- agencia, freelancer
  contas_ativas TEXT[],
  contato JSONB,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **System Health & Monitoring**

#### `j_ads_error_logs`
Sistema de error tracking estruturado
```sql
CREATE TABLE j_ads_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context TEXT NOT NULL, -- 'submission', 'notion_sync', 'file_upload'
  operation TEXT NOT NULL,
  error_message TEXT,
  error_code TEXT,
  stack_trace TEXT,
  severity TEXT, -- low, medium, high, critical
  category TEXT, -- validation, network, database, unknown
  metadata JSONB,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_ads_system_metrics`
Métricas de saúde do sistema (parcial)
```sql
CREATE TABLE j_ads_system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

#### `j_ads_fallback_submissions`
Submissões fallback para recuperação (parcial)
```sql
CREATE TABLE j_ads_fallback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_submission_id UUID,
  submission_data JSONB,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Tabelas Obsoletas (Manter compatibilidade)**

⚠️ **Não usar em novos desenvolvimentos**

- `j_ads_notion_managers` - Substituída por `j_hub_notion_db_managers`
- `j_ads_notion_accounts` - Substituída por dados sincronizados

---

## ⚡ Edge Functions

### **Core Functions**

#### `j_ads_admin_actions`
**Operações administrativas**
- `POST /j_ads_admin_actions` com `action` param
- Actions: `list`, `publish`, `delete`
- Requires: Admin role
- Returns: Operation result + status

**Exemplo:**
```javascript
const { data } = await supabase.functions.invoke('j_ads_admin_actions', {
  body: { action: 'publish', submission_id: 'uuid' }
});
```

#### `j_ads_manager_actions`
**Operações de gerente (acesso limitado)**
- Similar ao admin mas sem `delete`
- Requires: Manager role
- Filtro por contas do usuário

#### `j_ads_submit_creative`
**Processar submissões de criativos + SISTEMA RESILIENTE**

**Proteções:**
- ✅ Retry logic com exponential backoff
- ✅ Circuit breaker para APIs externas
- ✅ Upload transacional com rollback
- ✅ Fallback automático para falhas Notion

**Fluxo:**
```
1. Validar dados entrada
2. Iniciar transação
3. Upload arquivos → Supabase Storage (transacional)
4. Salvar submission → j_ads_creative_submissions
5. Salvar files → j_ads_creative_files
6. Salvar variations → j_ads_creative_variations
7. Commit transação
8. Return status: 'submitted'
```

**Error Handling:**
```javascript
try {
  // Upload files
  const uploadedFiles = await uploadWithRollback(files);

  // Save to DB
  const submission = await saveSubmission(data);

  return { success: true, submission_id };
} catch (error) {
  // Rollback uploads
  await cleanupFiles(uploadedFiles);

  // Log error
  await logError(error);

  // Save to fallback
  await saveFallback(data);

  throw error;
}
```

---

### **Sync Functions**

#### `j_ads_complete_notion_sync`
**Sincronização completa database**
- Execução: Manual ou scheduled
- Sync: DB_Contas, DB_Gerentes, DB_Parceiros
- Process: Fetch Notion → Transform → Upsert Supabase
- Duration: ~30s para 50 contas

**Exemplo de execução:**
```javascript
const { data } = await supabase.functions.invoke('j_ads_complete_notion_sync');
// Returns: { synced_accounts: 50, synced_managers: 10, duration_ms: 28000 }
```

#### `j_ads_my_accounts_complete`
**User account access with full data**
- Input: User email
- Process: Email → Manager → Contas IDs → Full account data
- Returns: Array de contas com 75 campos

**Fluxo:**
```
1. Recebe user.email
2. SELECT * FROM j_hub_notion_db_managers WHERE email = user.email
3. Parse manager.contas → ['id1', 'id2', 'id3']
4. SELECT * FROM j_hub_notion_db_accounts WHERE notion_id IN (ids)
5. Transform objetivos (string → array)
6. Return accounts[]
```

#### `j_ads_scheduled_notion_sync`
**Sincronização incremental scheduled**
- Execução: Cron (a cada 1 hora)
- Process: Apenas registros `updated_at` > last sync
- Otimização: Reduz carga vs full sync

---

### **Obsolete Functions**

⚠️ **Manter para compatibilidade - não usar em novos desenvolvimentos**

- `j_ads_notion_clients` - Substituída por tabelas sincronizadas
- `j_ads_notion_my_accounts` - Substituída por `j_ads_my_accounts_complete`
- `j_ads_notion_partners` - Substituída por tabelas sincronizadas

---

## 🔐 Autenticação e Permissões

### **Authentication System**
- **Provider**: Supabase Auth
- **Methods**: Email/password + Magic links + OAuth (Notion)
- **Session**: JWT tokens (auto-refresh)
- **User Table**: `j_ads_users` (PRIMARY - single source of truth)

### **Role-Based Access Control (RBAC)**

**✅ CURRENT Implementation (uses j_ads_users):**

```sql
-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**❌ DEPRECATED Implementation (DO NOT USE):**
```sql
-- OLD VERSION - uses user_roles table that doesn't exist
-- If you see this in code, REPLACE with j_ads_users version above
```

**Roles:**
- `admin` - Full system access, all accounts (5% - bruno@jumper.studio)
- `staff` - Traffic managers, edit/publish (10% - pedro@jumper.studio)
- `client` - Client managers, upload only (85% - external users)

**Access Control Matrix:**

| Feature | Admin | Staff | Client |
|---------|-------|-------|--------|
| View ALL accounts | ✅ | ❌ | ❌ |
| View assigned accounts | ✅ | ✅ | ✅ |
| Upload creatives | ✅ | ✅ | ✅ |
| Publish creatives | ✅ | ✅ | ❌ |
| Delete creatives | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |
| Notion sync | ✅ | ❌ | ❌ |

### **React Hooks for Authentication & Roles**

> ⚠️ **CRITICAL:** Always use the correct hook for each purpose!

#### **`useAuth()` - Session & User Data Only**
**Location:** `/src/contexts/AuthContext.tsx`

**Purpose:** Authentication state and session management

**Returns:**
```typescript
{
  user: User | null,              // Supabase auth user object
  session: Session | null,        // Current session with JWT
  isAuthenticated: boolean,       // Is user logged in?
  login: (email, password) => Promise,
  logout: () => Promise,
  // ... other auth methods
}
```

**Use when:**
- ✅ Checking if user is logged in (`isAuthenticated`)
- ✅ Getting user email (`user.email`)
- ✅ Performing login/logout operations
- ✅ Accessing JWT token (`session.access_token`)

**❌ DO NOT use for:**
- ❌ Checking user role (use `useUserRole()` instead)
- ❌ Permission checks (use `useUserRole()` instead)

#### **`useUserRole()` - Role Checking & Permissions**
**Location:** `/src/hooks/useUserRole.ts`

**Purpose:** User role detection and permission helpers

**Returns:**
```typescript
{
  userRole: 'admin' | 'manager' | 'supervisor' | 'gerente' | null,
  isLoading: boolean,

  // Boolean helpers (ready to use)
  isAdmin: boolean,               // userRole === 'admin'
  isManager: boolean,             // userRole === 'manager'
  isSupervisor: boolean,          // userRole === 'supervisor'
  isGerente: boolean,             // userRole === 'gerente'

  // Functions
  shouldShowDebugLogs: () => boolean,    // admin or manager
  isPrivilegedUser: () => boolean,       // admin or manager
}
```

**How it works:**
1. Uses Supabase RPC `has_role()` to check roles in `j_ads_users`
2. Checks in priority order: `admin` → `manager` → default (`gerente`)
3. Returns boolean helpers for easy permission checks

**Use when:**
- ✅ Checking user permissions (`isAdmin`, `isManager`)
- ✅ Showing/hiding features based on role
- ✅ Conditional rendering of admin-only UI
- ✅ Enabling/disabling edit capabilities

**Examples:**

```typescript
// ❌ WRONG - useAuth doesn't have userRole
import { useAuth } from '@/contexts/AuthContext';
const { userRole } = useAuth();  // userRole will be undefined!

// ✅ CORRECT - use useUserRole
import { useUserRole } from '@/hooks/useUserRole';
const { isAdmin, isManager } = useUserRole();

// Admin-only features
if (isAdmin) {
  return <AdminPanel />;
}

// Privileged users (admin + manager)
if (isAdmin || isManager) {
  return <AdvancedFeatures />;
}

// Disable editing for non-admins
<Textarea disabled={!isAdmin} />
```

**Protected Routes:**
```typescript
// src/components/ProtectedRoute.tsx
import { useUserRole } from '@/hooks/useUserRole';

<ProtectedRoute requireRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

**Common Mistake to Avoid:**
```typescript
// ❌ WRONG - This was the bug we fixed!
const { user, userRole } = useAuth();  // userRole is undefined
const isAdmin = userRole === 'admin';  // Always false!

// ✅ CORRECT
const { user } = useAuth();            // Only for auth state
const { isAdmin } = useUserRole();     // For role checking
```

### **Password Management**

**Fluxo Principal (Modal Direto):**
```javascript
// UserMenu.tsx
const handlePasswordChange = async (newPassword) => {
  await supabase.auth.updateUser({ password: newPassword });
  toast.success("Senha atualizada!");
};
```

**Fluxo Alternativo (Email Recovery):**
```javascript
// LoginPageNew.tsx
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://hub.jumper.studio/reset-password'
});
```

---

## 🔗 Integração Notion

### **Architecture**

```
┌─────────────────────┐
│   Notion Databases  │
│  (Single Source of  │
│      Truth)         │
└──────────┬──────────┘
           │
           │ Scheduled Sync (1h)
           │ j_ads_complete_notion_sync
           ↓
┌─────────────────────┐
│ Supabase Tables     │
│ (Synchronized)      │
│ - j_hub_notion_db_* │
└──────────┬──────────┘
           │
           │ Real-time queries
           │ (zero Notion API calls)
           ↓
┌─────────────────────┐
│  React Frontend     │
│  (hub.jumper.studio)│
└─────────────────────┘
```

### **Notion Databases**

**DB_Contas:**
- Database ID: `[notion_db_contas_id]`
- Fields: 75+ campos (nome, cliente, objetivos, métricas Meta Ads)
- Sync: A cada 1 hora

**DB_Gerentes:**
- Database ID: `[notion_db_gerentes_id]`
- Fields: nome, email, contas, tipo, permissões
- Access Control: Cross-reference via email

**DB_Parceiros:**
- Database ID: `[notion_db_parceiros_id]`
- Fields: nome, tipo, contas_ativas, contato

**DB_Criativos:**
- Database ID: `[notion_db_criativos_id]`
- Purpose: Receptor final de criativos publicados
- Created by: `j_ads_admin_actions` (publish action)

### **Data Sync Process**

**Full Sync:**
```javascript
// j_ads_complete_notion_sync/index.ts
async function syncNotionData() {
  // 1. Fetch from Notion
  const accounts = await notion.databases.query({
    database_id: NOTION_DB_CONTAS
  });

  // 2. Transform data
  const transformed = accounts.results.map(transformNotionPage);

  // 3. Upsert to Supabase
  await supabase
    .from('j_hub_notion_db_accounts')
    .upsert(transformed, { onConflict: 'notion_id' });

  return { synced: transformed.length };
}
```

**Publishing Creative:**
```javascript
// j_ads_admin_actions/index.ts (publish action)
async function publishToNotion(submission_id) {
  // 1. Fetch submission + files
  const submission = await getSubmission(submission_id);

  // 2. Create Notion page
  const notionPage = await notion.pages.create({
    parent: { database_id: NOTION_DB_CRIATIVOS },
    properties: {
      Nome: { title: [{ text: { content: submission.title } }] },
      Conta: { relation: [{ id: submission.account_id }] },
      Objetivo: { select: { name: submission.objective } },
      // ... 20+ campos
    }
  });

  // 3. Upload files to Notion (optional)
  // 4. Update submission status
  await supabase
    .from('j_ads_creative_submissions')
    .update({ status: 'published', notion_page_id: notionPage.id })
    .eq('id', submission_id);
}
```

### **Performance Optimization**

**Before (Real-time API calls):**
```
User opens page → Fetch Notion DB_Contas → 3-5s delay
```

**After (Synchronized tables):**
```
User opens page → Query Supabase table → <100ms
Background: Sync every 1h
```

**Impact:**
- ⚡ 30-50x faster page loads
- ✅ Offline capability (cached data)
- 📊 75 campos disponíveis (vs limitados)
- 🔄 Automatic sync (sem intervenção manual)

---

## 🛡️ Sistema de Resiliência

### **Retry Logic com Exponential Backoff**

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryWithBackoff(() =>
  supabase.from('table').insert(data)
);
```

### **Circuit Breaker para APIs Externas**

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }
}
```

### **Upload Transacional com Rollback**

```javascript
async function uploadFilesTransactional(files) {
  const uploadedPaths = [];

  try {
    for (const file of files) {
      const { data, error } = await supabase.storage
        .from('creative-files')
        .upload(file.path, file.blob);

      if (error) throw error;
      uploadedPaths.push(data.path);
    }

    return uploadedPaths;
  } catch (error) {
    // Rollback: Delete all uploaded files
    await Promise.all(
      uploadedPaths.map(path =>
        supabase.storage.from('creative-files').remove([path])
      )
    );

    throw error;
  }
}
```

### **Error Tracking Estruturado**

```javascript
async function logError(context, operation, error, metadata = {}) {
  await supabase.from('j_ads_error_logs').insert({
    context,
    operation,
    error_message: error.message,
    error_code: error.code,
    stack_trace: error.stack,
    severity: determineSeverity(error),
    category: categorizeError(error),
    metadata,
    user_id: getCurrentUser()?.id
  });
}

// Usage
try {
  await publishCreative(id);
} catch (error) {
  await logError('creative_publish', 'notion_api_call', error, {
    submission_id: id,
    retry_count: 3
  });
  throw error;
}
```

### **Fallback Automático**

```javascript
async function submitCreativeWithFallback(data) {
  try {
    // Try primary flow
    return await submitCreative(data);
  } catch (error) {
    // Log error
    await logError('submission', 'primary_flow', error);

    // Save to fallback table
    await supabase.from('j_ads_fallback_submissions').insert({
      submission_data: data,
      status: 'pending',
      retry_count: 0
    });

    // Return success to user (will be processed later)
    return { success: true, status: 'queued' };
  }
}
```

---

## 🔌 Supabase Integration

### **🔐 Security Audit Update (2024-11-01)**

**Previous implementation (INSECURE):**
- Had hardcoded production credentials as fallback
- `.env` file committed to git with secrets
- Relied on embedded credentials

**Current implementation (SECURE):**
- NO hardcoded credentials
- Fail-fast validation with clear error messages
- All credentials in gitignored files only

### **Conexão Client**

```javascript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables are REQUIRED - fail fast if missing
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error(
    '❌ VITE_SUPABASE_URL is not defined. ' +
    'Please set it in .env.local for development or in Vercel for production.'
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '❌ VITE_SUPABASE_ANON_KEY is not defined. ' +
    'Please set it in .env.local for development or in Vercel for production.'
  );
}

// Log which Supabase instance we're using (helps catch accidental production connections)
if (import.meta.env.DEV) {
  const isLocal = SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost');
  console.log(`🔗 Supabase: ${isLocal ? 'LOCAL' : 'PRODUCTION'} (${SUPABASE_URL})`);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

**Key Security Features:**
- ✅ Fails immediately if credentials missing (no silent fallback)
- ✅ Clear error messages guide developers to correct setup
- ✅ Development mode logs connection target (LOCAL vs PRODUCTION)
- ✅ Supports both legacy (`VITE_SUPABASE_ANON_KEY`) and new (`VITE_SUPABASE_PUBLISHABLE_KEY`) env var names

### **Métodos Testados**

**✅ CRUD Operations:**
```javascript
// Create
const { data, error } = await supabase
  .from('j_ads_error_logs')
  .insert({ context: 'test', operation: 'test' });

// Read
const { data } = await supabase
  .from('j_hub_notion_db_accounts')
  .select('*')
  .eq('notion_id', 'abc123');

// Update
await supabase
  .from('j_ads_creative_submissions')
  .update({ status: 'published' })
  .eq('id', submissionId);

// Delete
await supabase
  .from('j_ads_creative_files')
  .delete()
  .eq('submission_id', submissionId);
```

**✅ Storage Operations:**
```javascript
// Upload
const { data, error } = await supabase.storage
  .from('creative-files')
  .upload(`${accountId}/${filename}`, fileBlob);

// Download URL
const { data } = supabase.storage
  .from('creative-files')
  .getPublicUrl(filePath);

// Delete
await supabase.storage
  .from('creative-files')
  .remove([filePath]);
```

**✅ Edge Functions:**
```javascript
const { data, error } = await supabase.functions.invoke('j_ads_admin_actions', {
  body: { action: 'list', filters: {} }
});
```

**⚠️ Limitações:**
- REST API não tem endpoint SQL direto
- SQL direto apenas via Supabase SQL Editor (manual)
- Edge Functions podem executar SQL via service role
- API REST perfeita para CRUD operations

### **Edge Functions Credential Management (2024-11-01)**

**🔍 Critical Discovery:** Edge Functions cache environment variables at deployment time.

**What this means:**
- Changing credentials in Supabase Dashboard does NOT update running Edge Functions
- Edge Functions continue using OLD cached credentials until redeployed
- Disabling legacy API keys invalidates cached credentials → "Unregistered API key" errors
- **Solution:** Must redeploy ALL Edge Functions after rotating credentials

**Incident Report (2024-11-01):**

**Problem:**
- Rotated Supabase service role key in Dashboard
- Updated `supabase/functions/.env` with new key
- Frontend worked with new publishable key
- Edge Functions returned 500 errors: "Unregistered API key"

**Root Cause:**
- Edge Functions cached old service role key at deployment time
- `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` returned cached value
- Disabling legacy keys invalidated the cached credential
- New credential wasn't being used because functions weren't redeployed

**Solution:**
- Redeployed single Edge Function → It worked!
- Realized deployment forces credential reload
- Deployed ALL 19 Edge Functions → Production 100% functional

**Credential Rotation Procedure:**

```bash
# 1. Rotate credentials in Supabase Dashboard
# - Generate new service role key (sb_secret_...)
# - Generate new publishable key (sb_publishable_...)

# 2. Update environment variables
# - Vercel: VITE_SUPABASE_ANON_KEY
# - Local: supabase/functions/.env

# 3. Redeploy ALL Edge Functions (CRITICAL!)
for func in $(ls supabase/functions); do
  npx supabase functions deploy $func --project-ref biwwowendjuzvpttyrlb
done

# 4. Verify functionality
# - Test login (uses frontend publishable key)
# - Test account loading (uses Edge Function service role key)
```

**Why Redeployment Works:**
- Edge Functions read `Deno.env.get()` values from deployment-time environment
- Supabase injects secrets at deployment, not runtime
- Redeploying forces Edge Functions to reload all environment variables
- New deployment gets new credentials from Supabase secrets

**Prevention:**
- Document this behavior in credential rotation procedures
- Always redeploy Edge Functions after rotating Supabase credentials
- Test Edge Function endpoints after credential changes
- Monitor for "Unregistered API key" errors (indicates cached old credentials)

---

## 🎨 UI/UX Patterns

### **Component Architecture**

**shadcn/ui base:**
```typescript
// src/components/ui/button.tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">
  Enviar Criativo
</Button>
```

**Custom components:**
```typescript
// src/components/reports/MetricCard.tsx
interface MetricCardProps {
  label: string;
  value: string | number;
  performance?: 'excellent' | 'good' | 'warning' | 'critical';
  isHero?: boolean;
}

export function MetricCard({ label, value, performance, isHero }: MetricCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-lg",
      isHero && "bg-orange-subtle border-orange-hero",
      performance === 'excellent' && "bg-metric-excellent",
      // ...
    )}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

### **Form Validation**

```typescript
// src/components/steps/Step1.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  accountId: z.string().min(1, "Selecione uma conta"),
  objective: z.string().min(1, "Selecione um objetivo"),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { accountId: "", objective: "" }
});

<Form {...form}>
  <FormField
    control={form.control}
    name="accountId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Conta</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          {/* ... */}
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### **File Upload with Validation**

```typescript
// src/components/SingleFileUploadSection.tsx
import { useDropzone } from 'react-dropzone';
import { validateImage, validateVideo } from '@/utils/fileValidation';

const { getRootProps, getInputProps } = useDropzone({
  accept: {
    'image/*': ['.jpg', '.jpeg', '.png'],
    'video/*': ['.mp4', '.mov']
  },
  maxSize: 1024 * 1024 * 1024, // 1GB
  onDrop: async (acceptedFiles) => {
    const file = acceptedFiles[0];

    // Validate based on type
    const validation = file.type.startsWith('image/')
      ? await validateImage(file, placement)
      : await validateVideo(file, placement);

    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    onFileChange(file);
  }
});
```

### **Loading States**

```typescript
// src/components/reports/SkeletonScreen.tsx
export function SkeletonScreen() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-24 w-full animate-pulse bg-orange-muted" />
      ))}
    </div>
  );
}

// Usage
{isLoading ? <SkeletonScreen /> : <DashboardContent data={data} />}
```

### **Responsive Design Patterns**

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <MetricCard label="ROAS" value="3.2x" />
  <MetricCard label="CPA" value="R$ 85" />
  <MetricCard label="CTR" value="2.1%" />
</div>

// Progressive disclosure
<div className="block lg:hidden">
  {/* Mobile-only simplified view */}
</div>
<div className="hidden lg:block">
  {/* Desktop detailed view */}
</div>
```

---

## ⚡ Performance

### **Bundle Optimization**

**Initial Bundle:** ~70KB (gzipped)

**Techniques:**
```javascript
// Code splitting via lazy loading
const AdminPage = lazy(() => import('./pages/Admin'));
const ReportsPage = lazy(() => import('./pages/Reports'));

<Suspense fallback={<LoadingScreen />}>
  <Route path="/admin" element={<AdminPage />} />
</Suspense>
```

### **Image Optimization**

```typescript
// src/components/LazyImage.tsx
export function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
```

### **Data Fetching**

**React Query caching:**
```typescript
// src/hooks/useMyNotionAccounts.ts
export function useMyNotionAccounts() {
  return useQuery({
    queryKey: ['my-notion-accounts'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('j_ads_my_accounts_complete');
      return data.accounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Performance Metrics:**
- ✅ Synchronized tables: <100ms queries (vs 3-5s Notion API)
- ✅ Zero real-time API calls durante navegação
- ✅ Offline capability com dados cached
- ✅ Lazy loading reduz initial bundle

---

## 🎯 Optimization Creation Flow (v2.1)

**Release Date:** October 28, 2025

### **Overview**

Complete redesign of the optimization creation process with date range selection and draft management.

### **New Route: `/optimization/new`**

**User Flow:**
1. Select account (required dropdown)
2. Select analysis period (Facebook-style date picker)
3. Edit account context (optional, modal)
4. Record/Upload audio
5. Auto-transcription triggers
6. Toast notification with "Continue editing" button
7. Navigate to editor or return later

**Key Features:**
- ✅ Account selector with search
- ✅ Date range picker (predefinições + dual calendar)
- ✅ Context editor with preview and last-used suggestion
- ✅ Auto-save drafts (30s debounce)
- ✅ Draft recovery modal on revisit
- ✅ Breadcrumb navigation

### **Components Created**

**1. DateRangePicker** (`src/components/optimization/DateRangePicker.tsx`)
- Facebook-inspired UI (predefinições + calendário duplo)
- Predefinições: Hoje, Ontem, Últimos 7/14/28 dias, Esta semana, etc.
- Optional "Comparar" mode for second date range
- Timezone display (Horário de São Paulo)

**2. useDraftManager** (`src/hooks/useDraftManager.ts`)
- Auto-save every 30 seconds
- localStorage-based (`optimization_draft_{userId}`)
- Draft expiration (7 days)
- beforeunload detection
- Recovery modal on page load

**3. ContextEditor Enhanced** (`src/components/optimization/ContextEditor.tsx`)
- Auto-resize textarea
- Character/word counter
- "Load last used context" button
- Optional preview tab showing how context appears in AI prompt
- Backward compatible (optional props)

### **Database Changes**

**Migration:** `20251028093000_add_date_range_to_optimization_recordings.sql`

**New Fields in `j_hub_optimization_recordings`:**
```sql
date_range_start TIMESTAMP WITH TIME ZONE  -- Period start
date_range_end TIMESTAMP WITH TIME ZONE    -- Period end
is_draft BOOLEAN DEFAULT FALSE             -- Draft status
draft_data JSONB                          -- Temporary draft data
```

**Indexes:**
```sql
idx_optimization_recordings_drafts (recorded_by, is_draft) WHERE is_draft = TRUE
idx_optimization_recordings_date_range (account_id, date_range_start, date_range_end)
```

**Constraint:**
```sql
CHECK (date_range_start IS NULL OR date_range_end IS NULL OR date_range_end >= date_range_start)
```

### **Modified Components**

**OptimizationRecorder** (`src/components/OptimizationRecorder.tsx`)
- New prop: `dateRange?: { start: Date; end: Date }`
- Sends `date_range_start/end` to database on upload
- Shows selected period in confirmation

**Optimization Panel** (`src/pages/Optimization.tsx`)
- New button "Nova Otimização" in header
- Navigates to `/optimization/new`

### **Usage Example**

```typescript
// In OptimizationNew.tsx
<OptimizationRecorder
  accountId={selectedAccountId}
  accountName={selectedAccountName}
  accountContext={accountContext}
  dateRange={{ start: new Date('2024-10-15'), end: new Date('2024-10-22') }}
  onUploadComplete={() => {
    clearDraft();
    navigate('/optimization');
  }}
/>
```

### **Technical Decisions**

**Why Facebook-style date picker?**
- User familiarity (managers already use Meta Ads Manager)
- Clear predefinições reduce clicks
- Dual calendar shows context (current + next month)

**Why auto-save drafts?**
- Prevent loss of work (common pain point)
- Enable "pause and resume" workflow
- 7-day expiration balances utility vs storage

**Why optional dateRange prop?**
- Backward compatibility with existing code
- Allows gradual migration
- NULL values permitted in database

### **Future Enhancements (Post v2.1)**

- [ ] Fetch last-used context from Supabase (not just localStorage)
- [ ] Show date range in optimization cards (panel view)
- [ ] Filter optimizations by date range
- [ ] Export optimization with period context for reports
- [ ] Integrate with REPORTS branch for period comparisons

---

## 🎨 Decks System - HTML Presentation Generation

### **Overview**

AI-powered presentation system that generates branded HTML slides from Markdown using Claude Sonnet 4.5.

**Key Components:**
- **Generation:** Edge Function calls Claude API with design system + templates
- **Storage:** HTML files in Supabase Storage + database cache
- **Rendering:** iframe with srcDoc (NOT Storage URLs)
- **Sharing:** Public URLs with optional password protection

---

### **⚠️ CRITICAL: Deck Rendering Pattern**

> **Decision Date:** 2024-11-05
> **Context:** HTMLs served from Supabase Storage have CSP/sandbox restrictions that block rendering

**ALWAYS use this rendering priority:**

```typescript
// ✅ CORRECT: srcDoc first, file_url fallback
{deck.html_output ? (
  <iframe srcDoc={deck.html_output} />  // PRIORITY 1
) : deck.file_url ? (
  <iframe src={deck.file_url} />        // FALLBACK
) : null}
```

**❌ NEVER use file_url (Storage URL) as first option:**
```typescript
// ❌ WRONG: Storage URLs have CSP that blocks rendering
{deck.file_url ? (
  <iframe src={deck.file_url} />  // Broken - shows HTML source code
) : null}
```

**Why srcDoc works:**
- Uses parent page security context (bypasses Storage CSP)
- Inline HTML execution allowed
- Assets with absolute URLs load correctly
- No sandbox restrictions from Storage domain

**Why Storage URLs don't work:**
- Storage serves with `Content-Security-Policy: default-src 'none'`
- Sandbox attribute blocks scripts and same-origin access
- Inline styles/scripts blocked
- External fonts/images/gradients blocked
- Result: HTML source code displayed as text

---

### **Asset URLs Pattern**

**CRITICAL:** All asset URLs in generated HTML must be ABSOLUTE.

**✅ CORRECT (absolute URLs):**
```css
@font-face {
  src: url('https://hub.jumper.studio/decks/identities/jumper/fonts/HafferVF.ttf');
}
```

```html
<img src="https://hub.jumper.studio/decks/identities/jumper/logos/jumper-white.png">
```

**❌ WRONG (relative paths):**
```css
@font-face {
  src: url('/decks/identities/jumper/fonts/HafferVF.ttf');
  /* ❌ Resolves to supabase.co/decks/... (404) */
}
```

**Implementation:**
- Edge Function `j_hub_deck_generate` includes absolute URLs in Claude prompt
- Claude instructed to NEVER use relative paths
- Assets hosted on Vercel (`public/decks/identities/`)
- HTMLs in Supabase Storage reference Vercel assets

**Trade-off:**
- ✅ Assets always load (cross-origin works with CORS)
- ❌ HTMLs hardcoded to production domain
- ❌ Won't work in local/staging without URL adjustment

---

### **Components Using Decks**

**1. DeckEditor.tsx** (`/decks/:id`)
- Preview inline with srcDoc ✅
- Button "Ver em Tela Cheia" → opens `/decks/:id/preview`
- Removed: "Visualizar" and "Abrir em nova aba" (redundant)

**2. DeckPreview.tsx** (`/decks/:id/preview`)
- Full-screen preview (no UI, just deck)
- srcDoc rendering ✅
- Opens in new tab for presentations

**3. SharedDeck.tsx** (`/decks/share/:slug`)
- Public sharing with optional password
- srcDoc rendering ✅
- No authentication required (Edge Function validates access)

**All three components:**
- Use srcDoc as primary rendering method
- Have file_url fallback for compatibility
- Include sandbox attributes: `allow-scripts allow-same-origin allow-forms`

---

### **Edge Functions**

**j_hub_deck_generate:**
- Generates HTML from Markdown via Claude Sonnet 4.5
- **Critical fix (v2.1.2):** Prompt instructs absolute URLs for assets
- **Critical fix (v2.1.3):** Single TextDecoder declaration (no duplicates)
- Uploads HTML to Storage with UTF-8 encoding
- Saves html_output to database for srcDoc rendering

**j_hub_deck_create_share:**
- Creates public slug for deck
- Optional password protection (Web Crypto API - PBKDF2)
- **CRITICAL:** Uses native Web Crypto API (NOT bcrypt - see note below)

**j_hub_deck_view_shared:**
- Validates password for protected decks
- Returns deck data (html_output + metadata)
- Does NOT serve HTML directly (returns JSON)
- **CRITICAL:** Uses native Web Crypto API (NOT bcrypt - see note below)

**⚠️ CRITICAL: Password Hashing in Edge Runtime**

> **Issue Date:** 2024-11-05
> **Version Fixed:** v2.1.7

**Problem:** ALL bcrypt versions (v0.2.4, v0.4.1, etc.) use Deno Workers, which are NOT available in Supabase Edge Runtime.

**Error encountered (both versions):**
```
ReferenceError: Worker is not defined
    at Module.hash (bcrypt@v0.2.4/src/main.ts:11:16)
```

**FAILED Solution (v2.1.6):** Tried downgrading to bcrypt@v0.2.4 → Still used Workers!

**WORKING Solution (v2.1.7):** Use Web Crypto API natively available in Edge Runtime.

```typescript
// ✅ CORRECT: Native Web Crypto API (100% compatible)
import { hashPassword, verifyPassword } from '../_shared/crypto.ts';

// Hash password (creates salt + PBKDF2 hash)
const passwordHash = await hashPassword(password);

// Verify password (rehash + compare)
const isValid = await verifyPassword(password, passwordHash);
```

**Implementation (`_shared/crypto.ts`):**
- Algorithm: PBKDF2 with SHA-256
- Iterations: 100,000 (OWASP recommended)
- Salt: 16 bytes (randomly generated)
- Hash: 32 bytes
- Format: `base64(salt):base64(hash)`
- Zero dependencies, pure Web Standards

**❌ NEVER use bcrypt in Edge Functions:**
```typescript
// ❌ WRONG: ALL bcrypt versions use Workers
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"; // ✗ Uses Workers
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts"; // ✗ ALSO uses Workers!
```

**Applies to:**
- `j_hub_deck_create_share/index.ts`
- `j_hub_deck_view_shared/index.ts`
- `_shared/crypto.ts` (new shared utility)
- Any future Edge Functions requiring password hashing

---

### **Database Schema**

**j_hub_decks:**
```sql
CREATE TABLE j_hub_decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES j_hub_users(id),
  account_id TEXT REFERENCES j_hub_notion_db_accounts(notion_id),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('report', 'plan', 'pitch')),
  brand_identity TEXT CHECK (brand_identity IN ('jumper', 'koko')),
  template_id TEXT NOT NULL,
  markdown_source TEXT,
  html_output TEXT,      -- ⭐ Used for srcDoc rendering
  file_url TEXT,         -- Storage URL (fallback only)
  slug TEXT UNIQUE,      -- Public sharing slug
  is_public BOOLEAN DEFAULT false,
  password_hash TEXT,    -- bcrypt hash for protected decks
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Storage Bucket:**
- Name: `decks`
- Public: Yes
- Path: `{user_id}/{deck_id}.html`
- Content-Type: `text/html; charset=utf-8`
- Usage: Backup/download only (not for rendering)

---

### **Design System Structure**

**Location:** `public/decks/identities/{brand}/`

**Files per brand identity:**
```
identities/jumper/
├── design-system.md       # Complete design rules (markdown)
├── fonts/
│   └── HafferVF.ttf      # Variable font
├── gradients/
│   ├── organic-01.png    # Background gradients (6 variations)
│   └── ...
└── logos/
    ├── jumper-white.png  # Logo variations (4 files)
    └── ...
```

**Templates:** `public/decks/examples/`
- 33 HTML templates (Apple-inspired layouts)
- Used as inspiration by Claude (structure patterns)
- Not directly copied (Claude generates custom HTML)

**Upload to Storage:**
- Templates and design systems uploaded to Storage bucket
- Edge Function fetches from Storage during generation
- Claude reads templates + design system to generate custom HTML

---

### **Version History**

**v2.1.5 (2024-11-05):**
- Added full-screen preview with dedicated route `/decks/:id/preview`
- Removed redundant buttons ("Visualizar", "Abrir em nova aba")
- Created DeckPreview.tsx component

**v2.1.4 (2024-11-05):**
- **CRITICAL:** Fixed rendering by inverting priority (srcDoc > file_url)
- Updated DeckEditor and SharedDeck components
- Root cause: Storage URLs have CSP restrictions

**v2.1.3 (2024-11-05):**
- **CRITICAL:** Fixed Edge Function boot failure (duplicate TextDecoder)
- Consolidated 4 declarations into single shared instance

**v2.1.2 (2024-11-05):**
- **CRITICAL:** Changed assets to absolute URLs in generated HTML
- Updated Claude prompt to NEVER use relative paths
- Fixes cross-origin asset loading issues

**v2.0.70 (2024-11-03):**
- Initial Decks system integration
- Edge Functions, components, and database schema created

---

### **Common Pitfalls**

**❌ Using Storage URLs for rendering:**
```typescript
<iframe src={deck.file_url} />  // Shows HTML source code
```

**✅ Use srcDoc instead:**
```typescript
<iframe srcDoc={deck.html_output} />  // Renders correctly
```

---

**❌ Relative asset paths in HTML:**
```html
<img src="/decks/identities/jumper/logos/logo.png">
<!-- Resolves to supabase.co/decks/... (404) -->
```

**✅ Absolute URLs:**
```html
<img src="https://hub.jumper.studio/decks/identities/jumper/logos/logo.png">
<!-- Works correctly -->
```

---

**❌ Multiple TextDecoder declarations:**
```typescript
const decoder = new TextDecoder('utf-8');  // Line 32
// ...
const decoder = new TextDecoder('utf-8');  // Line 112 - ERROR!
```

**✅ Single shared decoder:**
```typescript
const decoder = new TextDecoder('utf-8');  // Declare once at top
// ... reuse throughout function
```

---

**Last Updated**: 2024-11-05
**Maintained by**: Claude Code Assistant
