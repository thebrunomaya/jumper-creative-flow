# Funções do Sistema - Jumper Hub

> **Atualizado:** 2026-01-11 | **Versão:** v2.1.109

Documentação de referência para funções operacionais do sistema.

---

## Índice

1. [Desenvolvimento Local (localdev)](#1-desenvolvimento-local-localdev)
2. [Alertas de Saldo Meta Ads](#2-alertas-de-saldo-meta-ads)
3. [Optimization System](#3-optimization-system)
4. [Decks System](#4-decks-system)
5. [Top Creatives System](#5-top-creatives-system)
6. [Dashboards System](#6-dashboards-system)

---

## 1. Desenvolvimento Local (localdev)

Scripts para setup e gerenciamento do ambiente de desenvolvimento local.

### Estrutura

```
localdev/
├── localdev.sh              # Menu interativo principal
├── 1-validate-env.sh        # Validação de ambiente
├── 2-backup-production.sh   # Backup do banco de produção
├── 3-setup-local-env.sh     # Setup completo (7 etapas)
└── 4-quick-reset.sh         # Reset rápido do banco
```

### Uso

```bash
# Menu interativo (recomendado)
./localdev.sh

# Scripts individuais
./localdev/1-validate-env.sh      # Validar Docker, Node, Supabase CLI
./localdev/2-backup-production.sh # Backup produção (pede senha)
./localdev/3-setup-local-env.sh   # Setup completo
./localdev/4-quick-reset.sh       # Reset rápido
```

### Credenciais Locais

| Campo | Valor |
|-------|-------|
| Email | `bruno@jumper.studio` |
| Senha | `senha123` |

### Endpoints

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Supabase Studio | http://127.0.0.1:54323 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Edge Functions | http://127.0.0.1:54321/functions/v1/ |

### Troubleshooting

**Docker não está rodando:**
```bash
# Abrir Docker Desktop, aguardar, executar:
./localdev/1-validate-env.sh
```

**Porta 8080 ocupada:**
```bash
kill -9 $(lsof -ti:8080)
```

**Dados corrompidos:**
```bash
./localdev/4-quick-reset.sh
```

---

## 2. Alertas de Saldo Meta Ads

Sistema automatizado para monitorar saldo de contas Meta Ads e alertar quando estiver em perigo.

### Arquitetura

```
Windsor.ai (sync diário)
    │
    ▼
j_rep_metaads_account_balance (Supabase)
    │
    │ Colunas GENERATED:
    │ - current_balance = (spend_cap - amount_spent) / 100
    │ - avg_daily_spend = spend_last_7d / 7
    │ - days_remaining = current_balance / avg_daily_spend
    │
    ▼
pg_cron (9:00 UTC / 6:00 BRT)
    │
    ▼
Edge Function: j_hub_balance_check_alerts
    │
    ▼
Webhook n8n → Slack/WhatsApp
```

### Tabelas

**j_rep_metaads_account_balance** - Dados de saldo

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta Meta Ads |
| `account_name` | TEXT | Nome da conta |
| `spend_cap` | BIGINT | Limite de gasto (centavos) |
| `amount_spent` | BIGINT | Já gasto (centavos) |
| `current_balance` | NUMERIC | **GENERATED** - Saldo em R$ |
| `days_remaining` | NUMERIC | **GENERATED** - Dias até acabar |
| `alert_threshold_days` | INTEGER | Threshold para alertar (default: 10) |
| `alert_enabled` | BOOLEAN | Se alertas estão ativos |

**j_hub_balance_alerts** - Histórico de alertas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta |
| `balance_at_alert` | NUMERIC | Saldo no momento |
| `days_remaining_at_alert` | NUMERIC | Dias restantes |
| `status` | ENUM | `pending`, `notified`, `resolved` |

### Configuração de Threshold

```sql
-- Definir threshold de 7 dias para uma conta
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 7
WHERE account_id = '1097627115593816';

-- Desabilitar alertas para uma conta
UPDATE j_rep_metaads_account_balance
SET alert_enabled = false
WHERE account_id = '1097627115593816';
```

**Thresholds recomendados:**

| Método Pagamento | Threshold | Razão |
|------------------|-----------|-------|
| Boleto | 5-7 dias | Tempo para gerar, pagar, compensar |
| Pix | 3-5 dias | Compensação imediata |
| Cartão | 3 dias | Cobrança automática |
| Faturamento | 7-10 dias | Processo de aprovação |

### Payload do Webhook

```json
{
  "account_id": "1097627115593816",
  "account_name": "Conta Example",
  "current_balance": 920.53,
  "days_remaining": 5,
  "avg_daily_spend": 184.10,
  "payment_method": "Boleto",
  "alert_date": "2026-01-11"
}
```

### Troubleshooting

**Alerta não disparou:**
```sql
-- Verificar dias restantes
SELECT account_name, days_remaining, alert_threshold_days
FROM j_rep_metaads_account_balance
WHERE date = (SELECT MAX(date) FROM j_rep_metaads_account_balance)
ORDER BY days_remaining ASC;

-- Verificar alertas ativos
SELECT * FROM j_hub_balance_alerts
WHERE status IN ('pending', 'notified');
```

**Resolver alerta manualmente:**
```sql
UPDATE j_hub_balance_alerts
SET status = 'resolved', resolved_at = now()
WHERE account_id = '1097627115593816'
  AND status = 'notified';
```

---

## 3. Optimization System

Sistema de transcrição e análise de otimizações de campanhas.

### Pipeline

```
Audio Upload → Transcribe → Improve → Extract → Analyze
     │            │           │          │         │
     │      Whisper API   Claude AI  Claude AI  Claude AI
     │            │           │          │         │
     ▼            ▼           ▼          ▼         ▼
  Storage    full_text    processed   extract   context
                             text       text     summary
```

### Edge Functions

| Function | Descrição |
|----------|-----------|
| `j_hub_optimization_transcribe` | Audio → Texto (Whisper API) |
| `j_hub_optimization_improve_transcript` | Melhoria do transcript com IA |
| `j_hub_optimization_extract` | Extração de dados estruturados |
| `j_hub_optimization_analyze` | Geração de análise |
| `j_hub_optimization_create_share` | Criar link público com senha |
| `j_hub_optimization_view_shared` | Visualizar optimization compartilhada |

### Tabelas

**j_hub_optimization_recordings** - Gravações

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `account_id` | TEXT | Notion ID da conta (⚠️ legacy) |
| `audio_file_path` | TEXT | Caminho no Storage |
| `platform` | TEXT | `meta` ou `google` |
| `transcription_status` | TEXT | pending/processing/completed/error |
| `share_enabled` | BOOLEAN | Compartilhamento ativo |
| `public_slug` | TEXT | Slug para URL pública |
| `password_hash` | TEXT | Hash da senha (PBKDF2) |

**j_hub_optimization_transcripts** - Transcrições

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `full_text` | TEXT | Transcrição bruta (Whisper) |
| `processed_text` | TEXT | Versão melhorada (Claude) |
| `original_text` | TEXT | Backup antes de edições |

**j_hub_optimization_extracts** - Extrações estruturadas

**j_hub_optimization_context** - Contexto da análise

### Componentes Frontend

| Componente | Função |
|------------|--------|
| `OptimizationNew.tsx` | Criar nova otimização |
| `Optimization.tsx` | Listar otimizações |
| `OptimizationEditor.tsx` | Editar/visualizar |
| `TranscriptViewer` | Visualizar/editar transcrição |
| `ExtractViewer` | Visualizar extração |

### Status Flow

```
pending → processing → completed
                    ↘ error
```

---

## 4. Decks System

Sistema de geração de apresentações (decks) com IA.

### Pipeline

```
Markdown Input → Stage 1: Analyze → Stage 2: Review → Stage 3: Generate
       │              │                  │                   │
       │      j_hub_deck_analyze    User approval    j_hub_deck_generate
       │              │                  │                   │
       ▼              ▼                  ▼                   ▼
   markdown      generation_plan    Confirmação        html_output
```

### Edge Functions

| Function | Descrição |
|----------|-----------|
| `j_hub_deck_create` | Criar novo deck |
| `j_hub_deck_analyze` | Stage 1: Análise do conteúdo |
| `j_hub_deck_generate` | Stage 3: Geração do HTML |
| `j_hub_deck_refine` | Refinar deck existente |
| `j_hub_deck_upload_html` | Upload direto de HTML |
| `j_hub_deck_create_share` | Criar link público |
| `j_hub_deck_view_shared` | Visualizar deck compartilhado |

### Tabelas

**j_hub_decks** - Decks principais

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `account_id` | UUID | ID da conta (⚠️ moderno - UUID) |
| `title` | TEXT | Título do deck |
| `type` | TEXT | `report`, `plan`, `pitch` |
| `brand_identity` | TEXT | `jumper`, `koko` |
| `markdown_source` | TEXT | Markdown fonte |
| `html_output` | TEXT | HTML gerado (para srcDoc) |
| `analysis_status` | TEXT | Status do Stage 1 |
| `generation_status` | TEXT | Status do Stage 3 |
| `slug` | TEXT | Slug para URL pública |
| `password_hash` | TEXT | Hash da senha |

**j_hub_deck_versions** - Versionamento

### Rendering Pattern

**CRÍTICO:** Sempre usar `srcDoc`, NÃO URLs do Storage.

```typescript
// ✅ CORRETO
{deck.html_output ? (
  <iframe srcDoc={deck.html_output} />
) : deck.file_url ? (
  <iframe src={deck.file_url} />  // Fallback only
) : null}

// ❌ ERRADO - Storage URLs têm restrições CSP
<iframe src={deck.file_url} />
```

### Asset URLs

**CRÍTICO:** URLs de assets devem ser ABSOLUTAS.

```html
<!-- ✅ CORRETO -->
<img src="https://hub.jumper.studio/decks/identities/jumper/logos/logo.png">

<!-- ❌ ERRADO -->
<img src="/decks/identities/jumper/logos/logo.png">
```

### Brand Identities

```
public/decks/identities/
├── jumper/
│   ├── logos/
│   ├── colors.json
│   └── fonts/
└── koko/
    └── ...
```

---

## 5. Top Creatives System

Exibe os 3 criativos de melhor performance em todos os dashboards.

### Arquitetura

```
j_rep_metaads_bronze (Windsor data)
         │
         │ Aggregation by creative_id
         ▼
   useTopCreatives Hook
         │
         ▼
┌────────────────────────────────┐
│  TopCreativesSection           │
│  ├── TopCreativeCard (🥇)      │
│  ├── TopCreativeCard (🥈)      │
│  └── TopCreativeCard (🥉)      │
└────────────────────────────────┘
         │
         ▼
   CreativeDetailModal (on click)
```

### Componentes

| Componente | Função |
|------------|--------|
| `TopCreativesSection` | Seção principal com 3 cards |
| `TopCreativeCard` | Card individual com medalha |
| `CreativeDetailModal` | Modal com breakdown por ad_id |

### Uso

```typescript
<TopCreativesSection
  accountId={metaAdsId}
  objective="vendas"
  dateStart={startDate}
  dateEnd={endDate}
/>
```

### Objective Mapping

| Dashboard | Objective | Métrica de Ranking |
|-----------|-----------|-------------------|
| Sales | `vendas` | ROAS |
| Traffic | `trafego` | Link Clicks |
| Leads | `leads` | CPL (invertido) |
| Engagement | `engajamento` | Engajamento |
| Video Views | `video` | Video Views |
| Conversions | `conversoes` | Purchases |

### Threshold de Spend

Criativos devem ter **≥10% do spend total do período** para aparecer no ranking.

### Sistema de Thumbnails

Thumbnails permanentes sincronizadas no Supabase Storage:

```
criativos/thumbnails/{account_id}/{creative_id}.{ext}
```

**Prioridade:** `thumbnail_storage_url` > `thumbnail_url` > `image_url`

---

## 6. Dashboards System

12 dashboards especializados por objetivo de campanha.

### Dashboards Disponíveis

| Dashboard | Arquivo | Objective |
|-----------|---------|-----------|
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

### Estrutura de Arquivos

```
src/components/dashboards/
├── GeneralDashboard.tsx
├── SalesDashboard.tsx
├── TrafficDashboard.tsx
├── LeadsDashboard.tsx
├── EngagementDashboard.tsx
├── BrandAwarenessDashboard.tsx
├── ReachDashboard.tsx
├── VideoViewsDashboard.tsx
├── ConversionsDashboard.tsx
├── SeguidoresDashboard.tsx
├── ConversasDashboard.tsx
├── CadastrosDashboard.tsx
├── TopCreativesSection.tsx
├── TopCreativeCard.tsx
└── CreativeDetailModal.tsx
```

### Multi-Account Dashboard

**Rota:** `/dashboards/multi`
**Componente:** `DashboardsMultiAccountPage.tsx`
**Edge Function:** `j_hub_dashboards_multi_account`

Agrega métricas de múltiplas contas para usuários admin/staff.

### Fonte de Dados

Todos os dashboards consomem dados de `j_rep_metaads_bronze` (sincronizado via Windsor.ai).

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Schema, Edge Functions, Patterns técnicos |
| [ROADMAP.md](./ROADMAP.md) | Planejamento e próximos passos |
| [CLAUDE.md](../CLAUDE.md) | Configuração do projeto |

---

**Última atualização:** 2026-01-11
