# Roadmap Consolidado: Criativos & Insights

> **Atualizado:** 2024-12-13
> **Versão:** v2.1.83
> **Status:** Em desenvolvimento

---

## Resumo Executivo

Este roadmap consolida três iniciativas relacionadas em um plano único:

1. **Top Criativos** - Seção nos dashboards existentes (parcialmente implementado)
2. **Dashboard de Performance de Criativos** - Página dedicada com visão consolidada
3. **Sistema de Insights** - Análises automatizadas e contextualizadas

**Objetivo Final:** Transformar dados brutos de Meta Ads em visualizações de criativos com performance consolidada e insights acionáveis.

---

## Arquitetura de Dados

### Conceito: Criativo vs Instância

| Conceito | Identificador | Descrição |
|----------|---------------|-----------|
| **Criativo** | `creative_id` | A peça criativa em si (mídia + copy + CTA). Existe independente de onde é veiculado. |
| **Instância** | `ad_id` | Cada veiculação do criativo em um adset/campanha específico. Onde a performance é medida. |

**Relação 1:N:**
```
Criativo (creative_id: 1413865993685680)
├── Instância 1 (ad_id: 120234009290470638) → Adset "ROAS Top8"
├── Instância 2 (ad_id: 120234009290470639) → Adset "Conversão Broad"
└── Instância 3 (ad_id: 120234009290470640) → Adset "Remarketing"
```

### Tabela Principal: `j_rep_metaads_bronze`

**Campos de Identificação:**
```sql
account_id TEXT              -- ID da conta
ad_id TEXT                   -- ID da instância (ad)
creative_id TEXT             -- ID do criativo (agrupa instâncias)
```

**Campos de Criativo/Mídia:**
```sql
ad_name TEXT                 -- Nome do anúncio
ad_object_type TEXT          -- Tipo: VIDEO, SHARE, CAROUSEL
body TEXT                    -- Texto principal do anúncio
title TEXT                   -- Título/headline
link TEXT                    -- URL de destino
image_url TEXT               -- URL da imagem (expira)
thumbnail_url TEXT           -- Thumbnail de vídeos (expira)
thumbnail_storage_url TEXT   -- URL permanente no Storage (não expira)
facebook_permalink_url TEXT  -- Link permanente do post no FB
instagram_permalink_url TEXT -- Link permanente do post no IG
website_destination_url TEXT -- URL de destino configurada
url_tags TEXT                -- UTMs configuradas
```

**Campos de Campanha/Adset:**
```sql
campaign_id TEXT
campaign TEXT                -- Nome da campanha
campaign_status TEXT
campaign_daily_budget NUMERIC(12,2)
adset_id TEXT
adset_name TEXT
adset_status TEXT
adset_daily_budget NUMERIC(12,2)
objective TEXT
```

**Campos de Métricas:**
```sql
date DATE
impressions BIGINT
reach BIGINT
clicks BIGINT
link_clicks BIGINT
spend NUMERIC(12,2)
cpc NUMERIC(10,4)            -- Cost per Click
cpm NUMERIC(10,4)            -- Cost per Mille
ctr NUMERIC(8,6)             -- Click Through Rate
actions_purchase BIGINT
action_values_omni_purchase NUMERIC(12,2)
action_values_add_to_cart NUMERIC(10,2)
-- + outros campos de ações
```

**Índices Criados:**
```sql
CREATE INDEX idx_metaads_bronze_creative_id
ON j_rep_metaads_bronze(creative_id);

CREATE INDEX idx_metaads_bronze_creative_account_date
ON j_rep_metaads_bronze(creative_id, account_id, date);
```

---

## Status Geral

| Módulo | Status | Progresso |
|--------|--------|-----------|
| Query Windsor | ✅ Atualizada | 100% |
| Schema do Banco | ✅ Atualizado | 100% |
| Top Criativos (SalesDashboard) | ⚠️ Parcial | 80% |
| Sistema de Thumbnails Permanentes | ⏳ Pendente | 0% |
| Views SQL | ⏳ Pendente | 0% |
| Dashboard de Criativos (Frontend) | ⏳ Pendente | 0% |
| Sistema de Insights | 🔒 Bloqueado | 0% |
| Segurança (RLS) | 🔒 CRÍTICO | 0% |

---

## FASE 0: Segurança (BLOQUEADOR)

