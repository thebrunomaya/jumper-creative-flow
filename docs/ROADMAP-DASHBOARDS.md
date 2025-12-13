# Roadmap: Dashboards & Criativos

> **Atualizado:** 2024-12-13
> **Versão:** v2.1.89
> **Status:** Fase 2 completa

---

## Resumo Executivo

Este roadmap consolida as iniciativas de visualização de criativos e insights:

1. **Top Criativos** - Seção nos dashboards existentes ✅
2. **Sistema de Thumbnails Permanentes** - URLs que nunca expiram ✅
3. **Dashboard de Performance de Criativos** - Página dedicada (futuro)
4. **Sistema de Insights** - Análises automatizadas (futuro)

---

## Status Geral

| Fase | Módulo | Status | Progresso |
|------|--------|--------|-----------|
| - | Query Windsor | ✅ Completo | 100% |
| - | Schema do Banco | ✅ Completo | 100% |
| 1 | Top Criativos (SalesDashboard) | ✅ Completo | 100% |
| 2 | Sistema de Thumbnails Permanentes | ✅ Completo | 100% |
| 3 | Views SQL | ⏳ Pendente | 0% |
| 4 | Dashboard de Criativos (Frontend) | ⏳ Pendente | 0% |
| 5 | Sistema de Insights | ⏳ Pendente | 0% |
| 6 | Segurança (RLS) | ⏳ Futuro | 0% |

---

## ✅ FASE 1: Top Criativos nos Dashboards (COMPLETO)

### Implementado (v2.1.82 - v2.1.89)

| Componente | Arquivo |
|------------|---------|
| TopCreativeCard | `src/components/dashboards/TopCreativeCard.tsx` |
| TopCreativesSection | `src/components/dashboards/TopCreativesSection.tsx` |
| useTopCreatives | `src/hooks/useTopCreatives.ts` |
| creativeRankingMetrics | `src/utils/creativeRankingMetrics.ts` |
| Integração SalesDashboard | `src/components/dashboards/SalesDashboard.tsx` |

### Features Implementadas

- [x] Componentes base (cards com medalhas 🥇🥈🥉)
- [x] Hook de dados com agregação por ad_id
- [x] Métricas derivadas (ROAS, CTR, CPC, CPL, CPA, etc)
- [x] Ranking por objetivo do dashboard
- [x] Detecção de catálogos (templates `{{product.name}}`)
- [x] Badge "Catálogo" com ícone ShoppingBag
- [x] Placeholder astronauta para catálogos
- [x] Fallback inteligente de thumbnails

### Rollout para outros Dashboards (Pendente)

- [ ] TrafficDashboard.tsx
- [ ] LeadsDashboard.tsx
- [ ] EngagementDashboard.tsx
- [ ] BrandAwarenessDashboard.tsx
- [ ] ReachDashboard.tsx
- [ ] VideoViewsDashboard.tsx
- [ ] ConversionsDashboard.tsx
- [ ] SeguidoresDashboard.tsx
- [ ] ConversasDashboard.tsx
- [ ] CadastrosDashboard.tsx
- [ ] GeneralDashboard.tsx

---

## ✅ FASE 2: Sistema de Thumbnails Permanentes (COMPLETO)

### Implementado (v2.1.87)

| Item | Status |
|------|--------|
| Bucket `criativos` no Supabase Storage | ✅ Criado |
| Edge Function `sync-creative-thumbnails` | ✅ Deployed |
| Cron job diário (6h BRT) | ✅ Configurado |
| Thumbnails sincronizados | ✅ 377/377 (100%) |

### Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Windsor Sync   │────▶│  Edge Function   │────▶│ Supabase Storage│
│  (thumbnail_url)│     │  sync-thumbnails │     │ criativos/      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │ j_rep_metaads_   │
                       │ bronze           │
                       │ (thumbnail_      │
                       │  storage_url)    │
                       └──────────────────┘
```

### Estrutura no Storage

```
storage/criativos/
└── thumbnails/
    └── {account_id}/
        └── {creative_id}.{jpg|png|webp}
```

### Cron Job

```sql
-- Roda todo dia às 6h BRT (9h UTC)
SELECT cron.schedule(
  'sync-creative-thumbnails',
  '0 9 * * *',
  $$ SELECT net.http_post(...) $$
);
```

### Chamada Manual

```bash
curl -X POST "https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/sync-creative-thumbnails" \
  -H "Content-Type: application/json" \
  -d '{"limit": 200}'
