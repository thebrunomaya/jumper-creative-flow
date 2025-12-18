import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';
import { TopCreativesSection } from './TopCreativesSection';

interface BrandAwarenessDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface BrandAwarenessMetrics {
  reach: number;
  impressions: number;
  frequency: number;
  cpm: number;
  clicks: number;
  ctr: number;
  spend: number;
}

export const BrandAwarenessDashboard: React.FC<BrandAwarenessDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<BrandAwarenessMetrics | null>(null);
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

        // Apply brand awareness objective filter (OUTCOME_AWARENESS only)
        query = applyObjectiveFilter(query, 'reconhecimento');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            reach: 0,
            impressions: 0,
            frequency: 0,
            cpm: 0,
            clicks: 0,
            ctr: 0,
            spend: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.reach += row.reach || 0;
          acc.impressions += row.impressions || 0;
          acc.clicks += row.clicks || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          acc.frequencySum += (parseFloat(String(row.frequency || 0))) * (row.reach || 0);
          acc.reachForFreq += row.reach || 0;
          return acc;
        }, {
          reach: 0,
          impressions: 0,
          clicks: 0,
          spend: 0,
          frequencySum: 0,
          reachForFreq: 0,
        });

        // Calculate derived metrics
        const frequency = aggregated.reachForFreq > 0 ? aggregated.frequencySum / aggregated.reachForFreq : 0;
        const cpm = aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0;
        const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;

        setMetrics({
          reach: aggregated.reach,
          impressions: aggregated.impressions,
          frequency,
          cpm,
          clicks: aggregated.clicks,
          ctr,
          spend: aggregated.spend,
        });
      } catch (err) {
        console.error('Error fetching brand awareness metrics:', err);
        setError('Erro ao carregar métricas de reconhecimento de marca');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, selectedPeriod]);

  if (loading) return <SkeletonDashboard cardCount={6} heroCards={3} showHeader={true} />;
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
          Dashboard de Reconhecimento de Marca - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de alcance e visibilidade da marca
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Alcance"
          value={formatMetric(metrics.reach, 'number')}
          description="Pessoas únicas alcançadas"
          performance={metrics.reach > 20000 ? 'excellent' : metrics.reach > 10000 ? 'good' : metrics.reach > 5000 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="Impressões"
          value={formatMetric(metrics.impressions, 'number')}
          description="Total de visualizações da marca"
          performance={metrics.impressions > 100000 ? 'excellent' : metrics.impressions > 50000 ? 'good' : metrics.impressions > 20000 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="CPM"
          value={formatMetric(metrics.cpm, 'currency')}
          description="Custo por mil impressões"
          performance={getMetricPerformance('cpm', metrics.cpm)}
          isHero={true}
        />
        
        <MetricCard
          title="Investimento Total"
          value={formatMetric(metrics.spend, 'currency')}
          description="Total investido no período"
          performance="neutral"
          isHero={true}
        />
        
        <MetricCard
          title="Frequência"
          value={formatMetric(metrics.frequency, 'decimal')}
          description="Repetições médias por pessoa"
          performance={metrics.frequency >= 3 && metrics.frequency <= 7 ? 'excellent' : metrics.frequency < 3 ? 'warning' : metrics.frequency <= 10 ? 'good' : 'critical'}
        />
        
        <MetricCard
          title="Interações"
          value={formatMetric(metrics.clicks, 'number')}
          description="Total de cliques"
          performance={metrics.clicks > 1000 ? 'excellent' : metrics.clicks > 500 ? 'good' : metrics.clicks > 200 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CTR"
          value={formatMetric(metrics.ctr, 'percentage')}
          description="Taxa de engajamento"
          performance={getMetricPerformance('ctr', metrics.ctr)}
        />
      </div>

      {/* Top Creatives Section */}
      <TopCreativesSection
        accountId={accountId}
        objective="reconhecimento"
        dateStart={startDate}
        dateEnd={endDate}
      />

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> Campanhas de reconhecimento de marca buscam maximizar alcance e impressões.
              Frequência ideal entre 3-7x garante memorização sem fadiga do anúncio.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};