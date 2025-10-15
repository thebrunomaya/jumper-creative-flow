# Jumper Creative Flow - Claude Configuration

> **📖 Documentação Completa:**
> - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detalhes técnicos aprofundados
> - [CHANGELOG.md](docs/CHANGELOG.md) - Histórico completo de sessões de desenvolvimento

---

## 📋 Project Overview

### **Jumper Ads Platform - Briefing Estratégico**

**🎯 OBJETIVO PRINCIPAL:** TORNAR-SE O HUB COMPLETO de gestores de tráfego, gerentes parceiros e clientes finais da Jumper Studio para **democratizar serviços de tráfego pago**.

**📍 Missão Atual:** Sistema de criativos completo ✅ + Sistema resiliente ✅ + Deploy em produção ✅ + **9 Dashboards especializados** ✅
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

**🔄 FASE 2 (EM PLANEJAMENTO - Out/2024):**
- Sistema de Insights Comparativos (REPORTS branch)
- Detecção de anomalias automática
- Contexto de otimizações via gravação de áudio (OPTIMIZER branch)
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
    ├── Tabelas Sincronizadas (j_ads_notion_db_*)
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

## ⚠️ CRITICAL: Environment Variables and Local Development

**🚨 DISCOVERED 2025-10-14: System environment variables override `.env` files!**

### **The Problem**

Vite loads environment variables in this order of precedence:
1. **System environment variables** (HIGHEST PRIORITY)
2. `.env.local`
3. `.env`

If you have `VITE_SUPABASE_URL` exported in your shell (e.g., `.zshrc`), **it will ALWAYS use that value**, even if `.env` has different values!

### **The Danger**

```bash
# If these are in your system environment:
export VITE_SUPABASE_URL=https://biwwowendjuzvpttyrlb.supabase.co  # PRODUCTION!
export VITE_SUPABASE_PUBLISHABLE_KEY=...  # PRODUCTION KEY!

# Then running `npm run dev` connects to PRODUCTION
# even with Supabase Local running!
```

**Result:** You think you're testing locally but **modifying production data**! 💥

### **The Solution**

**1. Check for system variables:**
```bash
env | grep VITE
```

**2. If found, remove them from shell config:**
```bash
# Edit ~/.zshrc or ~/.bash_profile
# Comment out or delete lines like:
# export VITE_SUPABASE_URL=...
# export VITE_SUPABASE_PUBLISHABLE_KEY=...

# Then reload:
source ~/.zshrc
```

