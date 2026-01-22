-- ============================================================================
-- Migration: Create Bronze Views for Cross-Platform Analytics
-- Purpose: Enable easy querying of Meta Ads + GA4 joined data
-- ============================================================================

-- ============================================================================
-- VIEW 1: Funil por Campanha (Meta + GA4)
-- ============================================================================

CREATE OR REPLACE VIEW v_meta_ga4_campaign_funnel AS
SELECT
  m.date,
  m.account_id,
  m.account_name,
  m.campaign_id,
  m.campaign,

  -- Meta Ads metrics
  SUM(m.spend) as spend,
  SUM(m.impressions) as impressions,
  SUM(m.link_clicks) as link_clicks,
  SUM(m.reach) as reach,

  -- GA4 metrics
  SUM(g.sessions) as sessions,
  SUM(g.engaged_sessions) as engaged_sessions,
  SUM(g.active_users) as active_users,
  SUM(g.conversions) as ga4_conversions,
  SUM(g.event_value) as ga4_revenue,

  -- Meta Ads conversions (for comparison)
  SUM(m.actions_purchase) as meta_conversions,
  SUM(m.action_values_omni_purchase) as meta_revenue,

  -- Calculated metrics
  ROUND(SUM(m.spend) / NULLIF(SUM(g.sessions), 0), 2) as custo_por_sessao,
  ROUND(SUM(g.sessions)::decimal / NULLIF(SUM(m.link_clicks), 0) * 100, 1) as taxa_chegada,
  ROUND(SUM(g.engaged_sessions)::decimal / NULLIF(SUM(g.sessions), 0) * 100, 1) as taxa_engajamento,
  ROUND(SUM(g.conversions)::decimal / NULLIF(SUM(g.sessions), 0) * 100, 2) as taxa_conversao_ga4,
  ROUND(SUM(m.spend) / NULLIF(SUM(g.conversions), 0), 2) as cpa_ga4,
  ROUND(SUM(g.event_value) / NULLIF(SUM(m.spend), 0), 2) as roas_ga4

FROM j_rep_metaads_bronze m
LEFT JOIN j_rep_ga4_bronze g
  ON m.date = g.date
  AND m.campaign_id = g.campaign
  AND m.adset_id = g.session_manual_term
WHERE m.spend > 0
GROUP BY m.date, m.account_id, m.account_name, m.campaign_id, m.campaign;

COMMENT ON VIEW v_meta_ga4_campaign_funnel IS 'Funil de conversão por campanha combinando Meta Ads e GA4';


-- ============================================================================
-- VIEW 2: Funil por Adset (Meta + GA4)
-- ============================================================================

CREATE OR REPLACE VIEW v_meta_ga4_adset_funnel AS
SELECT
  m.date,
  m.account_id,
  m.account_name,
  m.campaign_id,
  m.campaign,
  m.adset_id,
  m.adset_name,

  -- Meta Ads metrics
  SUM(m.spend) as spend,
  SUM(m.impressions) as impressions,
  SUM(m.link_clicks) as link_clicks,

  -- GA4 metrics
  SUM(g.sessions) as sessions,
  SUM(g.engaged_sessions) as engaged_sessions,
  SUM(g.conversions) as ga4_conversions,
  SUM(g.event_value) as ga4_revenue,

  -- Meta Ads conversions
  SUM(m.actions_purchase) as meta_conversions,
  SUM(m.action_values_omni_purchase) as meta_revenue,

  -- Calculated metrics
  ROUND(SUM(m.spend) / NULLIF(SUM(g.sessions), 0), 2) as custo_por_sessao,
  ROUND(SUM(g.sessions)::decimal / NULLIF(SUM(m.link_clicks), 0) * 100, 1) as taxa_chegada,
  ROUND(SUM(m.spend) / NULLIF(SUM(g.conversions), 0), 2) as cpa_ga4,
  ROUND(SUM(g.event_value) / NULLIF(SUM(m.spend), 0), 2) as roas_ga4

FROM j_rep_metaads_bronze m
LEFT JOIN j_rep_ga4_bronze g
  ON m.date = g.date
  AND m.campaign_id = g.campaign
  AND m.adset_id = g.session_manual_term
WHERE m.spend > 0
GROUP BY m.date, m.account_id, m.account_name, m.campaign_id, m.campaign, m.adset_id, m.adset_name;