> **CRÍTICO:** Implementar ANTES de qualquer feature de Insights

### Problema
Dados de métricas (`j_rep_metaads_bronze`) acessíveis por qualquer usuário autenticado. Gerente da Conta A pode ver dados da Conta B.

### Solução

**1. Criar tabela de mapeamento:**
```sql
CREATE TABLE j_ads_user_account_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id TEXT NOT NULL,
  access_level TEXT NOT NULL, -- 'read', 'write', 'admin'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Popular com dados existentes
INSERT INTO j_ads_user_account_access (user_id, account_id, access_level)
SELECT
  u.id as user_id,
  unnest(string_to_array(m.contas, ',')) as account_id,
  'read' as access_level
FROM auth.users u
JOIN j_hub_notion_db_managers m ON m.email = u.email
WHERE m.ativo = true;
```

**2. Aplicar RLS:**
```sql
ALTER TABLE j_rep_metaads_bronze ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their accounts data"
ON j_rep_metaads_bronze FOR SELECT
USING (
  account_id IN (
    SELECT account_id FROM j_ads_user_account_access
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins see all data"
ON j_rep_metaads_bronze FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_notion_db_managers
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND tipo = 'admin' AND ativo = true
  )
);
```

### Checklist Fase 0
- [ ] Criar `j_ads_user_account_access`
- [ ] Popular com dados existentes
- [ ] Aplicar RLS em `j_rep_metaads_bronze`
- [ ] Aplicar RLS em `j_ads_optimization_context`
- [ ] Testar isolamento (usuário normal vs admin)
- [ ] Validar queries existentes continuam funcionando

---

## FASE 1: Top Criativos nos Dashboards

> **Status:** 80% implementado - Falta resolver problema de imagens

### O que já existe (v2.1.82)

| Componente | Status | Arquivo |
|------------|--------|---------|
| TopCreativeCard | ✅ | `src/components/dashboards/TopCreativeCard.tsx` |
| TopCreativesSection | ✅ | `src/components/dashboards/TopCreativesSection.tsx` |
| useTopCreatives | ✅ | `src/hooks/useTopCreatives.ts` |
| creativeRankingMetrics | ✅ | `src/utils/creativeRankingMetrics.ts` |
| Integração SalesDashboard | ✅ | `src/components/dashboards/SalesDashboard.tsx` |

### Problema: Thumbnails Expiram

URLs de thumbnail do Meta expiram em 1-7 dias:
```
https://scontent-fra3-1.xx.fbcdn.net/v/t15.13418-10/xxx.jpg?oh=TOKEN&oe=EXPIRATION
```

### 1.1 Fallback Inteligente (Curto prazo)

Melhorar UX mesmo sem imagem:

```typescript
// Prioridade de imagem
const imageUrl = creative.thumbnail_storage_url
  || creative.thumbnail_url
  || creative.image_url
  || null;

// Placeholder por tipo
if (!imageUrl) {
  switch (creative.ad_object_type) {
    case 'VIDEO': return <VideoPlaceholder />;
    case 'CAROUSEL': return <CarouselPlaceholder />;
    default: return <ImagePlaceholder />;
  }
}
```

**Arquivos a modificar:**
- `src/components/dashboards/TopCreativeCard.tsx`

### 1.2 Rollout para outros Dashboards

Após validar no SalesDashboard:
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

### Checklist Fase 1
- [x] Componentes base implementados
- [x] Hook de dados funcionando
- [x] Integração com SalesDashboard
- [ ] Implementar fallback inteligente
- [ ] Rollout para todos os dashboards

---

## FASE 2: Sistema de Thumbnails Permanentes

> **Objetivo:** URLs que nunca expiram

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

### 2.1 Criar Bucket no Supabase Storage

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('criativos', 'criativos', true);
```

**Estrutura:**
```
storage/criativos/
└── thumbnails/
    └── {account_id}/
        └── {creative_id}.jpg
