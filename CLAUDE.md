# Jumper Creative Flow - Claude Configuration

> **📖 Documentação Completa:**
> - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detalhes técnicos aprofundados
> - [CHANGELOG.md](docs/CHANGELOG.md) - Histórico completo de sessões de desenvolvimento

---

## 📋 Project Overview

### **Jumper Ads Platform - Briefing Estratégico**

**🎯 OBJETIVO PRINCIPAL:** TORNAR-SE O HUB COMPLETO de gestores de tráfego, gerentes parceiros e clientes finais da Jumper Studio para **democratizar serviços de tráfego pago**.

**📍 Missão Atual:** Sistema de criativos ✅ + Sistema resiliente ✅ + 9 Dashboards ✅ + **Decks System (Apresentações IA)** ✅
**🚀 Visão Futura:** Plataforma self-service que reduz trabalho operacional e permite preços mais baixos

---

## 👥 Usuários do Sistema

1. **👑 Administrador (5%)** - Desenvolvedores, debugging, acesso total
2. **⚡ Gestor (10%)** - Gestores de tráfego Jumper, edição/publicação, otimizações
3. **👥 Supervisor (15%)** - Diretores de agências parceiras, supervisão de contas
4. **📝 Gerente (70%)** - Gerentes de marketing, upload de criativos, acompanhamento

---

## 🔄 Fases de Desenvolvimento

**✅ FASE 1 (COMPLETA - Set/2024):**
- Upload e validação de criativos
- Sistema resiliente à prova de falhas
- Deploy em produção (hub.jumper.studio)
- Gestão completa de senhas
- Migração para arquitetura sincronizada
- Performance otimizada - Zero API calls em tempo real
- 9 Dashboards específicos por objetivo
- Performance indicators com cores (excellent/good/warning/critical)
- Design system Jumper aplicado
- Mobile-first responsive

**✅ FASE 2 v2.1 (COMPLETA - Nov/2024):**
- ✅ Nova página `/optimization/new` - Fluxo completo de criação
- ✅ Seletor de período estilo Facebook (predefinições + calendário duplo)
- ✅ Auto-save de rascunhos (localStorage + recovery modal)
- ✅ ContextEditor aprimorado (contador, preview, último contexto)
- ✅ Database: campos `date_range_start/end`, `is_draft`, `draft_data`
- ✅ OptimizationRecorder integrado com seleção de período
- ✅ **Decks System** - Geração de apresentações HTML com IA
- ✅ Password-protected sharing com Web Crypto API
- ✅ Anonymous browser access (--no-verify-jwt)
- ✅ Full-screen preview e compartilhamento público

**🔄 FASE 2 (EM PLANEJAMENTO - Nov/2024):**
- Sistema de Insights Comparativos (REPORTS branch)
- Detecção de anomalias automática
- Alertas em tempo real

**💎 FASE 3 (1-2 anos):**
- Multi-plataforma ads (Meta, Google, TikTok, LinkedIn)
- Plataforma self-service completa
- Escala nacional/global

---

## 🔗 Ecossistema de Integrações

```
Jumper Ads (hub.jumper.studio)
    ↕️
NOTION (Hub Central - Single Source of Truth)
    ├── DB_Contas (clientes e objetivos)
    ├── DB_Gerentes (permissões e filtros)
    ├── DB_Parceiros (fornecedores)
    └── DB_Criativos (receptor final)
    ↕️
SUPABASE (Backend + Storage)
    ├── Tabelas Sincronizadas (j_hub_notion_db_*)
    ├── Edge Functions (j_ads_*)
    └── Storage (criativos + áudios)
    ↕️
PLATAFORMAS DE ADS (Futuro):
    ├── Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads
```

---

## 🏗️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui design system
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **Hosting**: Vercel (Production: hub.jumper.studio)
- **Integration**: Notion API para gestão de clientes
- **State Management**: React Query (@tanstack/react-query)

---

## 🛠️ Local Development Setup

**⚠️ RECOMMENDED: Use scripts in `localdev/` directory (tested and reliable)**

### **Quick Start (Recommended)**

```bash
# Interactive menu with all options
./localdev.sh

# Choose scripts to run:
# - Type numbers: 1 2 4
# - Or: all
```

### **Available Scripts**

**1. Validate Environment** (`1-validate-env.sh`)
- Checks: Docker, PostgreSQL tools, Node.js, Supabase CLI
- Validates configurations and required dependencies

**2. Backup Production** (`2-backup-production.sh`)
- Creates backup from production database
- Requests password interactively (never stored)
- Reuses recent backups (<24h) when possible

**3. Complete Setup** (`3-setup-local-env.sh`)
- **7 automated steps:**
  1. Create/reuse production backup
  2. Start Supabase local instance
  3. Reset database (apply migrations)
  4. Restore production data
  5. Set development password (senha123)
  6. Install npm dependencies
  7. Start development server

**4. Quick Reset** (`4-quick-reset.sh`)
- Fast reset workflow:
  - Clear local data
  - Reapply migrations
  - Restore from backup
- Use when local data gets corrupted

### **Recommended Workflows**

**First time setup:**
```bash
./localdev.sh
# Choose: all
```

**Daily development (corrupted data):**
```bash
./localdev/4-quick-reset.sh
```

**After migration changes:**
```bash
./localdev/3-setup-local-env.sh
```

### **Local Credentials**

**Development Login:**
- Email: `bruno@jumper.studio`
- Password: `senha123`