COMMENT ON VIEW v_meta_ga4_adset_funnel IS 'Funil de conversão por adset combinando Meta Ads e GA4';


-- ============================================================================
-- VIEW 3: Performance Diária por Conta
-- ============================================================================

CREATE OR REPLACE VIEW v_meta_ga4_daily_performance AS
SELECT
  m.date,
  m.account_id,
  m.account_name,

  -- Meta Ads totals
  SUM(m.spend) as spend,
  SUM(m.impressions) as impressions,
  SUM(m.link_clicks) as link_clicks,
  SUM(m.reach) as reach,

  -- GA4 totals
  SUM(g.sessions) as sessions,
  SUM(g.engaged_sessions) as engaged_sessions,
  SUM(g.conversions) as ga4_conversions,
  SUM(g.event_value) as ga4_revenue,

  -- Meta conversions
  SUM(m.actions_purchase) as meta_conversions,
  SUM(m.action_values_omni_purchase) as meta_revenue,

  -- Key metrics
  ROUND(SUM(m.spend) / NULLIF(SUM(m.link_clicks), 0), 2) as cpc,
  ROUND(SUM(g.sessions)::decimal / NULLIF(SUM(m.link_clicks), 0) * 100, 1) as taxa_chegada,
  ROUND(SUM(m.spend) / NULLIF(SUM(g.conversions), 0), 2) as cpa_ga4,
  ROUND(SUM(g.event_value) / NULLIF(SUM(m.spend), 0), 2) as roas_ga4,
  ROUND(SUM(m.action_values_omni_purchase) / NULLIF(SUM(m.spend), 0), 2) as roas_meta

FROM j_rep_metaads_bronze m
LEFT JOIN j_rep_ga4_bronze g
  ON m.date = g.date
  AND m.campaign_id = g.campaign
  AND m.adset_id = g.session_manual_term
WHERE m.spend > 0
GROUP BY m.date, m.account_id, m.account_name;

COMMENT ON VIEW v_meta_ga4_daily_performance IS 'Performance diária consolidada por conta';


-- ============================================================================
-- VIEW 4: Discrepância de Conversões (Meta vs GA4)
-- ============================================================================

CREATE OR REPLACE VIEW v_conversion_discrepancy AS
SELECT
  date,
  account_id,
  account_name,
  campaign,
  spend,
  meta_conversions,
  ga4_conversions,
  meta_conversions - ga4_conversions as discrepancy,
  CASE
    WHEN meta_conversions > 0
    THEN ROUND((meta_conversions - ga4_conversions)::decimal / meta_conversions * 100, 1)
    ELSE 0
  END as discrepancy_pct,
  meta_revenue,
  ga4_revenue,
  roas_meta,
  roas_ga4
FROM (
  SELECT
    m.date,
    m.account_id,
    m.account_name,
    m.campaign,
    SUM(m.spend) as spend,
    SUM(m.actions_purchase) as meta_conversions,
    SUM(g.conversions) as ga4_conversions,
    SUM(m.action_values_omni_purchase) as meta_revenue,
    SUM(g.event_value) as ga4_revenue,
    ROUND(SUM(m.action_values_omni_purchase) / NULLIF(SUM(m.spend), 0), 2) as roas_meta,
    ROUND(SUM(g.event_value) / NULLIF(SUM(m.spend), 0), 2) as roas_ga4
  FROM j_rep_metaads_bronze m
  LEFT JOIN j_rep_ga4_bronze g
    ON m.date = g.date
    AND m.campaign_id = g.campaign
    AND m.adset_id = g.session_manual_term
  WHERE m.spend > 0
  GROUP BY m.date, m.account_id, m.account_name, m.campaign
) sub
WHERE meta_conversions > 0 OR ga4_conversions > 0;

COMMENT ON VIEW v_conversion_discrepancy IS 'Comparação de conversões reportadas pelo Meta vs GA4';


-- ============================================================================
-- Indexes for better JOIN performance (on GA4 table)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ga4_bronze_join_keys
  ON j_rep_ga4_bronze(date, campaign, session_manual_term);

CREATE INDEX IF NOT EXISTS idx_ga4_bronze_campaign
  ON j_rep_ga4_bronze(campaign);

CREATE INDEX IF NOT EXISTS idx_ga4_bronze_term
  ON j_rep_ga4_bronze(session_manual_term);
