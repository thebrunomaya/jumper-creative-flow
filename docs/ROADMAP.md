# Roadmap - Jumper Flow Platform

> **Atualizado:** 2026-01-22 | **Versão:** v2.1.120

---

## Visão Geral

Este roadmap consolida todos os próximos passos do Jumper Hub, organizados por grandes áreas do sistema.

### Status por Área

| Área | Status | Progresso |
|------|--------|-----------|
| 🎨 **Dashboards & Criativos** | ✅ Fase 1-3 Completas + Multi-Platform | 65% |
| 🎙️ **Optimization System** | ✅ Produção | 90% |
| 📊 **Decks System** | ✅ Produção | 85% |
| 💰 **Alertas de Saldo** | ✅ Produção | 100% |
| 🏢 **Gestão de Contas** | 🚧 Em Desenvolvimento | 20% |
| 🔐 **Self-Service** | 🔜 Planejamento | 0% |
| 🌐 **Multi-Plataforma** | 🔜 Futuro | 0% |

---

## 🎨 Dashboards & Criativos

### Completo

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 1** | Top Criativos nos 12 Dashboards | ✅ 100% |
| **Fase 2** | Sistema de Thumbnails Permanentes | ✅ 100% |
| **Fase 3** | Modal de Detalhes do Criativo | ✅ 100% |
| **Fase 3.5** | Dashboard Unificado Multi-Platform (Meta + Google Ads + GA4) | ✅ 100% |

### Pendente

| Fase | Descrição | Prioridade |
|------|-----------|------------|
| **Fase 4** | Views SQL para Performance | Média |
| **Fase 5** | Dashboard de Criativos (página dedicada) | Média |
| **Fase 6** | Sistema de Insights Automatizados | Baixa |
| **Fase 7** | RLS (Row Level Security) | Baixa |

### Detalhes Fase 4: Views SQL

```sql
-- View de performance consolidada por criativo
CREATE OR REPLACE VIEW v_creative_performance AS
SELECT
  creative_id,
  account_id,
  SUM(spend) as total_spend,
  SUM(actions_purchase) as total_purchases,
  SUM(action_values_omni_purchase) as total_revenue,
  CASE WHEN SUM(spend) > 0
    THEN SUM(action_values_omni_purchase) / SUM(spend)
  END as roas
FROM j_rep_metaads_bronze
WHERE creative_id IS NOT NULL
GROUP BY creative_id, account_id;
```

### Detalhes Fase 5: Dashboard de Criativos

- Grid responsivo de cards
- Filtros: conta, período, tipo (VIDEO, SHARE, CAROUSEL)
- Ordenação: spend, ROAS, CPA
- Modal com breakdown por instância (ad_id)

---

## 🎙️ Optimization System

### Completo

- [x] Pipeline de transcrição (Whisper API)
- [x] Melhoria de transcrição (Claude AI)
- [x] Extração estruturada
- [x] Análise de contexto
- [x] Compartilhamento público com senha
- [x] Edição de transcrições
- [x] Histórico de versões

### Pendente

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Integração Calendário** | Agendar próximas otimizações | Média |
| **Templates de Prompt** | Customização por conta/objetivo | Média |
| **Batch Processing** | Processar múltiplos áudios | Baixa |

---

## 📊 Decks System

### Completo

- [x] Pipeline em 3 estágios (Analyze → Review → Generate)
- [x] Geração de HTML com templates
- [x] Upload direto de HTML
- [x] Compartilhamento público com senha
- [x] Versionamento de decks
- [x] Refinamento com IA
- [x] Brand identities (Jumper, Koko)

### Pendente

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Novos Templates** | Mais opções visuais | Alta |
| **Export PDF** | Download em PDF | Média |
| **Integração Criativos** | Dados de performance nos decks | Média |
| **Editor Visual** | Drag-and-drop de slides | Baixa |

---

## 💰 Alertas de Saldo

### Completo

- [x] Sincronização de saldo via Windsor.ai
- [x] Cálculo automático de dias restantes
- [x] Webhook para n8n
- [x] Alertas via Slack/WhatsApp
- [x] Cron job diário (6h BRT)

### Pendente

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Dashboard de Saldos** | Visualização consolidada | Média |
| **Alertas In-App** | Notificações no Hub | Baixa |

---

## 🏢 Gestão de Contas (Remover Notion)

### Visão

Criar interface de gestão de contas no Flow com sync bidirecional para o Notion. Objetivo final: remover Notion da operação, usando Supabase como source of truth.

### Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Flow UI   │ ──► │ Edge Func   │ ──► │   Notion    │
│  (edição)   │     │ (PATCH API) │     │ (atualiza)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Supabase   │
                   │ (cópia local)│
                   └─────────────┘
```

### Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 0** | Corrigir sistema de IDs (UUID migration) | ✅ Completo |
| **Fase 1** | Edge Function `j_hub_account_update` (write-back Notion) | ✅ Completo |
| **Fase 2** | Interface `/admin/accounts` para gestão | ✅ Completo |
| **Fase 3** | Interface `/admin/managers` para gerentes | ✅ Completo |
| **Fase 4** | Validação com equipe | 🔜 Próximo |
| **Fase 5** | Remover sync Notion (Supabase = source of truth) | 🔜 Futuro |

### Fase 0: Migração UUID ✅ (Completo 2026-01-22)

Migração das tabelas de optimization de TEXT notion_id para UUID:

**Migrations:**
- `20260122000000_add_account_uuid_to_optimization.sql` - Adiciona coluna, popula, cria FK
- `20260122100000_cleanup_optimization_account_id.sql` - Remove coluna antiga, renomeia

**Edge Functions Atualizadas (5):**
- `j_hub_optimization_analyze`
- `j_hub_optimization_transcribe`
- `j_hub_optimization_process`
- `j_hub_optimization_create_share`
- `j_hub_optimization_view_shared`

**Frontend Atualizado (6):**
- `src/types/optimization.ts`
- `src/hooks/useMyOptimizations.ts`
- `src/components/OptimizationRecorder.tsx`
- `src/pages/OptimizationNew.tsx`
- `src/pages/OptimizationEditor.tsx`
- `src/pages/Optimization.tsx`

### Fase 1: Edge Function Write-back ✅ (Completo 2026-01-22)

**Criado:** `j_hub_account_update`
- Recebe dados do frontend
- Faz PATCH na API do Notion
- Atualiza Supabase local
- Retorna sucesso/erro

### Fase 2: Interface de Contas ✅ (Completo 2026-01-22)

**Criado:**
- `src/pages/admin/AccountManagement.tsx` - Lista + filtros + formulário
- `src/components/admin/AccountForm.tsx` - Formulário com 5 abas
- `src/hooks/useAccountUpdate.ts` - Hook para PATCH

**Campos editáveis:**
- Básico: Conta, Status, Tier, Objetivos, Nicho
- Equipe: Gestor, Atendimento
- Plataformas: ID Meta Ads, ID Google Ads, ID TikTok Ads, ID GA4
- AI Context: Contexto para Otimização, Contexto para Transcrição
- Financeiro: Método de Pagamento, Verba Mensal Meta/Google

### Fase 3: Interface de Gerentes ✅ (Completo 2026-01-22)

**Criado:**
- `j_hub_manager_update` - Edge Function
- `src/pages/admin/ManagerManagement.tsx`
- `src/components/admin/ManagerForm.tsx`
- `src/hooks/useMyManagers.ts`
- `src/hooks/useManagerUpdate.ts`

### Não Mexer

- `j_ads_submit_ad` - Sistema de criativos (independente)
- `j_hub_notion_sync_*` - Sync existente (continua funcionando)

---

## 🔐 Self-Service (Futuro)

### Visão

Permitir que clientes finais gerenciem suas próprias campanhas com autonomia limitada.

### Fases Planejadas

| Fase | Descrição |
|------|-----------|
| **1. Onboarding** | Cadastro self-service de novos clientes |
| **2. Pagamentos** | Integração com gateway de pagamento |
| **3. Briefings** | Cliente cria briefings de campanha |
| **4. Aprovações** | Workflow de aprovação de criativos |
| **5. Relatórios** | Acesso a relatórios automatizados |

---

## 🌐 Multi-Plataforma (Futuro)

### Visão

Expandir além do Meta Ads para outras plataformas.

### Plataformas Planejadas

| Plataforma | Prioridade | Complexidade |
|------------|------------|--------------|
| **Google Ads** | Alta | Média |
| **TikTok Ads** | Média | Média |
| **LinkedIn Ads** | Baixa | Alta |
| **Pinterest Ads** | Baixa | Média |

### Pré-requisitos

- [ ] Abstração de métricas cross-platform
- [ ] Schema unificado para dados de anúncios
- [ ] Dashboards genéricos por objetivo (não por plataforma)

---

## 📋 Backlog Geral

### Alta Prioridade (Em Andamento)

- [x] Migração UUID para optimization tables ✅
- [x] Interface de Gestão de Contas (Fases 1-3) ✅
- [ ] Novos templates de Deck
- [ ] Dashboard de Criativos

### Média Prioridade

- [ ] Views SQL para performance
- [ ] Export PDF de Decks
- [ ] Integração Google Ads
- [ ] Dashboard de Saldos
- [ ] Validação Gestão de Contas com equipe (Fase 4)

### Baixa Prioridade

- [ ] Sistema de Insights
- [ ] Editor visual de Decks
- [ ] RLS (Row Level Security)
- [ ] Batch processing de áudios
- [ ] Remover sync Notion (Fase 5)

---

## Referências Técnicas

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Schema, Edge Functions, Patterns |
| [FUNCTIONS.md](./FUNCTIONS.md) | Funções operacionais do sistema |

---

### Fase 3.5: Dashboard Unificado Multi-Platform ✅ (Completo 2026-01-22)

- GeneralDashboard agora integra dados de Meta Ads, Google Ads e GA4
- Seletor de fonte: Unified | Meta | Google
- IDs passados via data chain: `useNotionClients` → `DashboardAccessControl` → `DashboardsDisplay` → `GeneralDashboard`
- RLS policies adicionadas para `j_rep_googleads_bronze` e `j_rep_ga4_bronze`
- Métricas unificadas: Investimento Total vs Sessões Totais (todas as fontes)

**Melhorias futuras documentadas:**
- Filtrar apenas `event_name = 'purchase'` para ROAS real
- Toggle de tráfego pago vs todas as fontes
- Breakdown por source/medium
- Comparativo de períodos

---

**Última atualização:** 2026-01-22
