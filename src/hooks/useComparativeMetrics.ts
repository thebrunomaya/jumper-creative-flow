import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter, DashboardType } from '@/utils/dashboardObjectives';

/**
 * Comparative Metrics Hook
 *
 * Compares current period metrics with previous period to generate insights.
 *
 * Usage:
 * const { insights, loading, error } = useComparativeMetrics({
 *   accountId: 'account_123',
 *   metaAdsId: 'act_456',
 *   selectedPeriod: 7,
 *   dashboardType: 'vendas'
 * });
 */

export interface MetricComparison {
  metric: string;
  displayName: string;
  current: number;
  previous: number;
  change: number;              // Percentual change
  changeAbsolute: number;      // Absolute difference
  trend: 'up' | 'down' | 'stable';
  sentiment: 'positive' | 'negative' | 'neutral';  // Based on metric type
  isSignificant: boolean;      // Change > 10%
}

export interface InsightItem {
  type: 'win' | 'warning' | 'info';
  icon: '✅' | '⚠️' | '📊';
  title: string;
  description: string;
  metric: MetricComparison;
}

export interface ComparativeMetricsResult {
  insights: InsightItem[];
  comparisons: MetricComparison[];
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  previousPeriod: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  loading: boolean;
  error: string | null;
}

interface UseComparativeMetricsProps {
  accountId?: string;
  metaAdsId?: string;
  selectedPeriod: number;
  dashboardType: DashboardType;
  enabled?: boolean;
}

