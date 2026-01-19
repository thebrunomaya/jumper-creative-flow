# Roadmap - Jumper Flow Platform

> **Atualizado:** 2026-01-11 | **Versão:** v2.1.109

---

## Visão Geral

Este roadmap consolida todos os próximos passos do Jumper Hub, organizados por grandes áreas do sistema.

### Status por Área

| Área | Status | Progresso |
|------|--------|-----------|
| 🎨 **Dashboards & Criativos** | ✅ Fase 1-3 Completas | 60% |
| 🎙️ **Optimization System** | ✅ Produção | 90% |
| 📊 **Decks System** | ✅ Produção | 85% |
| 💰 **Alertas de Saldo** | ✅ Produção | 100% |
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

### Alta Prioridade

- [ ] Novos templates de Deck
- [ ] Dashboard de Criativos

### Média Prioridade

- [ ] Views SQL para performance
- [ ] Export PDF de Decks
- [ ] Integração Google Ads
- [ ] Dashboard de Saldos

### Baixa Prioridade

- [ ] Sistema de Insights
- [ ] Editor visual de Decks
- [ ] RLS (Row Level Security)
- [ ] Batch processing de áudios

---

## Referências Técnicas

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Schema, Edge Functions, Patterns |
| [FUNCTIONS.md](./FUNCTIONS.md) | Funções operacionais do sistema |

---

**Última atualização:** 2026-01-11
