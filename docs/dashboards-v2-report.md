# Relatório: Dashboards Integrados V2

> **Data:** 2026-01-21
> **Status:** Em desenvolvimento - Bloqueado
> **Bloqueio:** Mapeamento GA4 ↔ Contas

---

## O Que Foi Implementado

### 1. Views SQL (Supabase)

```sql
-- Views criadas em: supabase/migrations/20260121000000_create_bronze_views.sql
v_meta_ga4_campaign_funnel    -- Funil Meta + GA4 por campanha
v_meta_ga4_adset_funnel       -- Funil por adset
v_meta_ga4_daily_performance  -- Performance diária
v_conversion_discrepancy      -- Discrepância de conversões
```

### 2. Dashboards V2 (`/dashboards-v2`)

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useIntegratedFunnel.ts` | Hook para buscar dados do funil |
| `src/hooks/useConversionDiscrepancy.ts` | Hook para discrepância |
| `src/components/dashboards-v2/IntegratedFunnelDashboard.tsx` | Dashboard do funil |
| `src/components/dashboards-v2/DiscrepancyDashboard.tsx` | Dashboard de discrepância |
| `src/pages/DashboardsV2Page.tsx` | Página principal |

### 3. GeneralDashboard Atualizado (`/dashboards`)

Adicionado seletor de fonte com 3 visualizações:

- **Unificado**: Meta + Google + GA4
- **Meta Ads**: Métricas originais
- **Google Ads**: Nova visualização

---

## Problema Principal

### Mapeamento GA4 não funciona

**Sintoma:** A visão unificada mostra:
- Meta Ads: ✅ R$ 3.557,71
- Google Ads: ❌ R$ 0,00
- Sessões (GA4): ❌ 0
- Conversões: ❌ 0

**Causa raiz:**

O código atual faz query assim:

```typescript
// GeneralDashboard.tsx - fetchGA4Data()
const { data } = await supabase
  .from('j_rep_ga4_bronze')
  .eq('account_id', accountInfo.metaAdsId)  // ❌ ERRADO!
```

Mas o GA4 **não usa o mesmo account_id** que o Meta Ads.

---

## Estrutura de IDs nas Tabelas

| Tabela | Campo | Exemplo | Origem |
|--------|-------|---------|--------|
| `j_rep_metaads_bronze` | `account_id` | `act_123456789` | Meta Ads |
| `j_rep_googleads_bronze` | `account_id` | `123-456-7890` | Google Ads |
| `j_rep_ga4_bronze` | `account_id` | `?` | GA4 Property ID? |

### Contas no Notion

| Campo | Descrição |
|-------|-----------|
| `meta_ads_id` | ID da conta Meta Ads |
| `id_google_ads` | ID da conta Google Ads |
| `ga4_property_id` | **NÃO EXISTE** - precisa adicionar? |

---

## Investigação Necessária

### Query 1: Ver account_ids do GA4

```sql
SELECT DISTINCT account_id, source, medium
FROM j_rep_ga4_bronze
ORDER BY account_id
LIMIT 50;
```

### Query 2: Ver se GA4 tem dados da conta específica

```sql
SELECT
  account_id,
  source,
  medium,
  campaign,
  SUM(sessions) as sessions,
  SUM(conversions) as conversions
FROM j_rep_ga4_bronze
WHERE date >= '2026-01-14'
GROUP BY account_id, source, medium, campaign
ORDER BY sessions DESC
LIMIT 50;
```

### Query 3: Verificar se campaign_id do Meta existe no GA4

```sql
-- Pegar um campaign_id do Meta
SELECT DISTINCT campaign_id FROM j_rep_metaads_bronze LIMIT 5;

-- Verificar se existe no GA4
SELECT * FROM j_rep_ga4_bronze WHERE campaign = '<campaign_id>' LIMIT 10;
```

---

## Possíveis Soluções

### Opção A: Adicionar ga4_property_id nas contas

1. Adicionar campo `ga4_property_id` no Notion
2. Sincronizar para `j_hub_notion_db_accounts`
3. Usar esse ID para query do GA4

**Prós:** Mapeamento direto e preciso
**Contras:** Requer trabalho manual de preencher o campo

### Opção B: Agregar GA4 por source/medium

```typescript
// Buscar todos os dados de Meta Ads no GA4
const { data } = await supabase
  .from('j_rep_ga4_bronze')
  .in('source', ['facebook', 'fb', 'meta', 'ig'])
  .in('medium', ['paid', 'cpc', 'instagram'])
  .gte('date', startDate)
  .lte('date', endDate);
```

**Prós:** Funciona sem mapeamento de conta
**Contras:** Mistura dados de todas as contas Meta

### Opção C: Usar views SQL que já fazem o JOIN

As views `v_meta_ga4_*` já fazem o JOIN correto via `campaign_id`.
Mas precisam de um `account_id` para filtrar.

---

## Google Ads - Problema Secundário

O botão "Google Ads" aparece como "N/A" (desabilitado) porque a maioria das contas não tem `id_google_ads` configurado no Notion.

**Solução:**
1. Verificar quais contas usam Google Ads
2. Preencher o campo no Notion
3. Aguardar sync para Supabase

---

## Commits da Sessão

```
cade9a2 feat: Add integrated dashboards v2 with Meta + GA4 cross-platform analytics
322580c feat: Add data source selector to GeneralDashboard (Unified | Meta | Google)
```

---

## Próximos Passos

1. [ ] Executar queries de investigação no Supabase
2. [ ] Decidir estratégia de mapeamento GA4
3. [ ] Implementar correção no código
4. [ ] Preencher `id_google_ads` nas contas do Notion
5. [ ] Testar visão unificada completa
6. [ ] Implementar dashboards P2 (Qualidade, Criativos, Cross-Channel)

---

## Arquivos de Referência

- **Plano completo:** `/Users/maya/.claude/plans/dashboards-intelligence-plan.md`
- **Views SQL:** `supabase/migrations/20260121000000_create_bronze_views.sql`
- **Scripts de teste:** `tmp-tests/validate-bronze-joins.sql`
- **Backfill GA4:** `tmp-tests/backfill-ga4-utms.sql`

---

**Última atualização:** 2026-01-22
