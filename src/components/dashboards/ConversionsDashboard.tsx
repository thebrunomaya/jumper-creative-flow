import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { TopCreativesSection } from './TopCreativesSection';

interface ConversionsDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface ConversionsMetrics {
  conversions: number;
  roas: number;
  cpa: number;
  linkClicks: number;
  ctr: number;
  spend: number;
  revenue: number;
  conversionRate: number;
}

export const ConversionsDashboard: React.FC<ConversionsDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<ConversionsMetrics | null>(null);
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
        
        const { data, error } = await supabase
          .from('j_rep_metaads_bronze')
          .select('*')
          .eq('account_id', accountId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            conversions: 0,
            roas: 0,
            cpa: 0,
            linkClicks: 0,
            ctr: 0,
            spend: 0,
            revenue: 0,
            conversionRate: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.conversions += row.actions_onsite_conversion_post_save || 0;
          acc.revenue += parseFloat(String(row.action_values_omni_purchase || 0));
          acc.linkClicks += row.link_clicks || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          acc.impressions += row.impressions || 0;
          return acc;
        }, {
          conversions: 0,
          revenue: 0,
          linkClicks: 0,
          spend: 0,
          impressions: 0,
        });

        // Calculate derived metrics
        const roas = aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : 0;
        const cpa = aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : 0;
        const ctr = aggregated.impressions > 0 ? (aggregated.linkClicks / aggregated.impressions) * 100 : 0;
        const conversionRate = aggregated.linkClicks > 0 ? (aggregated.conversions / aggregated.linkClicks) * 100 : 0;

        setMetrics({
          conversions: aggregated.conversions,
          roas,
          cpa,
          linkClicks: aggregated.linkClicks,
          ctr,
          spend: aggregated.spend,
          revenue: aggregated.revenue,
          conversionRate,
        });
      } catch (err) {
        console.error('Error fetching conversions metrics:', err);
        setError('Erro ao carregar métricas de conversões');
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
          Dashboard de Conversões - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de conversões e retorno sobre investimento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total de Conversões"
          value={formatMetric(metrics.conversions, 'number')}
          description="Conversões realizadas"
          performance={metrics.conversions > 100 ? 'excellent' : metrics.conversions > 50 ? 'good' : metrics.conversions > 20 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="ROAS"
          value={formatMetric(metrics.roas, 'decimal') + 'x'}
          description="Retorno sobre investimento"
          performance={getMetricPerformance('roas', metrics.roas)}
          isHero={true}
        />
        
        <MetricCard
          title="CPA"
          value={formatMetric(metrics.cpa, 'currency')}
          description="Custo por conversão"
          performance={getMetricPerformance('cpa', metrics.cpa)}
          isHero={true}
        />
        
        <MetricCard
          title="Cliques no Link"
          value={formatMetric(metrics.linkClicks, 'number')}
          description="Potencial de conversão"
          performance={metrics.linkClicks > 1000 ? 'excellent' : metrics.linkClicks > 500 ? 'good' : metrics.linkClicks > 200 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CTR"
          value={formatMetric(metrics.ctr, 'percentage')}
          description="Taxa de cliques"
          performance={getMetricPerformance('ctr', metrics.ctr)}
        />
        
        <MetricCard
          title="Investimento"
          value={formatMetric(metrics.spend, 'currency')}
          description="Total investido"
          performance="neutral"
        />
        
        <MetricCard
          title="Receita"
          value={formatMetric(metrics.revenue, 'currency')}
          description="Receita gerada"
          performance={metrics.revenue > metrics.spend * 3 ? 'excellent' : metrics.revenue > metrics.spend * 2 ? 'good' : metrics.revenue > metrics.spend ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={formatMetric(metrics.conversionRate, 'percentage')}
          description="Conversões / Cliques"
          performance={getMetricPerformance('conversionRate', metrics.conversionRate)}
        />
      </div>

      {/* Top Creatives Section */}
      <TopCreativesSection
        accountId={accountId}
        objective="conversoes"
        dateStart={startDate}
        dateEnd={endDate}
      />

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> Campanhas de conversão focam em resultados mensuráveis.
              ROAS acima de 3x e taxa de conversão acima de 3% indicam campanhas lucrativas.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};