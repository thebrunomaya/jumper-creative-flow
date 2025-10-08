import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';

interface TrafficDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface TrafficMetrics {
  linkClicks: number;
  cpc: number;
  impressions: number;
  ctr: number;
  reach: number;
  spend: number;
  clicks: number;
  conversionRate: number;
}

export const TrafficDashboard: React.FC<TrafficDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate date range for display - últimos N dias significa até ontem
  const endDate = startOfDay(subDays(new Date(), 1)); // Ontem (não hoje)
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1)); // N dias para trás
  const dateRangeDisplay = `(${format(startDate, 'dd/MM/yy')} a ${format(endDate, 'dd/MM/yy')})`;

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryEndDate = startOfDay(subDays(new Date(), 1)); // Ontem (não hoje)
        const queryStartDate = startOfDay(subDays(queryEndDate, selectedPeriod - 1)); // N dias para trás
        
        let query = supabase
          .from('j_rep_metaads_bronze')
          .select('*')
          .eq('account_id', accountId)
          .gte('date', format(queryStartDate, 'yyyy-MM-dd'))
          .lte('date', format(queryEndDate, 'yyyy-MM-dd'));

        // Apply traffic objective filter (LINK_CLICKS only)
        query = applyObjectiveFilter(query, 'trafego');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            linkClicks: 0,
            cpc: 0,
            impressions: 0,
            ctr: 0,
            reach: 0,
            spend: 0,
            clicks: 0,
            conversionRate: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.linkClicks += row.link_clicks || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          acc.impressions += row.impressions || 0;
          acc.reach += row.reach || 0;
          acc.clicks += row.clicks || 0;
          return acc;
        }, {
          linkClicks: 0,
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
        });

        // Calculate derived metrics
        const cpc = aggregated.linkClicks > 0 ? aggregated.spend / aggregated.linkClicks : 0;
        const ctr = aggregated.impressions > 0 ? (aggregated.linkClicks / aggregated.impressions) * 100 : 0;
        const conversionRate = aggregated.clicks > 0 ? (aggregated.linkClicks / aggregated.clicks) * 100 : 0;

        setMetrics({
          linkClicks: aggregated.linkClicks,
          cpc,
          impressions: aggregated.impressions,
          ctr,
          reach: aggregated.reach,
          spend: aggregated.spend,
          clicks: aggregated.clicks,
          conversionRate,
        });
      } catch (err) {
        console.error('Error fetching traffic metrics:', err);
        setError('Erro ao carregar métricas de tráfego');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, selectedPeriod]);

  if (loading) return <SkeletonDashboard cardCount={7} heroCards={3} showHeader={true} />;
  if (error) return (
    <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
      <CardContent className="p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </CardContent>
    </Card>
  );
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dashboard de Tráfego - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise detalhada de geração de tráfego e engajamento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Cliques no Link"
          value={formatMetric(metrics.linkClicks, 'number')}
          description="Total de cliques direcionados ao site"
          performance={metrics.linkClicks > 1000 ? 'excellent' : metrics.linkClicks > 500 ? 'good' : metrics.linkClicks > 100 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="CPC"
          value={formatMetric(metrics.cpc, 'currency')}
          description="Custo por clique no link"
          performance={getMetricPerformance('cpc', metrics.cpc)}
          isHero={true}
        />
        
        <MetricCard
          title="Impressões"
          value={formatMetric(metrics.impressions, 'number')}
          description="Total de visualizações do anúncio"
          performance={metrics.impressions > 50000 ? 'excellent' : metrics.impressions > 20000 ? 'good' : metrics.impressions > 5000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CTR"
          value={formatMetric(metrics.ctr, 'percentage')}
          description="Taxa de cliques no link"
          performance={getMetricPerformance('ctr', metrics.ctr)}
          isHero={true}
        />
        
        <MetricCard
          title="Alcance"
          value={formatMetric(metrics.reach, 'number')}
          description="Pessoas únicas alcançadas"
          performance={metrics.reach > 10000 ? 'excellent' : metrics.reach > 5000 ? 'good' : metrics.reach > 1000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Investimento"
          value={formatMetric(metrics.spend, 'currency')}
          description="Total investido no período"
          performance="neutral"
          isHero={true}
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={formatMetric(metrics.conversionRate, 'percentage')}
          description="Cliques no link / Cliques totais"
          performance={metrics.conversionRate > 80 ? 'excellent' : metrics.conversionRate > 60 ? 'good' : metrics.conversionRate > 40 ? 'warning' : 'critical'}
        />
      </div>

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> O objetivo de Tráfego foca em direcionar visitantes qualificados ao seu site. 
              CTR acima de 2% e CPC baixo indicam campanhas eficientes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};