**Local Endpoints:**
- Frontend: http://localhost:8080
- Supabase Studio: http://127.0.0.1:54323
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Edge Functions: http://127.0.0.1:54321/functions/v1/

### **Visual Features**

All scripts include:
- ✅ Color-coded status (green=success, red=error, yellow=warning)
- 📊 Emoji indicators for context
- 🔍 Visual separators between sections
- ⏳ Progress indicators

### **Troubleshooting**

See `localdev/README.md` for complete troubleshooting guide.

**Common issues:**
- Docker not running → Open Docker Desktop
- Port 8080 occupied → Scripts will ask to kill process
- Backup failed → Check production password and network
- Restore incomplete → Run full setup (script 3)

---

## ⚠️ CRITICAL: Account Access Pattern

**🚨 MANDATORY RULE: Always use standardized functions to fetch user-accessible accounts**

### **The Pattern**

**Backend:** `j_hub_user_accounts` Edge Function
- Single source of truth for account access logic
- Handles all permission rules (admin/staff/client)
- Returns accounts with full Notion data

**Frontend:** `useMyNotionAccounts` Hook
- Standardized React Hook for account access
- Fetches from `j_hub_user_accounts` Edge Function
- Provides loading states and error handling

### **Why This Pattern is Critical**

**❌ DON'T do this:**
```typescript
// Direct Supabase query - WRONG!
const { data } = await supabase
  .from('j_hub_notion_db_accounts')
  .select('*'); // ⚠️ Bypasses permission logic!
```

**✅ DO this instead:**
```typescript
// Use standardized hook - CORRECT
const { accounts, loading, error } = useMyNotionAccounts();
```

### **What Gets Filtered Automatically**

The Edge Function applies these rules:
- **Admin:** ALL accounts (unrestricted access)
- **Staff:** Accounts where user is Gestor or Supervisor
- **Client:** Accounts where user is Gerente (via notion_manager_id)

### **Where to Use**

**Every page that needs accounts:**
- ✅ `/optimization` - OptimizationsPanelList
- ✅ `/optimization/new` - OptimizationNew
- ✅ `/decks` - DecksPanelList
- ✅ `/decks/new` - DeckConfigForm
- ✅ `/my-accounts` - MyAccounts
- ✅ Any future feature that lists/filters accounts

### **Components**

**PrioritizedAccountSelect:**
- Built on top of `useMyNotionAccounts`
- Provides consistent account selection UI
- Prioritizes accounts by role (Gestor → Supervisor → Gerente → Admin)
- Handles "All accounts" option
- Supports "Show Inactive" toggle (admin only)

**Usage Example:**
```typescript
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";

function MyComponent() {
  const { accounts, loading } = useMyNotionAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState("");

  return (
    <PrioritizedAccountSelect
      accounts={accounts}
      loading={loading}
      value={selectedAccountId}
      onChange={setSelectedAccountId}
      userEmail={currentUser?.email}
      userRole={userRole}
      placeholder="Selecione uma conta"
    />
  );
}
```

### **Dual ID System Awareness**

**CRITICAL:** When using selected account, extract correct ID format:

```typescript
// For MODERN tables (j_hub_decks) - use UUID
const handleAccountChange = (accountId: string) => {
  setSelectedAccountId(accountId); // ✅ UUID for modern tables
};

// For LEGACY tables (j_hub_optimization_recordings) - use notion_id
const handleAccountChange = (accountId: string) => {
  const account = accounts.find(a => a.id === accountId);
  setSelectedAccountId(account.notion_id); // ✅ TEXT for legacy tables
};
```

**See:** `docs/ARCHITECTURE.md` - "Dual ID System" section for complete details.

---

## 📊 Decks System (Presentation Generation)

**Status:** ✅ Fully functional (v2.1.11, 2024-11-05)

### **Overview**

AI-powered presentation generation system using Claude Sonnet 4.5. Generates branded HTML presentations from Markdown content.

**🔧 Latest Fixes (v2.1.5 - v2.1.11):**
- ✅ Full-screen preview with dedicated route
- ✅ Password protection with Web Crypto API (PBKDF2)
- ✅ Anonymous browser access working
- ✅ Rendering via srcDoc (bypasses Storage CSP)
- ✅ Assets with absolute URLs

### **Features**

