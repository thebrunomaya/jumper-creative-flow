/**
 * Creative Ranking Metrics by Dashboard Objective
 *
 * Defines which metrics to use for ranking and displaying top creatives
 * in each dashboard type.
 */

export type DashboardObjective =
  | 'vendas'
  | 'trafego'
  | 'leads'
  | 'engajamento'
  | 'reconhecimento'
  | 'conversas'
  | 'video'
  | 'alcance'
  | 'conversoes'
  | 'seguidores'
  | 'cadastros'
  | 'geral';

export interface MetricConfig {
  key: string;
  label: string;
  format: 'currency' | 'number' | 'percent' | 'multiplier';
  decimals?: number;
}

export interface RankingConfig {
  /** The metric field to sort by */
  sortBy: string;
  /** Whether lower values are better (e.g., CPA, CPL) */
  lowerIsBetter: boolean;
  /** Primary metric to display prominently (badge) */
  primaryMetric: MetricConfig;
  /** Secondary metrics to show in the card */
  secondaryMetrics: MetricConfig[];
}

/**
 * Ranking configuration for each dashboard objective
 */
export const RANKING_CONFIG: Record<DashboardObjective, RankingConfig> = {
  vendas: {
    sortBy: 'roas',
    lowerIsBetter: false,
    primaryMetric: { key: 'roas', label: 'ROAS', format: 'multiplier', decimals: 1 },
    secondaryMetrics: [
      { key: 'purchases', label: 'Compras', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
      { key: 'revenue', label: 'Receita', format: 'currency' },
    ],
  },

  trafego: {
    sortBy: 'ctr',
    lowerIsBetter: false,
    primaryMetric: { key: 'ctr', label: 'CTR', format: 'percent', decimals: 2 },
    secondaryMetrics: [
      { key: 'link_clicks', label: 'Cliques', format: 'number' },
      { key: 'cpc', label: 'CPC', format: 'currency', decimals: 2 },
      { key: 'spend', label: 'Gasto', format: 'currency' },
    ],
  },

  leads: {
    sortBy: 'cpl',
    lowerIsBetter: true,
    primaryMetric: { key: 'cpl', label: 'CPL', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'leads', label: 'Leads', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
      { key: 'conversionRate', label: 'Conv. Rate', format: 'percent', decimals: 2 },
    ],
  },

  engajamento: {
    sortBy: 'engagementPerSpend',
    lowerIsBetter: false,
    primaryMetric: { key: 'engagementPerSpend', label: 'Eng/R$', format: 'number', decimals: 1 },
    secondaryMetrics: [
      { key: 'post_engagement', label: 'Engajamento', format: 'number' },
      { key: 'post_reaction', label: 'Reações', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
    ],
  },

  reconhecimento: {
    sortBy: 'cpm',
    lowerIsBetter: true,
    primaryMetric: { key: 'cpm', label: 'CPM', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'impressions', label: 'Impressões', format: 'number' },
      { key: 'reach', label: 'Alcance', format: 'number' },
      { key: 'frequency', label: 'Frequência', format: 'number', decimals: 1 },
    ],
  },

  conversas: {
    sortBy: 'costPerConversation',
    lowerIsBetter: true,
    primaryMetric: { key: 'costPerConversation', label: 'Custo/Conversa', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'conversations', label: 'Conversas', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
      { key: 'conversionRate', label: 'Taxa', format: 'percent', decimals: 2 },
    ],
  },

  video: {
    sortBy: 'thruplayRate',
    lowerIsBetter: false,
    primaryMetric: { key: 'thruplayRate', label: 'ThruPlay Rate', format: 'percent', decimals: 1 },
    secondaryMetrics: [
      { key: 'thruplays', label: 'ThruPlays', format: 'number' },
      { key: 'video_p75', label: '75% Views', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
    ],
  },

  alcance: {
    sortBy: 'costPer1kReach',
    lowerIsBetter: true,
    primaryMetric: { key: 'costPer1kReach', label: 'Custo/1k Alcance', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'reach', label: 'Alcance', format: 'number' },
      { key: 'frequency', label: 'Frequência', format: 'number', decimals: 1 },
      { key: 'spend', label: 'Gasto', format: 'currency' },
    ],
  },

  conversoes: {
    sortBy: 'roas',
    lowerIsBetter: false,
    primaryMetric: { key: 'roas', label: 'ROAS', format: 'multiplier', decimals: 1 },
    secondaryMetrics: [
      { key: 'purchases', label: 'Conversões', format: 'number' },
      { key: 'cpa', label: 'CPA', format: 'currency', decimals: 2 },
      { key: 'spend', label: 'Gasto', format: 'currency' },
    ],
  },

  seguidores: {
    sortBy: 'costPerLike',
    lowerIsBetter: true,
    primaryMetric: { key: 'costPerLike', label: 'Custo/Seguidor', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'likes', label: 'Seguidores', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
      { key: 'reach', label: 'Alcance', format: 'number' },
    ],
  },

  cadastros: {
    sortBy: 'costPerRegistration',
    lowerIsBetter: true,
    primaryMetric: { key: 'costPerRegistration', label: 'Custo/Cadastro', format: 'currency', decimals: 2 },
    secondaryMetrics: [
      { key: 'registrations', label: 'Cadastros', format: 'number' },
      { key: 'spend', label: 'Gasto', format: 'currency' },
      { key: 'conversionRate', label: 'Taxa', format: 'percent', decimals: 2 },
    ],
  },

  geral: {
    sortBy: 'spend',
    lowerIsBetter: false, // Higher spend = more active creative
    primaryMetric: { key: 'spend', label: 'Gasto', format: 'currency' },
    secondaryMetrics: [
      { key: 'impressions', label: 'Impressões', format: 'number' },
      { key: 'clicks', label: 'Cliques', format: 'number' },
      { key: 'ctr', label: 'CTR', format: 'percent', decimals: 2 },
    ],
  },
};

/**
 * Format a metric value according to its configuration
 */
export function formatMetricValue(value: number | null | undefined, config: MetricConfig): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  const decimals = config.decimals ?? 0;

  switch (config.format) {
    case 'currency':
      return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    case 'percent':
      return `${value.toFixed(decimals)}%`;

    case 'multiplier':
      return `${value.toFixed(decimals)}x`;

    case 'number':
    default:
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  }
}

/**
 * Get the ranking configuration for a dashboard objective
 */
export function getRankingConfig(objective: DashboardObjective): RankingConfig {
  return RANKING_CONFIG[objective] || RANKING_CONFIG.geral;
}

/**
 * Get performance badge color based on metric value and objective
 */
export function getPerformanceBadgeColor(
  value: number,
  objective: DashboardObjective
): 'green' | 'yellow' | 'orange' | 'red' | 'blue' {
  const config = getRankingConfig(objective);

  // For ROAS-based objectives
  if (config.sortBy === 'roas') {
    if (value >= 3) return 'green';
    if (value >= 2) return 'yellow';
    if (value >= 1) return 'orange';
    return 'red';
  }

  // For CTR-based objectives
  if (config.sortBy === 'ctr') {
    if (value >= 3) return 'green';
    if (value >= 1.5) return 'yellow';
    if (value >= 0.5) return 'orange';
    return 'red';
  }

  // For rate-based objectives (thruplayRate, etc.)
  if (config.sortBy.includes('Rate')) {
    if (value >= 50) return 'green';
    if (value >= 30) return 'yellow';
    if (value >= 15) return 'orange';
    return 'red';
  }

  // Default: neutral
  return 'blue';
}
