// Utility for loading and processing dashboard configurations
export interface DashboardMetric {
  name: string;
  priority: number;
  is_hero: boolean;
  database_field?: string;
  calculation?: string;
  aggregation?: string;
  format: string;
  suffix?: string;
  description: string;
  thresholds?: {
    excellent: string;
    good: string;
    warning: string;
    critical: string;
  };
}

export interface DashboardConfig {
  name: string;
  description: string;
  objectives_match: string[];
  status: string;
  metrics: Record<string, DashboardMetric>;
}

export interface DashboardConfigFile {
  dashboards: Record<string, DashboardConfig>;
  adaptive_thresholds?: {
    enabled: boolean;
    factors: Record<string, Record<string, Record<string, number>>>;
  };
  global_settings: {
    default_period: number;
    available_periods: number[];
    currency: string;
    decimal_places: Record<string, number>;
  };
}

// Load dashboard configuration
export async function loadDashboardConfig(): Promise<DashboardConfigFile | null> {
  try {
    // In a real app, this would be loaded from an API or file
    // For now, we'll return a basic config structure
    const response = await fetch('/dashboard-config.json');
    if (!response.ok) {
      console.warn('Dashboard config not found, using defaults');
      return getDefaultConfig();
    }
    return await response.json();
  } catch (error) {
    console.warn('Error loading dashboard config:', error);
    return getDefaultConfig();
  }
}

// Get default configuration if file is not available
function getDefaultConfig(): DashboardConfigFile {
  return {
    dashboards: {
      vendas: {
        name: "Dashboard de Vendas",
        description: "Análise de conversões de vendas e ROAS",
        objectives_match: ["Vendas"],
        status: "implemented",
        metrics: {
          receita: {
            name: "Receita Total",
            priority: 10,
            is_hero: true,
            database_field: "action_values_omni_purchase",
            format: "currency",
            description: "Valor total das vendas"
          },
          roas: {
            name: "ROAS",
            priority: 10,
            is_hero: true,
            calculation: "action_values_omni_purchase / spend",
            format: "decimal",
            suffix: "x",
            description: "Retorno sobre investimento em ads",
            thresholds: {
              excellent: ">= 4.0",
              good: ">= 2.5",
              warning: ">= 1.5",
              critical: "< 1.5"
            }
          }
        }
      }
    },
    global_settings: {
      default_period: 7,
      available_periods: [7, 14, 30],
      currency: "BRL",
      decimal_places: {
        currency: 2,
        percentage: 1,
        decimal: 2,
        number: 0
      }
    }
  };
}

// Get metrics for a specific dashboard
export function getDashboardMetrics(config: DashboardConfigFile, dashboardKey: string): DashboardMetric[] {
  const dashboard = config.dashboards[dashboardKey];
  if (!dashboard) return [];

  return Object.entries(dashboard.metrics)
    .map(([key, metric]) => ({
      key,
      ...metric
    }))
    .sort((a, b) => b.priority - a.priority);
}

// Apply adaptive thresholds based on account characteristics
export function applyAdaptiveThresholds(
  config: DashboardConfigFile,
  metric: DashboardMetric,
  accountContext?: {
    nicho?: string;
    ticket_medio?: 'baixo' | 'medio' | 'alto';
    maturidade_conta?: 'nova' | 'estabelecida' | 'otimizada';
  }
): DashboardMetric {
  if (!config.adaptive_thresholds?.enabled || !accountContext) {
    return metric;
  }

  // This would contain logic to adjust thresholds based on account context
  // For now, we'll return the metric as-is
  return metric;
}

// Parse threshold condition
export function parseThreshold(condition: string, value: number): boolean {
  if (condition.includes('>=')) {
    const threshold = parseFloat(condition.replace('>= ', ''));
    return value >= threshold;
  } else if (condition.includes('<=')) {
    const threshold = parseFloat(condition.replace('<= ', ''));
    return value <= threshold;
  } else if (condition.includes('>')) {
    const threshold = parseFloat(condition.replace('> ', ''));
    return value > threshold;
  } else if (condition.includes('<')) {
    const threshold = parseFloat(condition.replace('< ', ''));
    return value < threshold;
  } else if (condition.includes(' - ')) {
    const [min, max] = condition.split(' - ').map(s => parseFloat(s));
    return value >= min && value <= max;
  }
  
  return false;
}

// Get performance color based on thresholds
export function getThresholdPerformanceColor(
  value: number,
  thresholds?: DashboardMetric['thresholds']
): 'excellent' | 'good' | 'warning' | 'critical' {
  if (!thresholds) return 'good';

  if (parseThreshold(thresholds.excellent, value)) return 'excellent';
  if (parseThreshold(thresholds.good, value)) return 'good';
  if (parseThreshold(thresholds.warning, value)) return 'warning';
  return 'critical';
}

// Format metric value according to config
export function formatMetricValue(value: number | string, format: string, decimalPlaces = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(numValue);
    
    case 'percentage':
      return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(numValue / 100);
    
    case 'decimal':
      return numValue.toFixed(decimalPlaces);
    
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(Math.round(numValue));
    
    default:
      return numValue.toString();
  }
}