```

### 2.2 Lógica de Sync

```typescript
async function syncCreativeThumbnails(windsorRows: WindsorRow[]) {
  for (const row of windsorRows) {
    const { creative_id, account_id, thumbnail_url } = row;

    // 1. Verificar se já existe
    const { data: existing } = await supabase
      .from('j_rep_metaads_bronze')
      .select('thumbnail_storage_url')
      .eq('creative_id', creative_id)
      .not('thumbnail_storage_url', 'is', null)
      .limit(1)
      .single();

    if (existing?.thumbnail_storage_url) continue;

    // 2. Baixar do Meta CDN
    const imageResponse = await fetch(thumbnail_url);
    const imageBuffer = await imageResponse.arrayBuffer();

    // 3. Upload para Storage (path determinístico)
    const storagePath = `thumbnails/${account_id}/${creative_id}.jpg`;

    await supabase.storage
      .from('criativos')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    // 4. Gerar URL pública permanente
    const { data: { publicUrl } } = supabase.storage
      .from('criativos')
      .getPublicUrl(storagePath);

    // 5. Atualizar registros desse creative_id
    await supabase
      .from('j_rep_metaads_bronze')
      .update({ thumbnail_storage_url: publicUrl })
      .eq('creative_id', creative_id);
  }
}
```

### 2.3 Estimativa de Storage

| Escala | Tamanho | Custo |
|--------|---------|-------|
| 1.000 criativos | ~50MB | Incluído |
| 10.000 criativos | ~500MB | Incluído |
| 20.000 criativos | ~1GB | Limite free tier |

### Decisões Pendentes

1. **Trigger vs Cron?**
   - Trigger: Imediato, pode impactar performance
   - Cron: Batch, mais eficiente, delay até 24h

2. **Formato de armazenamento?**
   - Original vs WebP (30% menor, requer processamento)

3. **Política de retenção?**
   - Manter imagens de anúncios antigos?
   - Cleanup após X dias sem veiculação?

### Checklist Fase 2
- [ ] Criar bucket `criativos` no Storage
- [ ] Implementar Edge Function ou n8n workflow
- [ ] Testar sync com dados reais
- [ ] Popular `thumbnail_storage_url`
- [ ] Validar URLs permanentes funcionam

---

## FASE 3: Views SQL para Dashboard

### 3.1 View: Performance por Criativo (Consolidada)

```sql
CREATE OR REPLACE VIEW v_creative_performance AS
SELECT
  creative_id,
  account_id,
  account_name,
  ad_object_type,

  -- Thumbnail (preferir storage, fallback para original)
  COALESCE(
    MAX(thumbnail_storage_url),
    MAX(thumbnail_url),
    MAX(image_url)
  ) as thumbnail_url,

  -- Permalinks
  MAX(facebook_permalink_url) as facebook_permalink_url,
  MAX(instagram_permalink_url) as instagram_permalink_url,

  -- Copy
  MAX(body) as body,
  MAX(title) as title,

  -- Agregações
  COUNT(DISTINCT ad_id) as total_instancias,
  SUM(impressions) as total_impressions,
  SUM(reach) as total_reach,
  SUM(clicks) as total_clicks,
  SUM(link_clicks) as total_link_clicks,
  SUM(spend) as total_spend,
  SUM(actions_purchase) as total_purchases,
  SUM(action_values_omni_purchase) as total_revenue,

  -- Calculados
  CASE WHEN SUM(impressions) > 0
    THEN SUM(clicks)::float / SUM(impressions)
  END as ctr,
  CASE WHEN SUM(clicks) > 0
    THEN SUM(spend) / SUM(clicks)
  END as cpc,
  CASE WHEN SUM(actions_purchase) > 0
    THEN SUM(spend) / SUM(actions_purchase)
  END as cpa,
  CASE WHEN SUM(spend) > 0
    THEN SUM(action_values_omni_purchase) / SUM(spend)
  END as roas,

  -- Período
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
  creative_id,
  ad_id,
  ad_name,
  adset_id,
  adset_name,
  adset_status,
  campaign_id,
  campaign,
  campaign_status,
  objective,
  date,
  impressions,
  clicks,
  spend,
  actions_purchase,
  action_values_omni_purchase,
  CASE WHEN spend > 0
    THEN action_values_omni_purchase / spend
  END as roas,
  CASE WHEN actions_purchase > 0
    THEN spend / actions_purchase
  END as cpa
