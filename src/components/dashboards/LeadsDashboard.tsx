import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';

interface LeadsDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface LeadsMetrics {
  conversions: number;
  cpa: number;
  linkClicks: number;
  ctr: number;
  spend: number;
  impressions: number;
  reach: number;
  conversionRate: number;
}

export const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<LeadsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate date range for display
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, selectedPeriod));
  const dateRangeDisplay = `(${format(startDate, 'dd/MM/yy')} a ${format(endDate, 'dd/MM/yy')})`;

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endDate = startOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, selectedPeriod));
        
        let query = supabase
          .from('j_rep_metaads_bronze')
          .select('*')
          .eq('account_id', accountId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        // Apply leads objective filter (OUTCOME_LEADS only)
        query = applyObjectiveFilter(query, 'leads');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            conversions: 0,
            cpa: 0,
            linkClicks: 0,
            ctr: 0,
            spend: 0,
            impressions: 0,
            reach: 0,
            conversionRate: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.conversions += row.actions_lead || 0;
          acc.linkClicks += row.link_clicks || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          acc.impressions += row.impressions || 0;
          acc.reach += row.reach || 0;
          return acc;
        }, {
          conversions: 0,
          linkClicks: 0,
          spend: 0,
          impressions: 0,
          reach: 0,
        });

        // Calculate derived metrics
        const cpa = aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : 0;
        const ctr = aggregated.impressions > 0 ? (aggregated.linkClicks / aggregated.impressions) * 100 : 0;
        const conversionRate = aggregated.linkClicks > 0 ? (aggregated.conversions / aggregated.linkClicks) * 100 : 0;

        setMetrics({
          conversions: aggregated.conversions,
          cpa,
          linkClicks: aggregated.linkClicks,
          ctr,
          spend: aggregated.spend,
          impressions: aggregated.impressions,
          reach: aggregated.reach,
          conversionRate,
        });
      } catch (err) {
        console.error('Error fetching leads metrics:', err);
        setError('Erro ao carregar métricas de leads');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, selectedPeriod]);

  if (loading) return <SkeletonDashboard cardCount={8} heroCards={3} showHeader={true} />;
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
          Dashboard de Leads - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de geração e custo de leads qualificados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Leads Gerados"
          value={formatMetric(metrics.conversions, 'number')}
          description="Total de leads capturados"
          performance={metrics.conversions > 100 ? 'excellent' : metrics.conversions > 50 ? 'good' : metrics.conversions > 20 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="Custo por Lead"
          value={formatMetric(metrics.cpa, 'currency')}
          description="Investimento por lead gerado"
          performance={getMetricPerformance('cpa', metrics.cpa)}
          isHero={true}
        />
        
        <MetricCard
          title="Cliques no Link"
          value={formatMetric(metrics.linkClicks, 'number')}
          description="Potencial de geração de leads"
          performance={metrics.linkClicks > 500 ? 'excellent' : metrics.linkClicks > 250 ? 'good' : metrics.linkClicks > 100 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CTR"
          value={formatMetric(metrics.ctr, 'percentage')}
          description="Qualidade do anúncio"
          performance={getMetricPerformance('ctr', metrics.ctr)}
          isHero={true}
        />
        
        <MetricCard
          title="Investimento"
          value={formatMetric(metrics.spend, 'currency')}
          description="Total investido em geração de leads"
          performance="neutral"
        />
        
        <MetricCard
          title="Impressões"
          value={formatMetric(metrics.impressions, 'number')}
          description="Volume de visualizações"
          performance={metrics.impressions > 50000 ? 'excellent' : metrics.impressions > 20000 ? 'good' : metrics.impressions > 5000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Alcance"
          value={formatMetric(metrics.reach, 'number')}
          description="Pessoas únicas alcançadas"
          performance={metrics.reach > 10000 ? 'excellent' : metrics.reach > 5000 ? 'good' : metrics.reach > 1000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={formatMetric(metrics.conversionRate, 'percentage')}
          description="Leads / Cliques no link"
          performance={getMetricPerformance('conversionRate', metrics.conversionRate)}
        />
      </div>

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> Campanhas de leads focam em capturar contatos qualificados. 
              CPA abaixo de R$ 50 e taxa de conversão acima de 3% indicam campanhas eficientes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};