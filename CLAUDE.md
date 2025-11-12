# Jumper Flow - Claude Configuration

> **📖 Documentação Completa:**
> - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detalhes técnicos aprofundados
> - [CHANGELOG.md](docs/CHANGELOG.md) - Histórico completo de sessões de desenvolvimento

---

## 📋 Project Overview

### **Jumper Flow Platform - Briefing Estratégico**

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

### **Local Credentials**

**Development Login:**
- Email: `bruno@jumper.studio`
- Password: `senha123`

**Local Endpoints:**
- Frontend: http://localhost:8080
- Supabase Studio: http://127.0.0.1:54323
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Edge Functions: http://127.0.0.1:54321/functions/v1/

**Troubleshooting:** See `localdev/README.md` for complete guide.

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

**See:** [ARCHITECTURE.md - Account Selection Pattern](docs/ARCHITECTURE.md#-account-selection-pattern-standard-pattern) for complete details.

---

## ⚠️ CRITICAL: Dual ID System (UUID vs TEXT notion_id)

**The database uses a dual ID system for accounts. Understanding this is CRITICAL to avoid FK constraint violations.**

### **Table Classification**

**Modern Tables (use UUID FK):**
- `j_hub_decks` - Uses `account_id UUID`
- `j_hub_users` - Uses `id UUID`
- Future tables should use UUID

**Legacy Tables (use TEXT notion_id FK):**
- `j_hub_optimization_recordings` - Uses `account_id TEXT`
- `j_hub_creative_submissions` - Uses `account_id TEXT`

### **Edge Function Returns BOTH Formats**

```typescript
// j_hub_user_accounts returns:
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

### **Common Mistake: PrioritizedAccountSelect**

```typescript
// ❌ WRONG - Causes FK constraint violation on legacy tables
<PrioritizedAccountSelect
  onChange={(accountId) => {
    setSelectedAccountId(accountId); // ⚠️ This is UUID!
    // Later: INSERT account_id = uuid → FK violation if table expects TEXT
  }}
/>

// ✅ CORRECT - Extract notion_id for legacy tables
const handleAccountChange = (accountId: string) => {
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    setSelectedAccountId(account.notion_id);  // ✅ TEXT for legacy
  }
};
```

**See:** [ARCHITECTURE.md - Dual ID System](docs/ARCHITECTURE.md#️-critical-dual-id-system-uuid-vs-text-notionid) for complete technical details.

---

## ⚠️ CRITICAL: Environment Variables and Credential Security

**🚨 UPDATED 2024-11-01: Secure credential management with fail-fast validation**

### **Environment Files Structure**

```
.env.example               → Template (committed to git, no real values)
.env.local                 → Frontend local override (gitignored, REQUIRED for dev)
supabase/.env              → Source of truth for API keys (gitignored, REQUIRED)
supabase/functions/.env    → Edge Functions environment (gitignored, REQUIRED!)
```

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

---

## 🚀 Git Workflow & Deployment

### **Git Workflow**

- **Main branch**: `main` (production) ✅
- **Development**: Feature branches → merge para main
- **Production URL**: https://hub.jumper.studio

### **Deployment Strategy**

**Frontend (Automatic via Vercel):**
```bash
git push origin main  # Vercel auto-deploys frontend
```

**Edge Functions (Manual via Supabase CLI):**
```bash
npx supabase functions deploy <function-name> --project-ref biwwowendjuzvpttyrlb
```

### **Supabase Commands Policy**

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
```

**Protocolo de dupla confirmação:**
1. Claude avisa: "Este comando afeta PRODUÇÃO. Confirma?"
2. Usuário confirma primeira vez
3. Claude mostra preview do que será feito
4. Usuário confirma segunda vez
5. Claude executa

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

---

## 🔚 Session End Protocol

**MANDATORY:** When user says "vamos encerrar", "acabou", "tchau", or similar:

### **Update `.claude-context` automatically:**

1. Set last_updated to current timestamp
2. Add today's decisions to recent_decisions
3. Update current_issues with latest status
4. Update work_in_progress with modified files
5. Write next_session_context with critical info
6. Mark deployment status (deployed/pending/broken)

### **Rotation Logic (>7 days):**

If any decision in `.claude-context` is >7 days old:
- Move to `docs/ARCHITECTURE.md` (permanent section)
- Remove from `.claude-context`
- Keep context file lean

---

## 📚 Key Architecture References

**For detailed technical information, see:**

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete technical documentation:
  - Database Schema
  - Edge Functions
  - User Management System
  - Account Selection Pattern
  - Dual ID System
  - Optimization System
  - Decks System
  - Authentication & Permissions
  - Notion Integration
  - UI/UX Patterns

- **[CHANGELOG.md](docs/CHANGELOG.md)** - Development history:
  - Session logs
  - Feature implementation details
  - Bug fixes and discoveries

---

## 💰 Impacto Estratégico

Este não é apenas um "sistema interno" - é um **PRODUTO ESTRATÉGICO** que vai:

1. **Redefinir** o modelo de negócio da Jumper
2. **Democratizar** acesso a tráfego pago de qualidade
3. **Transformar** agências de conteúdo em parceiras eficientes
4. **Escalar** serviços para cliente final com preços baixos

**Cada otimização de código impacta diretamente na viabilidade desse modelo transformador.**

---

**Last Updated**: 2024-11-12
**Maintained by**: Claude Code Assistant
**Project Status**:
- **FASE 1**: ✅ Complete (Production system with 9 dashboards)
- **FASE 2 v2.1**: ✅ Complete (Optimization + Decks System)
- **FASE 3**: 🔜 Planning (Multi-platform, self-service)
