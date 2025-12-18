import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { TopCreativesSection } from './TopCreativesSection';

interface VideoViewsDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface VideoViewsMetrics {
  videoViews: number;
  videoP25Watched: number;
  videoP50Watched: number;
  videoP75Watched: number;
  videoP100Watched: number;
  cpc: number;
  spend: number;
  retentionRate: number;
  engagementRate: number;
}

export const VideoViewsDashboard: React.FC<VideoViewsDashboardProps> = ({ accountId, selectedPeriod }) => {
  const [metrics, setMetrics] = useState<VideoViewsMetrics | null>(null);
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
            videoViews: 0,
            videoP25Watched: 0,
            videoP50Watched: 0,
            videoP75Watched: 0,
            videoP100Watched: 0,
            cpc: 0,
            spend: 0,
            retentionRate: 0,
            engagementRate: 0,
          });
          return;
        }

        // Aggregate metrics
        const aggregated = data.reduce((acc, row) => {
          acc.videoViews += row.video_play_actions_video_view || 0;
          acc.videoP25Watched += row.video_p25_watched_actions_video_view || 0;
          acc.videoP50Watched += row.video_p50_watched_actions_video_view || 0;
          acc.videoP75Watched += row.video_p75_watched_actions_video_view || 0;
          acc.videoP100Watched += row.video_p100_watched_actions_video_view || 0;
          acc.spend += parseFloat(String(row.spend || 0));
          return acc;
        }, {
          videoViews: 0,
          videoP25Watched: 0,
          videoP50Watched: 0,
          videoP75Watched: 0,
          videoP100Watched: 0,
          spend: 0,
        });

        // Calculate derived metrics
        const cpc = aggregated.videoViews > 0 ? aggregated.spend / aggregated.videoViews : 0;
        const retentionRate = aggregated.videoViews > 0 ? (aggregated.videoP100Watched / aggregated.videoViews) * 100 : 0;
        const engagementRate = aggregated.videoViews > 0 ? (aggregated.videoP75Watched / aggregated.videoViews) * 100 : 0;

        setMetrics({
          videoViews: aggregated.videoViews,
          videoP25Watched: aggregated.videoP25Watched,
          videoP50Watched: aggregated.videoP50Watched,
          videoP75Watched: aggregated.videoP75Watched,
          videoP100Watched: aggregated.videoP100Watched,
          cpc,
          spend: aggregated.spend,
          retentionRate,
          engagementRate,
        });
      } catch (err) {
        console.error('Error fetching video views metrics:', err);
        setError('Erro ao carregar métricas de reproduções de vídeo');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, selectedPeriod]);

  if (loading) return <SkeletonDashboard cardCount={8} heroCards={4} showHeader={true} />;
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
          Dashboard de Reproduções de Vídeo - Últimos {selectedPeriod} dias {dateRangeDisplay}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise detalhada de performance de vídeos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Visualizações de Vídeo"
          value={formatMetric(metrics.videoViews, 'number')}
          description="Total de reproduções iniciadas"
          performance={metrics.videoViews > 10000 ? 'excellent' : metrics.videoViews > 5000 ? 'good' : metrics.videoViews > 1000 ? 'warning' : 'critical'}
          isHero={true}
        />
        
        <MetricCard
          title="25% Assistido"
          value={formatMetric(metrics.videoP25Watched, 'number')}
          description="Engajamento inicial"
          performance={metrics.videoP25Watched > 5000 ? 'excellent' : metrics.videoP25Watched > 2500 ? 'good' : metrics.videoP25Watched > 500 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="50% Assistido"
          value={formatMetric(metrics.videoP50Watched, 'number')}
          description="Engajamento intermediário"
          performance={metrics.videoP50Watched > 3000 ? 'excellent' : metrics.videoP50Watched > 1500 ? 'good' : metrics.videoP50Watched > 300 ? 'warning' : 'critical'}
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
          title="75% Assistido"
          value={formatMetric(metrics.videoP75Watched, 'number')}
          description="Engajamento avançado"
          performance={metrics.videoP75Watched > 2000 ? 'excellent' : metrics.videoP75Watched > 1000 ? 'good' : metrics.videoP75Watched > 200 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="100% Assistido"
          value={formatMetric(metrics.videoP100Watched, 'number')}
          description="Visualização completa"
          performance={metrics.videoP100Watched > 1000 ? 'excellent' : metrics.videoP100Watched > 500 ? 'good' : metrics.videoP100Watched > 100 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Custo por Visualização"
          value={formatMetric(metrics.cpc, 'currency')}
          description="Investimento por view"
          performance={metrics.cpc < 0.10 ? 'excellent' : metrics.cpc < 0.20 ? 'good' : metrics.cpc < 0.50 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Taxa de Retenção"
          value={formatMetric(metrics.retentionRate, 'percentage')}
          description="% que assistiu 100%"
          performance={metrics.retentionRate > 15 ? 'excellent' : metrics.retentionRate > 10 ? 'good' : metrics.retentionRate > 5 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Taxa de Engajamento"
          value={formatMetric(metrics.engagementRate, 'percentage')}
          description="% que assistiu 75%"
          performance={metrics.engagementRate > 30 ? 'excellent' : metrics.engagementRate > 20 ? 'good' : metrics.engagementRate > 10 ? 'warning' : 'critical'}
        />
      </div>

      {/* Top Creatives Section */}
      <TopCreativesSection
        accountId={accountId}
        objective="video"
        dateStart={startDate}
        dateEnd={endDate}
      />

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Insight:</strong> O funil de visualização mostra a qualidade do conteúdo.
              Taxa de retenção acima de 15% e engajamento acima de 30% indicam vídeos altamente relevantes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};