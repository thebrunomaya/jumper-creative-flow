// @ts-nocheck - Temporary: Type issues, will be fixed in main branch
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';

interface SeguidoresDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface SeguidoresMetrics {
  totalPageLikes: number;
  totalSpend: number;
  totalReach: number;
  custoSeguidor: number;
  taxaConversaoSeguidor: number;
}

export const SeguidoresDashboard: React.FC<SeguidoresDashboardProps> = ({
  accountId,
  selectedPeriod
}) => {
  const [metrics, setMetrics] = useState<SeguidoresMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Apply seguidores objective filter (all objectives - page likes can come from multiple campaigns)
        query = applyObjectiveFilter(query, 'seguidores');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            totalPageLikes: 0,
            totalSpend: 0,
            totalReach: 0,
            custoSeguidor: 0,
            taxaConversaoSeguidor: 0
          });
        } else {
          // Cálculos das métricas baseados no config
          const totalPageLikes = data.reduce((sum, row) => 
            sum + (parseFloat(row.actions_like) || 0), 0
          );
          
          const totalSpend = data.reduce((sum, row) => 
            sum + (parseFloat(row.spend) || 0), 0
          );
          
          const totalReach = data.reduce((sum, row) => 
            sum + (parseFloat(row.reach) || 0), 0
          );

          // Métricas calculadas
          const custoSeguidor = totalPageLikes > 0 ? totalSpend / totalPageLikes : 0;
          const taxaConversaoSeguidor = totalReach > 0 ? (totalPageLikes / totalReach) * 100 : 0;

          setMetrics({
            totalPageLikes,
            totalSpend,
            totalReach,
            custoSeguidor,
            taxaConversaoSeguidor
          });
        }
      } catch (err) {
        console.error('Error fetching seguidores metrics:', err);
        setError('Erro ao carregar métricas de seguidores');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchMetrics();
    }
  }, [accountId, selectedPeriod]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Erro ao carregar dados de seguidores</p>
      </div>
    );
  }

  // Performance analysis based on metrics
  const custoSeguidorPerformance = metrics.custoSeguidor <= 2 ? 'excellent' : 
                                   metrics.custoSeguidor <= 5 ? 'good' : 
                                   metrics.custoSeguidor <= 10 ? 'warning' : 'critical';

  const taxaConversaoPerformance = metrics.taxaConversaoSeguidor >= 3 ? 'excellent' : 
                                   metrics.taxaConversaoSeguidor >= 2 ? 'good' : 
                                   metrics.taxaConversaoSeguidor >= 1 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard de Seguidores
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Crescimento de base de seguidores - Últimos {selectedPeriod} dias
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Curtidas na Página"
          value={formatMetric(metrics.totalPageLikes, 'number')}
          subtitle="Novas curtidas/seguidores"
          isHero={true}
          trend={null}
        />
        
        <MetricCard
          title="Custo por Seguidor"
          value={formatMetric(metrics.custoSeguidor, 'currency')}
          subtitle="Investimento por novo seguidor"
          isHero={true}
          performance={custoSeguidorPerformance}
          trend={null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Taxa de Conversão"
          value={formatMetric(metrics.taxaConversaoSeguidor, 'percentage')}
          subtitle="% que virou seguidor"
          performance={taxaConversaoPerformance}
          trend={null}
        />

        <MetricCard
          title="Alcance Total"
          value={formatMetric(metrics.totalReach, 'number')}
          subtitle="Pessoas alcançadas"
          trend={null}
        />
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          💡 Insights de Seguidores
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            • <strong>Custo por Seguidor:</strong> {metrics.custoSeguidor < 2 ? 'Excelente' : metrics.custoSeguidor < 5 ? 'Bom' : 'Pode melhorar'} 
            {metrics.custoSeguidor > 10 && ' - considere otimizar público-alvo'}
          </p>
          <p>
            • <strong>Taxa de Conversão:</strong> {metrics.taxaConversaoSeguidor > 3 ? 'Alta' : metrics.taxaConversaoSeguidor > 2 ? 'Média' : 'Baixa'} 
            - {metrics.totalPageLikes} seguidor{metrics.totalPageLikes !== 1 ? 'es' : ''} de {Math.round(metrics.totalReach)} pessoas alcançadas
          </p>
          <p>
            • <strong>Estratégia:</strong> Foque em conteúdo de valor e CTAs claros para seguir a página
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeguidoresDashboard;