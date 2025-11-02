import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';

interface EngagementDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface EngagementMetrics {
  clicks: number;
  videoP50Watched: number;
  videoP75Watched: number;
  ctr: number;
  frequency: number;
  impressions: number;
  reach: number;
  videoViews: number;
  videoEngagementRate: number;
  spend: number;
  costPerEngagement: number;
}

export const EngagementDashboard: React.FC<EngagementDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
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

        // Apply engagement objective filter (OUTCOME_ENGAGEMENT only)
        query = applyObjectiveFilter(query, 'engajamento');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            clicks: 0,
            videoP50Watched: 0,
            videoP75Watched: 0,
            ctr: 0,
            frequency: 0,
            impressions: 0,
            reach: 0,
            videoViews: 0,
            videoEngagementRate: 0,
            spend: 0,
            costPerEngagement: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.clicks += row.clicks || 0;
          acc.videoP50Watched += row.video_p50_watched_actions_video_view || 0;
          acc.videoP75Watched += row.video_p75_watched_actions_video_view || 0;
          acc.impressions += row.impressions || 0;
          acc.reach += row.reach || 0;
          acc.videoViews += row.video_play_actions_video_view || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          acc.frequencySum += (parseFloat(String(row.frequency || 0))) * (row.reach || 0);
          acc.reachForFreq += row.reach || 0;
          return acc;
        }, {
          clicks: 0,
          videoP50Watched: 0,
          videoP75Watched: 0,
          impressions: 0,
          reach: 0,
          videoViews: 0,
          spend: 0,
          frequencySum: 0,
          reachForFreq: 0,
        });

        // Calculate derived metrics
        const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
        const frequency = aggregated.reachForFreq > 0 ? aggregated.frequencySum / aggregated.reachForFreq : 0;
        const videoEngagementRate = aggregated.videoViews > 0 ? (aggregated.videoP75Watched / aggregated.videoViews) * 100 : 0;
        const costPerEngagement = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;

        setMetrics({
          clicks: aggregated.clicks,
          videoP50Watched: aggregated.videoP50Watched,
          videoP75Watched: aggregated.videoP75Watched,
          ctr,
          frequency,
          impressions: aggregated.impressions,
          reach: aggregated.reach,
          videoViews: aggregated.videoViews,
          videoEngagementRate,
          spend: aggregated.spend,
          costPerEngagement,
        });
      } catch (err) {
        console.error('Error fetching engagement metrics:', err);
        setError('Erro ao carregar métricas de engajamento');
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
          Dashboard de Engajamento - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de interações e engajamento com conteúdo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total de Cliques"
          value={formatMetric(metrics.clicks, 'number')}
          description="Total de interações com o anúncio"
          performance={metrics.clicks > 2000 ? 'excellent' : metrics.clicks > 1000 ? 'good' : metrics.clicks > 500 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="Custo por Engajamento"
          value={formatMetric(metrics.costPerEngagement, 'currency')}
          description="Investimento por clique"
          performance={getMetricPerformance('cpc', metrics.costPerEngagement)}
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
          title="Vídeo 50% Assistido"
          value={formatMetric(metrics.videoP50Watched, 'number')}
          description="Engajamento médio com vídeo"
          performance={metrics.videoP50Watched > 1000 ? 'excellent' : metrics.videoP50Watched > 500 ? 'good' : metrics.videoP50Watched > 100 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Vídeo 75% Assistido"
          value={formatMetric(metrics.videoP75Watched, 'number')}
          description="Engajamento aprofundado"
          performance={metrics.videoP75Watched > 500 ? 'excellent' : metrics.videoP75Watched > 250 ? 'good' : metrics.videoP75Watched > 50 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="CTR"
          value={formatMetric(metrics.ctr, 'percentage')}
          description="Taxa de interação"
          performance={getMetricPerformance('ctr', metrics.ctr)}
        />
        
        <MetricCard
          title="Frequência"
          value={formatMetric(metrics.frequency, 'decimal')}
          description="Média de visualizações por pessoa"
          performance={metrics.frequency > 2 && metrics.frequency < 4 ? 'excellent' : metrics.frequency <= 2 ? 'good' : metrics.frequency < 5 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Impressões"
          value={formatMetric(metrics.impressions, 'number')}
          description="Total de visualizações"
          performance={metrics.impressions > 50000 ? 'excellent' : metrics.impressions > 20000 ? 'good' : metrics.impressions > 5000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Alcance"
          value={formatMetric(metrics.reach, 'number')}
          description="Pessoas únicas alcançadas"
          performance={metrics.reach > 10000 ? 'excellent' : metrics.reach > 5000 ? 'good' : metrics.reach > 1000 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Taxa de Engajamento de Vídeo"
          value={formatMetric(metrics.videoEngagementRate, 'percentage')}
          description="% que assistiu 75% do vídeo"
          performance={metrics.videoEngagementRate > 30 ? 'excellent' : metrics.videoEngagementRate > 20 ? 'good' : metrics.videoEngagementRate > 10 ? 'warning' : 'critical'}
        />
      </div>

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> Campanhas de engajamento buscam criar conexão com o público. 
              Taxas altas de visualização de vídeo (50%+) e frequência moderada (2-4x) indicam conteúdo relevante.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};