export function useComparativeMetrics({
  accountId,
  metaAdsId,
  selectedPeriod,
  dashboardType,
  enabled = true
}: UseComparativeMetricsProps): ComparativeMetricsResult {

  const [comparisons, setComparisons] = useState<MetricComparison[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date ranges
  const currentEndDate = startOfDay(subDays(new Date(), 1)); // Yesterday
  const currentStartDate = startOfDay(subDays(currentEndDate, selectedPeriod - 1));

  const previousEndDate = startOfDay(subDays(currentStartDate, 1)); // Day before current period
  const previousStartDate = startOfDay(subDays(previousEndDate, selectedPeriod - 1));

  useEffect(() => {
    if (!enabled || !metaAdsId) {
      setLoading(false);
      return;
    }

    fetchComparativeData();
  }, [metaAdsId, selectedPeriod, dashboardType, enabled]);

  const fetchComparativeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current period data
      let currentQuery = supabase
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_id', metaAdsId)
        .gte('date', format(currentStartDate, 'yyyy-MM-dd'))
        .lte('date', format(currentEndDate, 'yyyy-MM-dd'));

      currentQuery = applyObjectiveFilter(currentQuery, dashboardType);
      const { data: currentData, error: currentError } = await currentQuery;

      if (currentError) throw currentError;

      // Fetch previous period data
      let previousQuery = supabase
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_id', metaAdsId)
        .gte('date', format(previousStartDate, 'yyyy-MM-dd'))
        .lte('date', format(previousEndDate, 'yyyy-MM-dd'));

      previousQuery = applyObjectiveFilter(previousQuery, dashboardType);
      const { data: previousData, error: previousError } = await previousQuery;

      if (previousError) throw previousError;

      // Calculate aggregated metrics for both periods
      const currentMetrics = aggregateMetrics(currentData || []);
      const previousMetrics = aggregateMetrics(previousData || []);

      // Compare metrics
      const metricComparisons = compareMetrics(currentMetrics, previousMetrics, dashboardType);
      setComparisons(metricComparisons);

      // Generate insights
      const generatedInsights = generateInsights(metricComparisons, dashboardType);
      setInsights(generatedInsights);

    } catch (err: any) {
      console.error('Error fetching comparative metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    insights,
    comparisons,
    currentPeriod: {
      startDate: currentStartDate,
      endDate: currentEndDate,
      label: `${format(currentStartDate, 'dd/MM')} a ${format(currentEndDate, 'dd/MM')}`
    },
    previousPeriod: {
      startDate: previousStartDate,
      endDate: previousEndDate,
      label: `${format(previousStartDate, 'dd/MM')} a ${format(previousEndDate, 'dd/MM')}`
    },
    loading,
    error
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function aggregateMetrics(data: any[]): Record<string, number> {
  if (!data || data.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      link_clicks: 0,
      reach: 0,
      purchases: 0,
      revenue: 0,
      leads: 0,
      engagement: 0
    };
  }

  const spend = data.reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
  const impressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const clicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const linkClicks = data.reduce((sum, row) => sum + (row.link_clicks || 0), 0);
  const reach = data.reduce((sum, row) => sum + (row.reach || 0), 0);
  const purchases = data.reduce((sum, row) => sum + (row.actions_purchase || 0), 0);
  const revenue = data.reduce((sum, row) => sum + parseFloat(row.action_values_omni_purchase || '0'), 0);
  const leads = data.reduce((sum, row) => sum + (row.actions_lead || 0), 0);
  const engagement = data.reduce((sum, row) => sum + (row.actions_post_engagement || 0), 0);

  // Calculate derived metrics
  const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
  const cpc = linkClicks > 0 ? spend / linkClicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpa = purchases > 0 ? spend / purchases : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const cpl = leads > 0 ? spend / leads : 0;
  const conversionRate = clicks > 0 ? (purchases / clicks) * 100 : 0;

  return {
    spend,
    impressions,
    clicks,
    link_clicks: linkClicks,
    reach,
    purchases,
    revenue,
    leads,
    engagement,
    ctr,
    cpc,
    cpm,
    cpa,
    roas,
    cpl,
    conversion_rate: conversionRate
  };
}

function compareMetrics(
  current: Record<string, number>,
  previous: Record<string, number>,
  dashboardType: DashboardType
): MetricComparison[] {

  // Define which metrics to compare based on dashboard type
  const metricsConfig = getMetricsConfigByDashboard(dashboardType);

  const comparisons: MetricComparison[] = [];

  for (const config of metricsConfig) {
    const currentValue = current[config.key] || 0;
    const previousValue = previous[config.key] || 0;

    const changeAbsolute = currentValue - previousValue;
    const change = previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : (currentValue > 0 ? 100 : 0);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 5) {  // Consider > 5% as significant
      trend = change > 0 ? 'up' : 'down';
    }

    // Determine sentiment based on metric type
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (trend !== 'stable') {
      // For "lower is better" metrics (CPA, CPC, CPM, CPL)
      if (['cpa', 'cpc', 'cpm', 'cpl'].includes(config.key)) {
        sentiment = trend === 'down' ? 'positive' : 'negative';
      } else {
        // For "higher is better" metrics (ROAS, CTR, conversions, etc)
        sentiment = trend === 'up' ? 'positive' : 'negative';
      }
    }

    comparisons.push({
      metric: config.key,
      displayName: config.displayName,
      current: currentValue,
      previous: previousValue,
      change,
      changeAbsolute,
      trend,
      sentiment,
      isSignificant: Math.abs(change) > 10
    });
  }

  return comparisons;
}

function generateInsights(comparisons: MetricComparison[], dashboardType: DashboardType): InsightItem[] {
  const insights: InsightItem[] = [];

  // Get significant changes sorted by magnitude
  const significantChanges = comparisons
    .filter(c => c.isSignificant)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Generate up to 3 insights (wins and warnings)
  let winCount = 0;
  let warningCount = 0;

  for (const comp of significantChanges) {
    if (winCount >= 2 && warningCount >= 2) break;

    if (comp.sentiment === 'positive' && winCount < 2) {
      insights.push({
        type: 'win',
        icon: '✅',
        title: `${comp.displayName} melhorou ${Math.abs(comp.change).toFixed(0)}%`,
        description: generateDescription(comp),
        metric: comp
      });
      winCount++;
    } else if (comp.sentiment === 'negative' && warningCount < 2) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: `${comp.displayName} ${comp.trend === 'up' ? 'aumentou' : 'caiu'} ${Math.abs(comp.change).toFixed(0)}%`,
        description: generateWarningDescription(comp),
        metric: comp
      });
      warningCount++;
    }
  }

  // If no significant insights, add info insight
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      icon: '📊',
      title: 'Performance estável',
      description: 'Métricas mantiveram-se dentro da variação esperada vs período anterior',
      metric: comparisons[0] // Just use first metric as placeholder
    });
  }

  return insights;
}