```

---

## ⏳ FASE 3: Views SQL para Dashboard

### 3.1 View: Performance por Criativo (Consolidada)

```sql
CREATE OR REPLACE VIEW v_creative_performance AS
SELECT
  creative_id,
  account_id,
  account_name,
  ad_object_type,
  COALESCE(MAX(thumbnail_storage_url), MAX(thumbnail_url), MAX(image_url)) as thumbnail_url,
  MAX(facebook_permalink_url) as facebook_permalink_url,
  MAX(instagram_permalink_url) as instagram_permalink_url,
  MAX(body) as body,
  MAX(title) as title,
  COUNT(DISTINCT ad_id) as total_instancias,
  SUM(impressions) as total_impressions,
  SUM(reach) as total_reach,
  SUM(clicks) as total_clicks,
  SUM(spend) as total_spend,
  SUM(actions_purchase) as total_purchases,
  SUM(action_values_omni_purchase) as total_revenue,
  -- Calculados
  CASE WHEN SUM(spend) > 0 THEN SUM(action_values_omni_purchase) / SUM(spend) END as roas,
  CASE WHEN SUM(actions_purchase) > 0 THEN SUM(spend) / SUM(actions_purchase) END as cpa,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM j_rep_metaads_bronze
WHERE creative_id IS NOT NULL
GROUP BY creative_id, account_id, account_name, ad_object_type;
```

### 3.2 View: Instâncias de um Criativo

```sql
CREATE OR REPLACE VIEW v_creative_instances AS
SELECT
  creative_id, ad_id, ad_name, adset_name, campaign, objective, date,
  impressions, clicks, spend, actions_purchase, action_values_omni_purchase,
  CASE WHEN spend > 0 THEN action_values_omni_purchase / spend END as roas
FROM j_rep_metaads_bronze
WHERE creative_id IS NOT NULL;
```

### Checklist
- [ ] Criar `v_creative_performance`
- [ ] Criar `v_creative_instances`
- [ ] Testar queries
- [ ] Validar performance

---

## ⏳ FASE 4: Dashboard de Performance de Criativos

### Estrutura de Arquivos

```
src/
├── pages/
│   └── CreativePerformancePage.tsx
├── components/
│   └── creatives/
│       ├── CreativeGrid.tsx
│       ├── CreativeCard.tsx
│       ├── CreativeDetailModal.tsx
│       └── CreativeFilters.tsx
└── hooks/
    ├── useCreativePerformance.ts
    └── useCreativeInstances.ts
```

### Funcionalidades

- [ ] Grid responsivo de cards
- [ ] Filtro por conta
- [ ] Filtro por período
- [ ] Filtro por tipo (VIDEO, SHARE, CAROUSEL)
- [ ] Ordenação (spend, ROAS, CPA)
- [ ] Modal com breakdown por instância
- [ ] Link para permalink (FB/IG)

---

## ⏳ FASE 5: Sistema de Insights

### 5.1 Insights Comparativos
Comparar período atual vs anterior automaticamente.

### 5.2 Detecção de Anomalias
Z-score para outliers, moving average para tendências.

### 5.3 Integração com OPTIMIZER
Contexto das otimizações nas análises.

---

## ⏳ FASE 6: Segurança (RLS) - Futuro

Adiada. Dados não são sensíveis entre membros da equipe.

---

## Arquitetura de Dados

### Conceito: Criativo vs Instância

| Conceito | Identificador | Descrição |
|----------|---------------|-----------|
| **Criativo** | `creative_id` | A peça criativa (mídia + copy). Existe independente de onde é veiculado. |
| **Instância** | `ad_id` | Cada veiculação em um adset/campanha. Onde a performance é medida. |

### Tabela Principal: `j_rep_metaads_bronze`

**Campos de Criativo/Mídia:**
```sql
creative_id TEXT              -- ID do criativo (agrupa instâncias)
ad_object_type TEXT           -- Tipo: VIDEO, SHARE, CAROUSEL
thumbnail_url TEXT            -- Thumbnail de vídeos (expira)
thumbnail_storage_url TEXT    -- URL permanente no Storage ✅
image_url TEXT                -- URL da imagem (expira)
```

---

## Query Windsor

**61 campos - Versão final:**
```
fields=account_currency,account_id,account_name,...,creative_id,ad_object_type,...,thumbnail_url,...
```

Ver arquivo: `_tmp-bruno/windsor-query-atualizada.txt`

---

## Referências

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/sync-creative-thumbnails/` | Edge Function de sync |
| `src/components/dashboards/TopCreative*.tsx` | Componentes de cards |
| `src/hooks/useTopCreatives.ts` | Hook de dados |
| `public/images/catalog-placeholder.png` | Placeholder para catálogos |

---

**Última atualização:** 2024-12-13 (v2.1.89)