FROM j_rep_metaads_bronze
WHERE creative_id IS NOT NULL;
```

### Checklist Fase 3
- [ ] Criar `v_creative_performance`
- [ ] Criar `v_creative_instances`
- [ ] Testar queries com dados reais
- [ ] Validar performance (índices)

---

## FASE 4: Dashboard de Performance de Criativos

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
│       ├── CreativeFilters.tsx
│       └── CreativeMetricsBadge.tsx
└── hooks/
    ├── useCreativePerformance.ts
    └── useCreativeInstances.ts
```

### Wireframe do Card

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │         [THUMBNAIL]          │  │
│  │                               │  │
│  │         VIDEO                │  │
│  └───────────────────────────────┘  │
│                                     │
│  AD28 - Video Rebelde               │
│  3 instâncias ativas                │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │ ROAS    │ │ CPA     │           │
│  │ 2.4x    │ │ R$ 45   │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  Spend: R$ 5.200 │ Purchases: 115   │
└─────────────────────────────────────┘
```

### Funcionalidades

- [ ] Grid responsivo de cards com thumbnails
- [ ] Filtro por conta
- [ ] Filtro por período (últimos 7d, 30d, custom)
- [ ] Filtro por tipo (VIDEO, SHARE, CAROUSEL)
- [ ] Ordenação (spend, ROAS, CPA, purchases)
- [ ] Click no card → modal com breakdown por instância
- [ ] Click na thumbnail → abre permalink (FB ou IG)
- [ ] Fallback visual se thumbnail falhar

### Checklist Fase 4
- [ ] Criar `CreativePerformancePage.tsx`
- [ ] Implementar `useCreativePerformance.ts`
- [ ] Implementar `useCreativeInstances.ts`
- [ ] Criar componentes de grid e cards
- [ ] Criar modal de detalhes
- [ ] Implementar filtros
- [ ] Adicionar rota no router
- [ ] Adicionar link no menu

---

## FASE 5: Sistema de Insights

> **Pré-requisito:** FASE 0 (Segurança/RLS) deve estar completa

### 5.1 Insights Comparativos

**Objetivo:** Comparar período atual vs anterior automaticamente

**Componentes:**
```
src/components/reports/insights/
├── InsightPanel.tsx
├── ComparativeMetricsCard.tsx
├── TrendIndicator.tsx
└── NarrativeGenerator.tsx
```

**Entrega:**
```
📊 Destaques da Semana
✅ ROAS subiu 28% (2.1x → 2.7x) - Melhor semana do mês!
⚠️ CPC aumentou 15% (R$1.20 → R$1.38) - Acima do benchmark
🔵 Impressões cresceram 45% - Alcance em expansão
```

### 5.2 Detecção de Anomalias

**Objetivo:** Identificar problemas automaticamente

**Componentes:**
```
src/components/reports/alerts/
├── AlertPanel.tsx
├── AnomalyCard.tsx
└── ActionRecommendation.tsx

src/utils/
├── anomalyDetection.ts
└── metricCorrelation.ts
```

**Algoritmos:**
- Z-score para outliers (±2 desvios padrão)
- Moving average para tendências
- Correlações suspeitas (CTR alto + conversão baixa = problema LP)

**Entrega:**
```
🚨 Alertas Críticos
❌ Campanha X: CPA 3x acima do normal (R$ 240 vs R$ 80 médio)
💡 Sugestão: Revisar ou pausar esta campanha
🔍 Análise: CTR bom (2.1%) mas conversão baixa (0.8%)
   Possível causa: Problema na landing page