**Generation:**
- Markdown → HTML conversion via AI
- Template system (Apple-minimal inspired)
- Brand identities (Jumper/Koko)
- Multiple deck types (Report/Plan/Pitch)
- Assets with absolute URLs (https://hub.jumper.studio/decks/...)

**Sharing:**
- Public URLs with optional password protection
- Custom slugs for branded links
- PBKDF2 password hashing (Web Crypto API, 100k iterations)

**Storage:**
- HTML files in Supabase Storage
- Full metadata in `j_hub_decks` table
- Account-based organization

### **Key Components**

**Backend (Edge Functions):**
- `j_hub_deck_generate` - AI generation with Claude
- `j_hub_deck_create_share` - Public sharing
- `j_hub_deck_view_shared` - Password-protected viewing

**Frontend (Pages):**
- `/decks` - Panel view with filters (type, identity, search)
- `/decks/new` - Creation form with Markdown editor
- `/decks/:id` - Viewer with iframe preview + full-screen button
- `/decks/:id/preview` - Full-screen preview (no UI distractions)
- `/decks/share/:slug` - Public view (no auth required)

**Frontend (Components):**
- `DecksPanelList` - List/grid view with account filter
- `DeckConfigForm` - Form with tabs (Config/Content)
- `DeckCard` - Card with badges and metadata
- `DeckShareModal` - Share dialog with password

**Frontend (Hooks):**
- `useMyDecks` - Fetch decks with RLS filtering
- `useDeckGeneration` - Generation workflow with progress

### **Permissions**

- **View:** All users see decks from accessible accounts
- **Create:** Only Admin and Staff can create
- **Edit:** Staff edit decks from managed accounts, Clients only own
- **Delete:** Only Admins can delete

### **Templates**

**Available:**
- `moldura-minuto` - Monthly report template (Jumper branding)
- `plan-template` - Strategic planning (coming soon)
- `pitch-template` - Pitch presentations (coming soon)

**Design Systems:**
- `jumper` - Orange gradient, modern sans-serif
- `koko` - Purple palette, creative style

### **Account Integration**

**Uses standardized pattern:**
```typescript
// ✅ CORRECT: Uses useMyNotionAccounts + PrioritizedAccountSelect
const { accounts, loading } = useMyNotionAccounts();

<PrioritizedAccountSelect
  accounts={accounts}
  loading={loading}
  value={field.value}
  onChange={field.onChange}
  // ... other props
/>
```

**Account filtering:**
- Panel view: Optional filter by account
- Creation form: Required account selection
- RLS policies: Automatic filtering by accessible accounts

### **⚠️ Critical Implementation Notes**

**1. Rendering Pattern (MUST USE):**
```typescript
// ✅ CORRECT: srcDoc bypasses Storage CSP
{deck.html_output ? (
  <iframe srcDoc={deck.html_output} />  // PRIORITY 1
) : deck.file_url ? (
  <iframe src={deck.file_url} />        // FALLBACK
) : null}

// ❌ WRONG: Storage URLs show HTML source code
{deck.file_url ? <iframe src={deck.file_url} /> : null}
```

**2. Password Hashing (MUST USE Web Crypto API):**
```typescript
// ✅ CORRECT: Edge Runtime compatible
import { hashPassword, verifyPassword } from '../_shared/crypto.ts';

// ❌ WRONG: ALL bcrypt versions use Workers (not available)
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
```

**3. Anonymous Access (MUST USE --no-verify-jwt):**
```bash
# ✅ CORRECT: Allows anonymous browser access
npx supabase functions deploy j_hub_deck_view_shared --no-verify-jwt --project-ref PROJECT_REF

# ❌ WRONG: Returns 401 for anonymous users
npx supabase functions deploy j_hub_deck_view_shared --project-ref PROJECT_REF
```

**4. Public Edge Functions (MUST USE direct fetch):**
```typescript
// ✅ CORRECT: Works for anonymous users
const response = await fetch(`${SUPABASE_URL}/functions/v1/j_hub_deck_view_shared`, {
  headers: { 'apikey': SUPABASE_ANON_KEY }
});

// ❌ WRONG: Auto-injects Authorization header (fails for anonymous)
const { data } = await supabase.functions.invoke("j_hub_deck_view_shared");
```

**See:** `docs/ARCHITECTURE.md` - "Decks System" section for complete technical details and troubleshooting.

### **Usage Example**

```typescript
// Creating a deck
const { generateDeck, isGenerating, progress } = useDeckGeneration();

await generateDeck({
  title: "Relatório Outubro 2024",
  markdown_source: "# Slide 1\n\nContent...",
  type: "report",
  brand_identity: "jumper",
  template_id: "moldura-minuto",
  account_id: selectedAccountId, // ✅ UUID (modern table)
});
```

**See:** `docs/ARCHITECTURE.md` - "Decks System" section for technical details.

---

## 🔧 Essential Commands

```bash
# Development
npm run dev                 # Start dev server (port 8080/8081)

# Code Quality
npm run lint               # ESLint validation
npm run typecheck          # TypeScript type checking
npm run build             # Production build

# Deploy
npm run deploy            # Deploy to Vercel production
npm run deploy:preview    # Deploy preview to Vercel
```

### Pre-commit Checklist
1. `npm run lint`
2. `npm run typecheck`
3. Test core functionality in browser
4. **For significant releases:** Update version in `src/config/version.ts`

---

## 📦 Versioning

**Location:** `src/config/version.ts`

**Current Version:** v2.0.1

### Semantic Versioning Policy

Following **MAJOR.MINOR.PATCH** format:

- **PATCH (2.0.N)**: **Auto-incremented by Claude on EVERY commit**
  - Bug fixes, minor improvements
  - Code refactoring, documentation updates
  - **Claude has autonomy to increment**

- **MINOR (2.N.0)**: **User-signaled only**
  - New features, backward compatible
  - Significant enhancements
  - **User must explicitly request bump**

- **MAJOR (N.0.0)**: **User-signaled only**
  - Breaking changes
  - Major architecture changes
  - **User must explicitly request bump**

### Claude's Auto-Increment Process

**On every commit, Claude automatically:**

1. **Increment PATCH version:**
   ```typescript
   // v2.0.1 → v2.0.2
   export const APP_VERSION = 'v2.0.2';
   ```

2. **Add entry to version history:**
   ```typescript
   /**
    * - v2.0.2 (2024-10-14):
    *   - Brief description of changes in this commit
    */
   ```

3. **Include version in commit message:**
   ```bash
   git commit -m "feat: Add new feature (v2.0.2)"
   ```

### User-Signaled Version Bumps

**When user says "bump to 2.1" or "major release":**

```typescript
// MINOR bump: 2.0.5 → 2.1.0
export const APP_VERSION = 'v2.1.0';

// MAJOR bump: 2.5.3 → 3.0.0
export const APP_VERSION = 'v3.0.0';
```

**Note:** Version appears in:
- Login page footer
- Header logo area
- Automatically synced from `src/config/version.ts`

---

## ⚠️ CRITICAL: Environment Variables and Credential Security

**🚨 UPDATED 2024-11-01: Secure credential management with fail-fast validation**

### **🔐 Security Audit Findings (2024-11-01)**

**What happened:** Security audit discovered exposed credentials in public GitHub repository:
- `.env` file was committed to git with production secrets
- `client.ts` had hardcoded credential fallbacks
- Legacy test files contained old API keys

**Actions taken:**
- ✅ Removed `.env` from git tracking (now gitignored)
- ✅ Removed all hardcoded credential fallbacks from code
- ✅ Rotated ALL Supabase API keys (service role + publishable key)
- ✅ Migrated to new Publishable Key format (`sb_publishable_...`)
- ✅ Implemented fail-fast validation (app crashes if credentials missing)
- ✅ Updated all Edge Functions to use new credentials (required redeploy)

**Key discovery:** Edge Functions cache environment variables at deployment time. Rotating credentials requires redeploying ALL Edge Functions.

### **Environment Files Structure**

```
.env.example               → Template (committed to git, no real values)
.env.local                 → Frontend local override (gitignored, REQUIRED for dev)
supabase/.env              → Source of truth for API keys (gitignored, REQUIRED)
supabase/functions/.env    → Edge Functions environment (gitignored, REQUIRED!)
```

**⚠️ SECURITY NOTICE:**
- `.env` file was **REMOVED from git tracking** (2024-11-01)
- All real credentials are now **ONLY in gitignored files**
- Code has **NO hardcoded fallback credentials** - fails fast if env vars missing
- Never commit real API keys to git - use `.env.example` as template

---

### **Frontend Variables (.env.local)**

**Purpose:** Override production Supabase URL for local development + provide required credentials

**Setup:**
```bash
# .env.local (create from .env.example)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_5CJI2QQt8Crz60Mh1TTcrw_w4sL2TpL
```

**⚠️ IMPORTANT: New Publishable Key Format**

Supabase migrated from JWT tokens to Publishable Keys:
- **OLD (deprecated):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)
- **NEW (required):** `sb_publishable_...` (Publishable Key format)

**Why this matters:**
- Disabling legacy API keys invalidates ALL old JWT tokens
- Frontend and Edge Functions both need new format credentials
- Code now **fails fast** with clear error if credentials missing

**⚠️ Common Problem:** System environment variables override `.env` files!

Vite loads in this order:
1. **System environment variables** (HIGHEST PRIORITY)
2. `.env.local`
3. `.env.example` (read-only template)

**Solution:**
```bash
# 1. Check for conflicting system vars
env | grep VITE

# 2. If found, remove from ~/.zshrc or ~/.bash_profile
# Comment out lines like: export VITE_SUPABASE_URL=...

# 3. Reload shell
source ~/.zshrc
```

**Validation:**
- Open browser DevTools Console
- Look for: `🔗 Supabase: LOCAL (http://127.0.0.1:54321)`
- If shows `PRODUCTION`, **STOP** and fix environment variables!
- If app crashes with "VITE_SUPABASE_URL is not defined", create `.env.local`

---

### **Edge Functions Variables (supabase/functions/.env)**

**🚨 CRITICAL:** Edge Functions run in Docker container and **DO NOT** read `.env.local`!

**Purpose:** Provide API keys (OpenAI, Anthropic) and Supabase credentials to Edge Functions

**🔍 SECURITY AUDIT DISCOVERY (2024-11-01):**

Edge Functions **cache environment variables at deployment time**. This means:
- Rotating credentials in Supabase Dashboard does NOT automatically update running Edge Functions
- Edge Functions continue using OLD cached credentials until redeployed
- When credentials are invalidated (e.g., disabling legacy API keys), Edge Functions fail with "Unregistered API key"
- **Solution:** Redeploy ALL Edge Functions after rotating credentials

**Setup (REQUIRED for optimization system + authentication):**
```bash
# 1. Copy API keys to functions folder
cp supabase/.env supabase/functions/.env

# 2. Verify content (should include NEW rotated keys)
cat supabase/functions/.env
# Should contain:
# SUPABASE_SERVICE_ROLE_KEY=sb_secret_hVzx2tEx0UFGrhz_s3HA0A_m9I_Y8ZI
# OPENAI_API_KEY=sk-proj-...
# ANTHROPIC_API_KEY=sk-ant-api03-...

# 3. Restart Supabase (auto-loads on start)
npx supabase stop
npx supabase start
```

**Validation:**
```bash
# Check Edge Runtime container has the NEW keys
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep SERVICE_ROLE_KEY

# Should return: SUPABASE_SERVICE_ROLE_KEY=sb_secret_hVzx... (NEW key format)
```

**⚠️ PRODUCTION Credential Rotation Procedure:**

When rotating Supabase credentials in production:

1. **Rotate keys in Supabase Dashboard**
   - Generate new service role key (format: `sb_secret_...`)
   - Generate new publishable key (format: `sb_publishable_...`)

2. **Update environment variables**
   - Update Vercel: `VITE_SUPABASE_ANON_KEY` with new publishable key
   - Update local: `supabase/functions/.env` with new service role key

3. **Redeploy ALL Edge Functions** (CRITICAL!)
   ```bash
   # Example: Redeploy all 19 Edge Functions
   for func in j_hub_user_accounts j_hub_optimization_transcribe ...; do
     npx supabase functions deploy $func --project-ref biwwowendjuzvpttyrlb
   done
   ```

4. **Why redeployment is required:**
   - Edge Functions cache `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` at deployment
   - Changing Supabase secrets does NOT update cached values
   - Old cached credentials cause "Unregistered API key" errors
   - Redeployment forces Edge Functions to reload new credentials

**❌ Common Mistakes:**
- Using `npx supabase secrets set` → Only for PRODUCTION remote, not local!
- Putting keys in `.env.local` → Edge Functions won't see them
- Using `supabase functions serve --env-file` → Creates conflicts with `supabase start`
- Rotating credentials without redeploying Edge Functions → Functions still use old cached keys!

**✅ Correct Flow:**
1. `supabase/.env` = Source of truth (API keys)
2. Copy to `supabase/functions/.env` (gitignored)
3. `npx supabase start` → Auto-loads into Edge Runtime container
4. Edge Functions can now access `Deno.env.get('OPENAI_API_KEY')`
5. **After rotating production credentials:** Redeploy ALL Edge Functions

---

### **Troubleshooting**

**Edge Function error: "OPENAI_API_KEY not configured"**

```bash
# 1. Check file exists
ls -la supabase/functions/.env

# 2. If missing, create it
cp supabase/.env supabase/functions/.env

# 3. Restart Supabase
npx supabase stop && npx supabase start

# 4. Validate
docker exec supabase_edge_runtime_... env | grep API_KEY
```

**Frontend connecting to PRODUCTION instead of LOCAL**

```bash
# 1. Check system environment
env | grep VITE

# 2. Remove conflicting vars from shell config
# 3. Verify .env.local exists with correct values
# 4. Restart dev server: npm run dev
```

See [docs/DEV-TROUBLESHOOTING.md](docs/DEV-TROUBLESHOOTING.md) for more issues.

---

## 🖥️ CLI Usage Policy

**CRITICAL: Always prefer CLI tools over web interfaces**

Claude Code deve **SEMPRE** usar as ferramentas CLI disponíveis:

- ✅ **Supabase CLI**: `npx supabase` para functions, migrations, database
- ✅ **GitHub CLI**: `gh` para issues, PRs, releases
- ✅ **Git CLI**: `git` para version control
- ✅ **npm/npx**: para package management e tools

### Handling CLI Errors

**Se um comando CLI falhar:**

1. **NUNCA** tente fazer a operação manualmente via web
2. **SEMPRE** informe o usuário do erro completo
3. **SEMPRE** sugira ao usuário verificar:
   - Autenticação (`gh auth status`, `supabase login`)
   - Configuração local
   - Permissões de acesso
4. **SEMPRE** mostre o comando exato que falhou para o usuário debugar

**Exemplo de erro:**
```
❌ CLI Error: `gh pr create` failed
→ User action needed: Run `gh auth login` to authenticate
→ Command attempted: gh pr create --title "..." --body "..."
```

**Jamais substitua CLI por:**
- ❌ Instruções para usar Supabase Dashboard
- ❌ Instruções para usar GitHub web interface
- ❌ Soluções manuais que contornem o CLI

---

## 🔄 Quick Database Reset

**⚠️ NUNCA use `npx supabase db reset` diretamente - perde todos os dados!**

### **SEMPRE use o script seguro:**

```bash
./localdev/4-quick-reset.sh
```

**O que faz automaticamente:**
1. ✅ Apaga dados locais
2. ✅ Reaplica todas migrations
3. ✅ Restaura backup de produção
4. ✅ Database volta ao estado de produção

**Quando usar:** Dados locais corrompidos ou após mudanças em migrations.

### **Para Claude Code:**

Quando precisar aplicar migrations ou resetar database:

```bash
✅ CORRETO: ./localdev/4-quick-reset.sh
❌ ERRADO:  npx supabase db reset (perde todos dados!)
```

**Ver também:** `./localdev.sh` (menu interativo com todas opções)

---

### **Mudança de Fluxo (Outubro 2024)**

**ANTES (Sem Docker/Supabase Local):**
- Testávamos migrations e edge functions diretamente na nuvem
- Alto risco de quebrar produção
- Deploy manual via comandos Supabase

**AGORA (Com Supabase Local):**
- Testamos tudo localmente antes de fazer push
- Zero risco para produção
- Importar dados de produção quando necessário ✅
- **Edge Functions rodando localmente (CRÍTICO!)** ✅
- Deploy frontend automático via Vercel
- Deploy edge functions manual via Supabase CLI

### **Workflow Atual**

**Claude Code (AI) faz:**
1. ✅ Cria migrations em `supabase/migrations/YYYYMMDDHHMMSS_nome.sql`
2. ✅ Cria edge functions em `supabase/functions/nome/index.ts`
3. ✅ Cria arquivos de configuração (`deno.json`, etc.)
4. ✅ **Executa comandos Supabase LOCAL livremente** (ambiente de desenvolvimento)
5. ✅ Faz commits com mensagens descritivas

**Bruno (Humano) faz:**
1. 🧪 **Testa localmente** (se necessário)
2. 🚀 **Deploy para produção:**
   ```bash
   # Push código (Vercel auto-deploys frontend)
   git push origin branch-name

   # Deploy edge functions manualmente (se modificadas)
   npx supabase functions deploy nome-da-function --project-ref biwwowendjuzvpttyrlb
   ```

### **Política de Comandos Supabase**

#### ✅ **Claude PODE executar livremente (ambiente LOCAL):**

```bash
# Lifecycle do ambiente local
supabase start           # Iniciar Supabase local
supabase stop            # Parar Supabase local
supabase status          # Ver status

# Database local
supabase db reset        # Aplicar migrations localmente
supabase db diff         # Ver diferenças schema
psql ...                 # Conectar/modificar database local

# Importar dados de produção (read-only remoto)
supabase db dump --db-url "..." > file.sql  # Exportar de produção
psql ... -f file.sql     # Importar no local

# Edge Functions locais
supabase functions serve # Servir functions localmente

# Git operations
git add / commit / push  # Version control normal
```

**Razão:** Supabase Local é ambiente de desenvolvimento isolado. Operações locais não afetam produção.

#### ❌ **Claude NUNCA deve executar (sem DUPLA confirmação):**

```bash
# Deploy direto para produção
supabase db push                    # ⚠️ Envia migrations para PRODUÇÃO
supabase functions deploy           # ⚠️ Deploy edge functions para PRODUÇÃO
supabase db remote commit           # ⚠️ Modifica schema remoto
supabase secrets set                # ⚠️ Modifica secrets de produção
supabase storage update             # ⚠️ Modifica storage de produção

# Operações destrutivas remotas
psql <PRODUCTION_URL> ...           # ⚠️ Modificar database de produção diretamente
```

**Razão:** Comandos que modificam produção precisam validação explícita do usuário.

**Protocolo de dupla confirmação:**
1. Claude avisa: "Este comando afeta PRODUÇÃO. Confirma?"
2. Usuário confirma primeira vez
3. Claude mostra preview do que será feito
4. Usuário confirma segunda vez
5. Claude executa

#### ⚠️ **Avisar sobre riscos (mesmo sendo local):**

Claude deve avisar o usuário ANTES de executar se:
- Operação pode causar perda de dados locais (ex: `supabase db reset` apaga dados)
- Primeira vez executando comando específico na sessão
- Importando grande volume de dados de produção

**Exemplo:**
```
⚠️ Vou executar `supabase db reset`
→ Isso vai APAGAR todos dados locais e reaplicar migrations
→ Ambiente local será recriado do zero
→ Deseja prosseguir? (Isso não afeta produção)
```

Se usuário confirmar, Claude executa. Se não, Claude para.

### **Vantagens do Novo Fluxo**

✅ **Segurança:** Testar tudo localmente antes de produção
✅ **Velocidade:** Iteração rápida sem afetar usuários
✅ **Confiança:** Validar migrations antes de aplicar em prod
✅ **Debugging:** Logs locais mais fáceis de analisar
✅ **Automação:** GitHub Integration cuida do deploy

### **Estrutura de Testes Locais**

```
┌─────────────────────────────────────────────────┐
│  1. Claude cria migration + edge function       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. Bruno testa localmente                      │
│     $ supabase start                            │
│     $ supabase db reset                         │
│     $ supabase functions serve                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. Bruno valida que está funcionando           │
│     - Migrations aplicadas ✅                   │
│     - Edge functions respondendo ✅             │
│     - Nenhum erro de TypeScript ✅              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. Claude faz commit                           │
│     $ git add .                                 │
│     $ git commit -m "..."                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. Bruno faz push                              │
│     $ git push origin branch-name               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  6. Vercel faz deploy FRONTEND automático ✅    │
│     - Frontend deployed e atualizado            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  7. Bruno deploys edge functions MANUALMENTE    │
│     $ npx supabase functions deploy <nome>      │
│     (apenas se edge functions foram modificadas)│
└─────────────────────────────────────────────────┘
```

---

## 🔄 Context Management (Multi-Computer Workflow)

> **CRITICAL:** When working across multiple computers, context MUST be maintained through documentation

### **Context Files Hierarchy**

1. **`.claude-context`** (Temporary - Last 7 days)
   - Recent decisions and work-in-progress
   - Current issues and TODOs
   - Next session context
   - **Auto-rotates:** Decisions >7 days migrate to ARCHITECTURE.md

2. **`docs/ARCHITECTURE.md`** (Permanent)
   - Permanent architecture decisions
   - Database schema documentation
   - System patterns and conventions

3. **`CLAUDE.md`** (This file)
   - Project overview and instructions
   - Essential commands and workflows

---

## 🚀 Session Start Protocol

**MANDATORY:** When starting a new Claude Code session:

1. **Read `.claude-context` FIRST**
   ```bash
   # Claude should automatically read this file at session start
   ```

2. **Understand current state:**
   - What was done in last session?
   - What issues are pending?
   - What files were modified?
   - What's the deployment status?

3. **Confirm with user:**
   ```
   "I've read the context file. Last session was working on: [X].
   Current critical issues: [Y].

   Should I continue from there, or do you have a different priority?"
   ```

4. **Read `docs/ARCHITECTURE.md` for permanent decisions**
   - Table schemas
   - Naming conventions
   - Deprecated patterns to avoid

---

## 🔚 Session End Protocol

**MANDATORY:** When user says "vamos encerrar", "acabou", "tchau", or similar:

### **Update `.claude-context` automatically:**

```yaml
# Tasks to complete before ending session:

1. Set last_updated to current timestamp
2. Add today's decisions to recent_decisions
3. Update current_issues with latest status
4. Update work_in_progress with modified files
5. Write next_session_context with critical info
6. Mark deployment status (deployed/pending/broken)
```

