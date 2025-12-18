import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';
import { TopCreativesSection } from './TopCreativesSection';

interface ConversasDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface ConversasMetrics {
  totalConversas: number;
  totalSpend: number;
  totalReach: number;
  custoConversa: number;
  taxaConversa: number;
}

export const ConversasDashboard: React.FC<ConversasDashboardProps> = ({
  accountId,
  selectedPeriod
}) => {
  const [metrics, setMetrics] = useState<ConversasMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range for TopCreativesSection
  const endDate = startOfDay(subDays(new Date(), 1)); // Ontem (não hoje)
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1)); // N dias para trás

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

        // Apply conversations objective filter (MESSAGES only)
        query = applyObjectiveFilter(query, 'conversas');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            totalConversas: 0,
            totalSpend: 0,
            totalReach: 0,
            custoConversa: 0,
            taxaConversa: 0
          });
        } else {
          // Cálculos das métricas baseados no config
          const totalConversas = data.reduce((sum, row) => 
            sum + (parseFloat(String(row.actions_onsite_conversion_messaging_conversation_started_7d || 0))), 0
          );
          
          const totalSpend = data.reduce((sum, row) => 
            sum + (parseFloat(String(row.spend || 0))), 0
          );
          
          const totalReach = data.reduce((sum, row) => 
            sum + (parseFloat(String(row.reach || 0))), 0
          );

          // Métricas calculadas
          const custoConversa = totalConversas > 0 ? totalSpend / totalConversas : 0;
          const taxaConversa = totalReach > 0 ? (totalConversas / totalReach) * 100 : 0;

          setMetrics({
            totalConversas,
            totalSpend,
            totalReach,
            custoConversa,
            taxaConversa
          });
        }
      } catch (err) {
        console.error('Error fetching conversas metrics:', err);
        setError('Erro ao carregar métricas de conversas');
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
        <p className="text-gray-500">Erro ao carregar dados de conversas</p>
      </div>
    );
  }

  // Performance analysis based on metrics
  const custoConversaPerformance = metrics.custoConversa <= 10 ? 'excellent' : 
                                   metrics.custoConversa <= 25 ? 'good' : 
                                   metrics.custoConversa <= 50 ? 'warning' : 'critical';

  const taxaConversaPerformance = metrics.taxaConversa >= 2 ? 'excellent' : 
                                  metrics.taxaConversa >= 1 ? 'good' : 
                                  metrics.taxaConversa >= 0.5 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard de Conversas
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Mensagens e conversas iniciadas - Últimos {selectedPeriod} dias
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Conversas Iniciadas"
          value={formatMetric(metrics.totalConversas, 'number')}
          subtitle="Chats iniciados em 7 dias"
          isHero={true}
          trend={null}
        />
        
        <MetricCard
          title="Custo por Conversa"
          value={formatMetric(metrics.custoConversa, 'currency')}
          subtitle="Investimento por chat"
          isHero={true}
          performance={custoConversaPerformance}
          trend={null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Taxa de Conversa"
          value={formatMetric(metrics.taxaConversa, 'percentage')}
          subtitle="% que iniciou conversa"
          performance={taxaConversaPerformance}
          trend={null}
        />

        <MetricCard
          title="Investimento Total"
          value={formatMetric(metrics.totalSpend, 'currency')}
          subtitle="Gasto no período"
          trend={null}
        />
      </div>

      {/* Top Creatives Section */}
      <TopCreativesSection
        accountId={accountId}
        objective="conversas"
        dateStart={startDate}
        dateEnd={endDate}
      />

      {/* Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          💬 Insights de Conversas
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            • <strong>Performance:</strong> {metrics.totalConversas} conversa{metrics.totalConversas !== 1 ? 's' : ''} iniciada{metrics.totalConversas !== 1 ? 's' : ''}
            {metrics.custoConversa < 10 ? ' com custo excelente' : metrics.custoConversa < 25 ? ' com bom custo' : ' - otimize para reduzir custo'}
          </p>
          <p>
            • <strong>Taxa de Engajamento:</strong> {metrics.taxaConversa > 2 ? 'Alta' : metrics.taxaConversa > 1 ? 'Média' : 'Baixa'}
            - {metrics.taxaConversa.toFixed(2)}% das pessoas alcançadas iniciaram conversa
          </p>
          <p>
            • <strong>Estratégia:</strong> Use CTAs diretos como "Fale Conosco" e responda rapidamente
          </p>
          {metrics.totalConversas === 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ <strong>Atenção:</strong> Nenhuma conversa detectada - verifique configuração de eventos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversasDashboard;