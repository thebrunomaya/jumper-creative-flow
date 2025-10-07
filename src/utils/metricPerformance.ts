type MetricPerformance = 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';

interface MetricThresholds {
  excellent: number;
  good: number;
  warning: number;
  // critical is anything below warning
}

// Performance thresholds based on industry standards
const METRIC_THRESHOLDS = {
  ctr: { excellent: 2.0, good: 1.5, warning: 0.5 }, // CTR in %
  roas: { excellent: 4.0, good: 2.5, warning: 1.0 }, // ROAS ratio
  cpa: { excellent: 50, good: 100, warning: 200 }, // CPA in BRL (reverse logic - lower is better)
  cpm: { excellent: 10, good: 20, warning: 40 }, // CPM in BRL (reverse logic - lower is better)
  cpc: { excellent: 0.5, good: 1.5, warning: 3.0 }, // CPC in BRL (reverse logic - lower is better)
  conversionRate: { excellent: 3.0, good: 2.0, warning: 0.5 }, // Conversion rate in %
  frequency: { excellent: 2.0, good: 3.0, warning: 5.0 }, // Frequency (reverse logic - lower is better)
} as const;

export function getCTRPerformance(ctr: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.ctr;
  if (ctr >= thresholds.excellent) return 'excellent';
  if (ctr >= thresholds.good) return 'good';
  if (ctr >= thresholds.warning) return 'warning';
  return 'critical';
}

export function getROASPerformance(roas: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.roas;
  if (roas >= thresholds.excellent) return 'excellent';
  if (roas >= thresholds.good) return 'good';
  if (roas >= thresholds.warning) return 'warning';
  return 'critical';
}

export function getCPAPerformance(cpa: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.cpa;
  // Reverse logic: lower CPA is better
  if (cpa <= thresholds.excellent) return 'excellent';
  if (cpa <= thresholds.good) return 'good';
  if (cpa <= thresholds.warning) return 'warning';
  return 'critical';
}

export function getCPMPerformance(cpm: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.cpm;
  // Reverse logic: lower CPM is better
  if (cpm <= thresholds.excellent) return 'excellent';
  if (cpm <= thresholds.good) return 'good';
  if (cpm <= thresholds.warning) return 'warning';
  return 'critical';
}

export function getCPCPerformance(cpc: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.cpc;
  // Reverse logic: lower CPC is better
  if (cpc <= thresholds.excellent) return 'excellent';
  if (cpc <= thresholds.good) return 'good';
  if (cpc <= thresholds.warning) return 'warning';
  return 'critical';
}

export function getConversionRatePerformance(rate: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.conversionRate;
  if (rate >= thresholds.excellent) return 'excellent';
  if (rate >= thresholds.good) return 'good';
  if (rate >= thresholds.warning) return 'warning';
  return 'critical';
}

export function getFrequencyPerformance(frequency: number): MetricPerformance {
  const thresholds = METRIC_THRESHOLDS.frequency;
  // Reverse logic: lower frequency is better (less ad fatigue)
  if (frequency <= thresholds.excellent) return 'excellent';
  if (frequency <= thresholds.good) return 'good';
  if (frequency <= thresholds.warning) return 'warning';
  return 'critical';
}

// Utility to determine if a metric is a "hero" metric (primary KPI)
export function isHeroMetric(metricType: string): boolean {
  const heroMetrics = ['roas', 'revenue', 'conversions', 'cpa'];
  return heroMetrics.includes(metricType.toLowerCase());
}

// Format currency values consistently
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

// Format percentage values consistently
export function formatPercentage(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(decimals)}%`;
}

// Format large numbers with Brazilian locale
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Generic metric formatter that handles different types
export function formatMetric(value: string | number, type: 'currency' | 'percentage' | 'number' | 'decimal'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  switch (type) {
    case 'currency':
      return formatCurrency(num);
    case 'percentage':
      return formatPercentage(num);
    case 'number':
      return formatNumber(Math.round(num));
    case 'decimal':
      return num.toFixed(2);
    default:
      return num.toString();
  }
}

// Generic performance evaluator
export function getMetricPerformance(metricType: string, value: number): MetricPerformance {
  switch (metricType.toLowerCase()) {
    case 'ctr':
      return getCTRPerformance(value);
    case 'roas':
      return getROASPerformance(value);
    case 'cpa':
      return getCPAPerformance(value);
    case 'cpm':
      return getCPMPerformance(value);
    case 'cpc':
      return getCPCPerformance(value);
    case 'conversionrate':
      return getConversionRatePerformance(value);
    case 'frequency':
      return getFrequencyPerformance(value);
    default:
      return 'neutral';
  }
}