### **Rotation Logic (>7 days):**

If any decision in `.claude-context` is >7 days old:
- Move to `docs/ARCHITECTURE.md` (permanent section)
- Remove from `.claude-context`
- Keep context file lean

### **Pre-End Checklist:**

- [ ] All decisions documented
- [ ] Critical issues flagged with severity
- [ ] Modified files listed
- [ ] Deploy status noted
- [ ] Next steps clearly written
- [ ] Uncommitted changes mentioned

### **Example End Message:**

```
✅ Context updated successfully!

Summary of this session:
- Fixed edge function to use j_ads_users (deployed ✅)
- Pending: Populate missing names in j_ads_users
- Next session: Test account filtering for all roles

Next Claude will know exactly where we left off! 🎯
```

---

## 🗄️ Database Structure (Core Tables)

**⚠️ CRITICAL - Read this before ANY database operations:**

### **User Management (PRIMARY TABLE)**

**✅ ALWAYS USE THIS:**
- **`j_hub_users`** - Single source of truth for user data
  - Fields: id, email, role, nome, notion_manager_id
  - Roles: 'admin', 'staff', 'client'

**❌ NEVER USE (OBSOLETE):**
- `j_ads_users` - DELETED/RENAMED to `j_hub_users` (2024-10-20)
- `user_roles` - DELETED (2025-10-09)
- `j_ads_user_roles` - Never existed

### **⚠️ CRITICAL: Naming Convention Rules**

**Before creating ANY database object:**

1. **Search for existing tables FIRST:**
   ```bash
   grep -r "table_name" supabase/migrations/
   ```

2. **Check ARCHITECTURE.md:**
   - See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#user-management-system)
   - Verify correct table name and schema

3. **NEVER assume table name from constraint/trigger name:**
   - ❌ Seeing `j_ads_users_role_check` does NOT mean table is `j_ads_users`
   - ✅ Always verify table name with `\d tablename` or check migrations

4. **Naming Standard:**
   - Format: `{table_name}_{column}_{type}`
   - Example: `j_hub_users_role_check` (table: j_hub_users, column: role, type: check)

**Incident Report (2024-10-20):**
- Claude saw constraint `j_ads_users_role_check` in baseline migration
- Assumed table `j_ads_users` should exist
- Created duplicate table (actual table: `j_hub_users`)
- **Fix:** Renamed all constraints/triggers to match table name
- **Prevention:** This section + ARCHITECTURE.md documentation

---

## 🗄️ Database Structure (Other Core Tables)

**Creative Management (j_ads_*):**
- `j_ads_creative_submissions` - Main submissions table
- `j_ads_creative_files` - File attachments with Supabase Storage
- `j_ads_creative_variations` - Multiple creative variations

**Synchronized Tables (Notion → Supabase):**
- `j_hub_notion_db_managers` - Gestores (10 campos) ✅
- `j_hub_notion_db_accounts` - Contas (75 campos) ✅
- `j_hub_notion_db_partners` - Parceiros ✅

**Reports System (j_rep_*):**
- `j_rep_metaads_bronze` - Dados Meta Ads sincronizados (fonte dos 9 dashboards) ⚠️ TODO: RLS

**Optimization System:**
- `j_hub_optimization_recordings` - Gravações de áudio (otimizações)
- `j_hub_optimization_transcripts` - Transcrições via Whisper
- `j_hub_optimization_context` - Contexto extraído por IA
- `j_hub_optimization_prompts` - Prompts de análise

**System Health:**
- `j_ads_error_logs` - Error tracking estruturado ✅
- `j_hub_notion_sync_logs` - Logs de sincronização

**❌ OBSOLETE TABLES (to be removed):**
- `creative_submissions`, `creative_files`, `creative_variations` - Duplicatas sem prefixo
- `notion_managers`, `notion_manager_accounts` - Antigas, substituídas por j_hub_notion_db_*
- `user_roles` - Antiga, substituída por j_ads_users