**3. Run dev server with explicit local variables:**
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
npm run dev
```

**4. Verify in browser console:**
```javascript
// Should see:
🔗 Supabase: LOCAL (http://127.0.0.1:54321)

// NOT:
🔗 Supabase: PRODUCTION (https://biwwowendjuzvpttyrlb.supabase.co)
```

### **Safety Check**

**ALWAYS verify which Supabase you're connected to:**
- Open browser DevTools Console
- Look for the `🔗 Supabase:` log on page load
- If it says `PRODUCTION`, **STOP** and fix environment variables!

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

## 🐳 Supabase Local Development Workflow

**STATUS:** ✅ Supabase CLI instalado (v2.48.3) + Docker disponível

### **Mudança de Fluxo (Outubro 2024)**

**ANTES (Sem Docker/Supabase Local):**
- Testávamos migrations e edge functions diretamente na nuvem
- Alto risco de quebrar produção
- Deploy manual via comandos Supabase

**AGORA (Com Supabase Local):**
- Testamos tudo localmente antes de fazer push
- Zero risco para produção
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

**✅ USE THIS:**
- **`j_ads_users`** - Single source of truth for user data
  - Fields: id, email, role, nome, notion_manager_id
  - Roles: 'admin', 'staff', 'client'

**❌ NEVER USE:**
- `user_roles` - DELETED (2025-10-09)
- `j_ads_user_roles` - Never existed

**See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#user-management-system) for complete schema**

---

## 🗄️ Database Structure (Other Core Tables)

**Creative Management (j_ads_*):**
- `j_ads_creative_submissions` - Main submissions table
- `j_ads_creative_files` - File attachments with Supabase Storage
- `j_ads_creative_variations` - Multiple creative variations

**Synchronized Tables (Notion → Supabase):**
- `j_ads_notion_db_managers` - Gestores (10 campos) ✅
- `j_ads_notion_db_accounts` - Contas (75 campos) ✅
- `j_ads_notion_db_partners` - Parceiros ✅

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
- `notion_managers`, `notion_manager_accounts` - Antigas, substituídas por j_ads_notion_db_*
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

## 🔑 Environment Variables

**Frontend (Vercel):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key

**Backend (Supabase Edge Functions):**
- `SUPABASE_SERVICE_ROLE_KEY` - Service role for admin operations
- `NOTION_TOKEN` - Notion integration token

### ⚠️ CRITICAL: Vercel Environment Variables Policy

**DO NOT set VITE_* variables in Vercel dashboard unless absolutely necessary!**

**Why?**
- Vite embeds env vars into JavaScript bundle at BUILD TIME
- Code has hardcoded fallback values for production
- Adding Vercel env vars can cause conflicts/corruption
- If Vercel var is invalid, entire production breaks

**Incident Report (2024-10-14):**
- Vercel had `VITE_SUPABASE_ANON_KEY` with corrupted value
- Caused `TypeError: Failed to execute 'set' on 'Headers'` in production
- Login completely broken (email + Notion OAuth)
- **Solution:** Deleted Vercel env vars, app uses hardcoded fallbacks ✅

**Best Practice:**
1. ✅ Keep production credentials hardcoded in `client.ts` fallback
2. ✅ Use `.env` for production values (committed to git, used by Vercel)
3. ✅ Use `.env.local` for local development (gitignored, overrides `.env`)
4. ❌ Avoid setting `VITE_*` vars in Vercel dashboard (redundant + risky)

**Exception:** Only set Vercel env vars if value is secret and cannot be in git.

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

## 🧠 Roadmap FASE 2 (REPORTS + OPTIMIZER)

**Branch OPTIMIZER (Lovable) - ✅ COMPLETO:**
- ✅ Interface de gravação de áudio (otimizações do gestor)
- ✅ Transcrição automática via Whisper
- ✅ Análise de IA para extração de contexto
- ✅ Geração de relatórios para clientes
- ✅ Tabela `j_hub_optimization_context` pronta para consumo
- **Status**: 100% implementado, pronto para integração

**Branch REPORTS (Claude Code) - ⏳ A IMPLEMENTAR:**
- **FASE 0**: 🔐 Fixes de segurança (RLS) - **CRITICAL**
- **FASE 1**: Insights Comparativos (período atual vs anterior)
- **FASE 2**: Detecção de Anomalias automática
- **FASE 3**: Contexto Automático Básico (quick notes)
- **FASE 4**: Integração com OPTIMIZER
- **Status**: Planejamento completo, aguardando início

> 📖 Ver [REPORTS-ROADMAP.md](docs/REPORTS-ROADMAP.md) para plano detalhado
> 📖 Ver [CHANGELOG.md](docs/CHANGELOG.md) para histórico completo

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

## 🔧 Pending Tasks (Next Session)

### **🚨 CRITICAL: Database Cleanup**

**Task:** Audit and clean obsolete tables in Supabase

**Steps:**
1. List all existing tables in Supabase database
2. Search entire codebase for references to obsolete tables
3. Replace old table references with new standardized tables (j_ads_*)
4. Drop obsolete tables from database

**Context:**
During migration cleanup (2025-10-09), we deleted obsolete migrations referencing old tables (n8n_*, accounts, notion_managers, etc). However, there may still be:
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

**Last Updated**: 2024-10-07
**Maintained by**: Claude Code Assistant
**Project Status**: **FASE 1 COMPLETA** ✅ → **FASE 2 (INSIGHTS) EM PLANEJAMENTO** 🧠