```

### 5.3 Contexto Automático

**Objetivo:** Capturar contexto de mudanças

**Novas tabelas:**
```sql
CREATE TABLE j_ads_quick_notes (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  change_detected TEXT,
  note TEXT,
  tags TEXT[],
  related_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE j_ads_detected_changes (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL,
  change_type TEXT,
  change_magnitude NUMERIC,
  detected_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);
```

### 5.4 Integração com OPTIMIZER

**Objetivo:** Insights contextualizados com gravações de áudio

**Tabelas do OPTIMIZER (já existem):**
- `j_ads_optimization_recordings`
- `j_ads_optimization_transcripts`
- `j_ads_optimization_context`

**Entrega:**
```
💡 CPA subiu 45% esta semana (R$ 80 → R$ 116)

🎯 Contexto (Otimização 07/Out):
Gestor iniciou teste de cold audience há 3 dias.

📋 Estratégia:
- Tipo: Teste de audiência
- Duração: 7 dias (dia 3/7)
- Critério: 50 conversões + CPA < R$ 150

✅ Progresso: 18/50 conversões, CPA R$ 116 (dentro do esperado)

💡 Recomendação: Manter estratégia conforme planejado.
```

### Checklist Fase 5
- [ ] Implementar `useComparativeMetrics`
- [ ] Implementar `anomalyDetection.ts`
- [ ] Implementar `metricCorrelation.ts`
- [ ] Criar componentes de insights
- [ ] Criar componentes de alertas
- [ ] Criar schemas de notas/mudanças
- [ ] Integrar com OPTIMIZER context
- [ ] Testes com dados reais

---

## Query Windsor Atual

**61 campos - Versão final:**

```
https://connectors.windsor.ai/facebook?api_key=KEY&date_preset=last_1d&fields=account_currency,account_id,account_name,action_values_add_to_cart,action_values_omni_purchase,actions_add_payment_info,actions_add_to_cart,actions_comment,actions_complete_registration,actions_initiate_checkout,actions_landing_page_view,actions_lead,actions_like,actions_onsite_conversion_messaging_conversation_started_7d,actions_onsite_conversion_post_save,actions_page_engagement,actions_photo_view,actions_post,actions_post_engagement,actions_post_reaction,actions_purchase,actions_view_content,ad_id,ad_name,ad_object_type,adset_daily_budget,adset_id,adset_name,adset_status,body,campaign,campaign_daily_budget,campaign_id,campaign_status,clicks,cpc,cpm,creative_id,ctr,date,facebook_permalink_url,frequency,image_url,impressions,instagram_permalink_url,link,link_clicks,objective,reach,spend,thumbnail_url,title,url_tags,video_p100_watched_actions_video_view,video_p25_watched_actions_video_view,video_p50_watched_actions_video_view,video_p75_watched_actions_video_view,video_p95_watched_actions_video_view,video_play_actions_video_view,video_thruplay_watched_actions_video_view,website_destination_url
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| RLS não implementado corretamente | Média | **CRÍTICO** | Testes automatizados de isolamento |
| Thumbnails expiram antes do sync | Alta | Médio | Sync diário + fallback visual |
| Performance degradada com views | Baixa | Médio | Índices + materialização |
| Windsor não popula creative_id | Baixa | Alto | Validar após próxima execução |
| Algoritmos com falsos positivos | Alta | Médio | Thresholds configuráveis |

---

## Critérios de Sucesso

### Técnicos
- [ ] 100% das queries respeitam RLS
- [ ] Latência <500ms para views
- [ ] 90%+ dos criativos com thumbnail permanente
- [ ] 0 erros críticos em 1 semana

### Negócio
- [ ] Gestores identificam top criativos em <30s
- [ ] NPS de comunicação: 6/10 → 8+/10
- [ ] Tempo de interpretação: 15min → 5min
- [ ] Ações tomadas: 30% → 60%+ dos insights

---

## Próxima Sessão: Checklist

### Verificações Iniciais

1. Windsor rodou com query atualizada?
```sql
SELECT COUNT(*) FROM j_rep_metaads_bronze
WHERE creative_id IS NOT NULL;
```

2. Thumbnails estão sendo populados?
```sql
SELECT creative_id, thumbnail_url, ad_object_type
FROM j_rep_metaads_bronze
WHERE date = CURRENT_DATE - 1 AND creative_id IS NOT NULL
LIMIT 10;
```

### Se dados disponíveis

3. Implementar fallback inteligente (Fase 1.1)
4. Criar bucket e sync de thumbnails (Fase 2)
5. Criar views SQL (Fase 3)

### Se dados não disponíveis

3. Verificar configuração Windsor
4. Implementar fallback como mitigação
5. Planejar RLS em paralelo

---

## Referências

| Arquivo | Descrição |
|---------|-----------|
| `_tmp-bruno/windsor-query-atualizada.txt` | Query Windsor atual |
| `supabase/migrations/20251211224407_*.sql` | Migration de campos |
| `src/components/dashboards/TopCreative*.tsx` | Componentes existentes |
| `src/hooks/useTopCreatives.ts` | Hook existente |

---

**Próximo Passo Recomendado:** Verificar se Windsor populou `creative_id` e decidir entre Fase 1.1 (fallback) ou Fase 2 (thumbnails permanentes).