> 📖 Ver [ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalhes completos

---

## ⚡ Edge Functions (Supabase)

**Core Functions:**
- `j_ads_admin_actions` - Admin operations (list, publish, delete)
- `j_ads_manager_actions` - Manager operations (limited access)
- `j_ads_submit_creative` - Process submissions + SISTEMA RESILIENTE ✅

**Sync Functions:**
- `j_ads_complete_notion_sync` - Full database synchronization ✅
- `j_ads_my_accounts_complete` - User account access with full data ✅
- `j_ads_scheduled_notion_sync` - Scheduled incremental sync ✅

> 📖 Ver [ARCHITECTURE.md](docs/ARCHITECTURE.md) para lista completa

---

## 🎨 Design System

**Brand Colors:**
- **Jumper Orange**: `#FA4721` (CTAs e hero metrics)
- **Performance Colors**: Verde (excellent), Azul (good), Amarelo (warning), Vermelho (critical)

**Design Tokens:**
```css
--orange-hero: 14 95% 55%;
--metric-excellent: 159 64% 42%;
--metric-good: 217 91% 60%;
--metric-warning: 38 92% 50%;
--metric-critical: 0 84% 60%;
```

**Components:**
- shadcn/ui base library
- Haffer font (primary typeface)
- Dark mode support via CSS custom properties
- Mobile-first responsive design

---

## 🚀 Git Workflow

- **Main branch**: `main` (production) ✅
- **Development**: Feature branches → merge para main
- **Deploy frontend**: Push para main = auto-deploy no Vercel ✅
- **Deploy edge functions**: Deploy manual via `npx supabase functions deploy <nome>` ⚙️
- **Production URL**: https://hub.jumper.studio

**Branch ativa atual:** `reports` (Sistema de insights comparativos)

---

## 🛡️ Sistema de Resiliência

**Proteções Ativas:**
- ✅ Retry logic com exponential backoff
- ✅ Circuit breaker para APIs externas
- ✅ Upload transacional com rollback
- ✅ Fallback automático para falhas da Notion
- ✅ Error tracking estruturado
- ✅ Health monitoring em tempo real

**Resultado:** "GERENTE NUNCA VERÁ ERRO DE SUBMISSÃO!" ✅

---

## 📊 Dashboards Implementados (9 objetivos)

**Funcionais:**
1. **Vendas** - Receita, ROAS, conversões, CPA
2. **Tráfego** - Cliques no link, CPC, CTR, impressões
3. **Engajamento** - Interações, métricas de vídeo, frequência
4. **Leads** - Leads gerados, custo por lead, taxa de conversão
5. **Reconhecimento de Marca** - Alcance, impressões, frequência
6. **Alcance** - Cobertura de audiência, CPM
7. **Reproduções de Vídeo** - Funil completo (25%, 50%, 75%, 100%)
8. **Conversões** - Total de conversões, ROAS, CPA
9. **Visão Geral** - Dashboard genérico

**Coming Soon:** Mensagens, Catálogo, Visitas, Instalações, Cadastros, Seguidores

**Performance Thresholds (benchmarks da indústria):**
- CTR: Excellent ≥2.0% | Good ≥1.5% | Warning ≥0.5%
- ROAS: Excellent ≥4.0x | Good ≥2.5x | Warning ≥1.0x
- CPA: Excellent ≤R$50 | Good ≤R$100 | Warning ≤R$200
- CPM: Excellent ≤R$10 | Good ≤R$20 | Warning ≤R$40

---

## 🔍 Development Workflow

### **For New Features**
1. Check current branch (`git status`)
2. Create feature branch if needed
3. Run `npm run dev` for development
4. Test functionality thoroughly
5. Run `npm run lint` and `npm run typecheck`
6. Commit with descriptive message

### **For Bug Fixes**
1. Identify affected components/functions
2. Check related Edge Functions if backend issue
3. Test fix in multiple screen sizes
4. Verify no regressions in other features
5. Update documentation if architecture changes

---

## 🚨 Important Notes

**Performance:**
- Lazy loading implemented for main routes
- Bundle splitting reduces initial load (70KB)
- Zero real-time Notion API calls (dados sincronizados)

**Common Issues:**
- Fast Refresh warnings: Normal em Button component exports
- Notion API rate limits: Edge functions têm error handling
- File uploads: Large files may timeout (implementar loading states)
- Admin permissions: Sempre verificar role antes de operações sensíveis

**Development Tips:**
- React DevTools para debugging de componentes
- Supabase dashboard para database/auth debugging
- Network tab para Edge Function debugging
- Console logs disponíveis em Supabase Edge Function logs

---

> 📖 **Detailed Documentation**: See [ARCHITECTURE.md - Optimization Creation Flow v2.1](docs/ARCHITECTURE.md#optimization-creation-flow-v21) for complete technical details, components, database changes, and usage examples.

---

## 🔧 Pending Tasks (Next Session)

### **🚨 CRITICAL: Database Cleanup**

**Task:** Audit and clean obsolete tables in Supabase

**Steps:**
1. List all existing tables in Supabase database
2. Search entire codebase for references to obsolete tables
3. Replace old table references with new standardized tables (j_ads_*)
4. Drop obsolete tables from database

**Context:**
During migration cleanup (2024-10-09), we deleted obsolete migrations referencing old tables (n8n_*, accounts, notion_managers, etc). However, there may still be:
- References in code to old table names
- Actual tables in Supabase that are no longer used
- Edge Functions querying deprecated tables

**Expected tables pattern:** `j_ads_*` (standardized prefix)
**Obsolete patterns to find:** `n8n_*`, `accounts`, `notion_managers`, `user_roles`, etc.

---

## 📚 Key Dependencies

**Core:**
- `react` + `react-dom`, `@tanstack/react-query`, `@supabase/supabase-js`, `react-router-dom`

**UI & Styling:**
- `tailwindcss`, `@radix-ui/*` (via shadcn/ui), `lucide-react`, `sonner`

**Forms & Validation:**
- `react-hook-form`, `@hookform/resolvers` + `zod`, `react-dropzone`

---

## 💰 Impacto Estratégico

Este não é apenas um "sistema interno" - é um **PRODUTO ESTRATÉGICO** que vai:

1. **Redefinir** o modelo de negócio da Jumper
2. **Democratizar** acesso a tráfego pago de qualidade
3. **Transformar** agências de conteúdo em parceiras eficientes
4. **Escalar** serviços para cliente final com preços baixos

**Cada otimização de código impacta diretamente na viabilidade desse modelo transformador.**

---

**Last Updated**: 2024-11-05
**Maintained by**: Claude Code Assistant
**Project Status**:
- **FASE 1**: ✅ Complete (Production system with 9 dashboards)
- **FASE 2 v2.1**: ✅ Complete (Optimization Creation Flow)
- **FASE 2 REPORTS**: ⏳ Planning (Comparative insights, anomaly detection)