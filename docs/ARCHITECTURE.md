# Architecture - Detalhes Técnicos

> 📖 Documentação técnica aprofundada do Jumper Ads Platform

---

## 📑 Índice

1. [User Management System](#-user-management-system) ⭐ **NOVO**
2. [Estrutura de Pastas](#-estrutura-de-pastas)
3. [Database Schema](#-database-schema)
4. [Edge Functions](#-edge-functions)
5. [Autenticação e Permissões](#-autenticação-e-permissões)
6. [Integração Notion](#-integração-notion)
7. [Sistema de Resiliência](#-sistema-de-resiliência)
8. [Supabase Integration](#-supabase-integration)
9. [UI/UX Patterns](#-uiux-patterns)
10. [Performance](#-performance)

---

## 👥 User Management System

> ⚠️ **CRITICAL:** `j_ads_users` is the PRIMARY table for all user data and roles
> ❌ **DEPRECATED:** `user_roles` and `j_ads_user_roles` - DO NOT USE

### **`j_ads_users` - Single Source of Truth**

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
| `notion_manager_id` | UUID | | Links to `j_ads_notion_db_managers.notion_id` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update |
| `last_login_at` | TIMESTAMPTZ | | Last login timestamp |

**Indexes:**
```sql
CREATE INDEX idx_j_ads_users_email ON j_ads_users(email);
CREATE INDEX idx_j_ads_users_role ON j_ads_users(role);
CREATE INDEX idx_j_ads_users_notion_manager_id ON j_ads_users(notion_manager_id);
```

### **Roles & Access Levels**

| Role | Description | Users | Access |
|------|-------------|-------|--------|
| `admin` | System administrators | bruno@jumper.studio | ALL accounts (unrestricted) |
| `staff` | Traffic managers (Gestores) | pedro@jumper.studio | Accounts where assigned as Gestor/Supervisor |
| `client` | Client managers (Gerentes) | External users | Accounts where assigned as Gerente (via notion_manager_id) |

### **User Lookup Strategy**

```typescript
// Check user role
SELECT role FROM j_ads_users WHERE id = <auth.uid()>;

// Get user's accessible accounts (admin)
IF role = 'admin':
  SELECT * FROM j_ads_notion_db_accounts; // ALL accounts

// Get user's accessible accounts (staff - OAuth)
IF role = 'staff':
  SELECT * FROM j_ads_notion_db_accounts
  WHERE "Gestor" ILIKE '%' || (SELECT email FROM j_ads_users WHERE id = <auth.uid()>) || '%'
     OR "Supervisor" ILIKE '%' || (SELECT email FROM j_ads_users WHERE id = <auth.uid()>) || '%';

// Get user's accessible accounts (client)
IF role = 'client':
  SELECT a.* FROM j_ads_notion_db_accounts a
  JOIN j_ads_users u ON a."Gerente" ILIKE '%' || u.notion_manager_id || '%'
  WHERE u.id = <auth.uid()>;
```

### **Name Resolution**

Names are resolved using this priority order:

1. **`j_ads_users.nome`** (cached from OAuth or Notion) ⭐ PRIMARY
2. **`auth.users.user_metadata.full_name`** (OAuth users)
3. **`j_ads_notion_db_managers."Nome"`** (Client users)
4. **Email fallback** (last resort)

### **⚠️ DEPRECATED Tables**

**DO NOT USE these tables in new code:**

- ❌ **`user_roles`** - Deleted 2025-10-09 (replaced by `j_ads_users.role`)
- ❌ **`j_ads_user_roles`** - Never existed in production
- ❌ Any code referencing these tables MUST be updated to use `j_ads_users`

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

#### `j_ads_notion_db_managers`
Gestores completos sincronizados (10 campos)
```sql
CREATE TABLE j_ads_notion_db_managers (
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

#### `j_ads_notion_db_accounts`
Contas completas sincronizadas (75 campos)
```sql
CREATE TABLE j_ads_notion_db_accounts (
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

#### `j_ads_notion_db_partners`
Parceiros sincronizados
```sql
CREATE TABLE j_ads_notion_db_partners (
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

- `j_ads_notion_managers` - Substituída por `j_ads_notion_db_managers`
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
2. SELECT * FROM j_ads_notion_db_managers WHERE email = user.email
3. Parse manager.contas → ['id1', 'id2', 'id3']
4. SELECT * FROM j_ads_notion_db_accounts WHERE notion_id IN (ids)
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

**Protected Routes:**
```typescript
// src/components/ProtectedRoute.tsx
import { useUserRole } from '@/hooks/useUserRole';

<ProtectedRoute requireRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// useUserRole implementation
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Query j_ads_users for role
    supabase
      .from('j_ads_users')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setRole(data?.role || null));
  }, [user?.id]);

  return { role, isAdmin: role === 'admin', isStaff: role === 'staff' };
}
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
  redirectTo: 'https://ads.jumper.studio/reset-password'
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
│ - j_ads_notion_db_* │
└──────────┬──────────┘
           │
           │ Real-time queries
           │ (zero Notion API calls)
           ↓
┌─────────────────────┐
│  React Frontend     │
│  (ads.jumper.studio)│
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
    .from('j_ads_notion_db_accounts')
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

### **Conexão Client**

```javascript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### **Métodos Testados**

**✅ CRUD Operations:**
```javascript
// Create
const { data, error } = await supabase
  .from('j_ads_error_logs')
  .insert({ context: 'test', operation: 'test' });

// Read
const { data } = await supabase
  .from('j_ads_notion_db_accounts')
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

**Last Updated**: 2024-10-07
**Maintained by**: Claude Code Assistant