function generateDescription(comp: MetricComparison): string {
  const formatValue = (value: number, metric: string): string => {
    if (metric.includes('rate') || metric === 'ctr' || metric === 'conversion_rate') {
      return `${value.toFixed(1)}%`;
    }
    if (['cpa', 'cpc', 'cpm', 'cpl', 'spend', 'revenue'].includes(metric)) {
      return `R$ ${value.toFixed(2)}`;
    }
    if (metric === 'roas') {
      return `${value.toFixed(1)}x`;
    }
    return Math.round(value).toLocaleString('pt-BR');
  };

  const currentFormatted = formatValue(comp.current, comp.metric);
  const previousFormatted = formatValue(comp.previous, comp.metric);

  return `${previousFormatted} → ${currentFormatted}`;
}

function generateWarningDescription(comp: MetricComparison): string {
  const desc = generateDescription(comp);

  // Add context based on metric
  if (comp.metric === 'cpa' && comp.trend === 'up') {
    return `${desc} - Acima do esperado`;
  }
  if (comp.metric === 'roas' && comp.trend === 'down') {
    return `${desc} - Revisar estratégia`;
  }
  if (comp.metric === 'ctr' && comp.trend === 'down') {
    return `${desc} - Possível fadiga de criativo`;
  }

  return desc;
}

function getMetricsConfigByDashboard(dashboardType: DashboardType) {
  const configs: Record<DashboardType, Array<{key: string, displayName: string}>> = {
    'vendas': [
      { key: 'roas', displayName: 'ROAS' },
      { key: 'revenue', displayName: 'Receita' },
      { key: 'cpa', displayName: 'CPA' },
      { key: 'purchases', displayName: 'Conversões' },
      { key: 'conversion_rate', displayName: 'Taxa de Conversão' }
    ],
    'trafego': [
      { key: 'link_clicks', displayName: 'Cliques no Link' },
      { key: 'cpc', displayName: 'CPC' },
      { key: 'ctr', displayName: 'CTR' },
      { key: 'impressions', displayName: 'Impressões' }
    ],
    'leads': [
      { key: 'leads', displayName: 'Leads' },
      { key: 'cpl', displayName: 'CPL' },
      { key: 'conversion_rate', displayName: 'Taxa de Conversão' }
    ],
    'engajamento': [
      { key: 'engagement', displayName: 'Engajamento' },
      { key: 'ctr', displayName: 'CTR' },
      { key: 'reach', displayName: 'Alcance' }
    ],
    'geral': [
      { key: 'spend', displayName: 'Investimento' },
      { key: 'impressions', displayName: 'Impressões' },
      { key: 'link_clicks', displayName: 'Cliques' },
      { key: 'ctr', displayName: 'CTR' },
      { key: 'cpm', displayName: 'CPM' }
    ],
    'reconhecimento': [
      { key: 'reach', displayName: 'Alcance' },
      { key: 'impressions', displayName: 'Impressões' },
      { key: 'cpm', displayName: 'CPM' }
    ],
    'alcance': [
      { key: 'reach', displayName: 'Alcance' },
      { key: 'cpm', displayName: 'CPM' }
    ],
    'video': [
      { key: 'impressions', displayName: 'Reproduções' },
      { key: 'engagement', displayName: 'Engajamento' }
    ],
    'conversoes': [
      { key: 'purchases', displayName: 'Conversões' },
      { key: 'cpa', displayName: 'CPA' },
      { key: 'roas', displayName: 'ROAS' }
    ],
    'seguidores': [
      { key: 'engagement', displayName: 'Novos Seguidores' },
      { key: 'reach', displayName: 'Alcance' }
    ],
    'conversas': [
      { key: 'engagement', displayName: 'Conversas' },
      { key: 'reach', displayName: 'Alcance' }
    ],
    'cadastros': [
      { key: 'leads', displayName: 'Cadastros' },
      { key: 'cpl', displayName: 'Custo por Cadastro' }
    ]
  };

  return configs[dashboardType] || configs['geral'];
}
