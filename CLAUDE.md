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
- Deploy em produção (ads.jumper.studio)
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
Jumper Ads (ads.jumper.studio)
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
- **Hosting**: Vercel (Production: ads.jumper.studio)
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

## 🗄️ Database Structure (Core Tables)

**Creative Management:**
- `j_ads_creative_submissions` - Main submissions table
- `j_ads_creative_files` - File attachments with Supabase Storage
- `j_ads_creative_variations` - Multiple creative variations

**Synchronized Tables (Notion → Supabase):**
- `j_ads_notion_db_managers` - Gestores (10 campos) ✅
- `j_ads_notion_db_accounts` - Contas (75 campos) ✅
- `j_ads_notion_db_partners` - Parceiros ✅

**System Health:**
- `j_ads_error_logs` - Error tracking estruturado ✅
- `j_ads_system_metrics` - Métricas de saúde (parcial)
- `j_ads_fallback_submissions` - Fallback para recuperação (parcial)

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

---

## 🚀 Git Workflow

- **Main branch**: `main` (production) ✅
- **Development**: Feature branches → merge para main
- **Deploy automático**: Push para main = deploy no Vercel
- **Production URL**: https://ads.jumper.studio

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
- ✅ Tabela `j_ads_optimization_context` pronta para consumo
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
