// @ts-nocheck - Temporary: Type issues, will be fixed in main branch
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';

interface ReachDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface ReachMetrics {
  reach: number;
  impressions: number;
  frequency: number;
  cpm: number;
  spend: number;
}

export const ReachDashboard: React.FC<ReachDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<ReachMetrics | null>(null);
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
            reach: 0,
            impressions: 0,
            frequency: 0,
            cpm: 0,
            spend: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.reach += row.reach || 0;
          acc.impressions += row.impressions || 0;
          acc.spend += parseFloat(row.spend || 0);
          acc.frequencySum += (parseFloat(row.frequency || 0)) * (row.reach || 0);
          acc.reachForFreq += row.reach || 0;
          return acc;
        }, {
          reach: 0,
          impressions: 0,
          spend: 0,
          frequencySum: 0,
          reachForFreq: 0,
        });

        // Calculate derived metrics
        const frequency = aggregated.reachForFreq > 0 ? aggregated.frequencySum / aggregated.reachForFreq : 0;
        const cpm = aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0;

        setMetrics({
          reach: aggregated.reach,
          impressions: aggregated.impressions,
          frequency,
          cpm,
          spend: aggregated.spend,
        });
      } catch (err) {
        console.error('Error fetching reach metrics:', err);
        setError('Erro ao carregar métricas de alcance');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, selectedPeriod]);

  if (loading) return <SkeletonDashboard cardCount={5} heroCards={3} showHeader={true} />;
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
          Dashboard de Alcance - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de expansão e cobertura de audiência
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Alcance Total"
          value={formatMetric(metrics.reach, 'number')}
          description="Pessoas únicas atingidas"
          performance={metrics.reach > 20000 ? 'excellent' : metrics.reach > 10000 ? 'good' : metrics.reach > 5000 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="Impressões"
          value={formatMetric(metrics.impressions, 'number')}
          description="Total de visualizações"
          performance={metrics.impressions > 100000 ? 'excellent' : metrics.impressions > 50000 ? 'good' : metrics.impressions > 20000 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="Frequência"
          value={formatMetric(metrics.frequency, 'decimal')}
          description="Média de visualizações por pessoa"
          performance={metrics.frequency > 1 && metrics.frequency < 3 ? 'excellent' : metrics.frequency >= 3 && metrics.frequency < 5 ? 'good' : metrics.frequency >= 5 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CPM"
          value={formatMetric(metrics.cpm, 'currency')}
          description="Custo para expandir alcance"
          performance={getMetricPerformance('cpm', metrics.cpm)}
          isHero={true}
        />
        
        <MetricCard
          title="Investimento"
          value={formatMetric(metrics.spend, 'currency')}
          description="Total investido em alcance"
          performance="neutral"
        />
      </div>

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> Campanhas de alcance buscam atingir o máximo de pessoas únicas. 
              Frequência baixa (1-3x) com alto alcance indica boa distribuição do investimento.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};