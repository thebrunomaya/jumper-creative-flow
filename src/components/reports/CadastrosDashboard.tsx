// @ts-nocheck - Temporary: Type issues, will be fixed in main branch
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { formatMetric, getMetricPerformance } from '@/utils/metricPerformance';
import { startOfDay, subDays, format } from 'date-fns';
import { applyObjectiveFilter } from '@/utils/dashboardObjectives';

interface CadastrosDashboardProps {
  accountId: string;
  selectedPeriod: number;
}

interface CadastrosMetrics {
  totalLeads: number;
  totalRegistrosCompletos: number;
  totalSpend: number;
  totalLinkClicks: number;
  cpl: number;
  taxaConversaoLead: number;
}

export const CadastrosDashboard: React.FC<CadastrosDashboardProps> = ({
  accountId,
  selectedPeriod
}) => {
  const [metrics, setMetrics] = useState<CadastrosMetrics | null>(null);
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

        // Apply cadastros objective filter (all objectives - leads can come from multiple campaigns)
        query = applyObjectiveFilter(query, 'cadastros');
        
        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setMetrics({
            totalLeads: 0,
            totalRegistrosCompletos: 0,
            totalSpend: 0,
            totalLinkClicks: 0,
            cpl: 0,
            taxaConversaoLead: 0
          });
        } else {
          // Cálculos das métricas baseados no config
          const totalLeads = data.reduce((sum, row) => 
            sum + (parseFloat(row.actions_lead) || 0), 0
          );
          
          const totalRegistrosCompletos = data.reduce((sum, row) => 
            sum + (parseFloat(row.actions_complete_registration) || 0), 0
          );
          
          const totalSpend = data.reduce((sum, row) => 
            sum + (parseFloat(row.spend) || 0), 0
          );
          
          const totalLinkClicks = data.reduce((sum, row) => 
            sum + (parseFloat(row.link_clicks) || 0), 0
          );

          // Métricas calculadas conforme config
          const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
          const taxaConversaoLead = totalLinkClicks > 0 ? (totalLeads / totalLinkClicks) * 100 : 0;

          setMetrics({
            totalLeads,
            totalRegistrosCompletos,
            totalSpend,
            totalLinkClicks,
            cpl,
            taxaConversaoLead
          });
        }
      } catch (err) {
        console.error('Error fetching cadastros metrics:', err);
        setError('Erro ao carregar métricas de cadastros');
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
        <p className="text-gray-500">Erro ao carregar dados de cadastros</p>
      </div>
    );
  }

  // Performance analysis based on metrics
  const cplPerformance = metrics.cpl <= 25 ? 'excellent' : 
                         metrics.cpl <= 50 ? 'good' : 
                         metrics.cpl <= 100 ? 'warning' : 'critical';

  const taxaConversaoPerformance = metrics.taxaConversaoLead >= 15 ? 'excellent' : 
                                   metrics.taxaConversaoLead >= 10 ? 'good' : 
                                   metrics.taxaConversaoLead >= 5 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard de Cadastros
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Geração de leads e cadastros - Últimos {selectedPeriod} dias
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Cadastros Realizados"
          value={formatMetric(metrics.totalLeads, 'number')}
          subtitle="Total de leads capturados"
          isHero={true}
          trend={null}
        />
        
        <MetricCard
          title="CPL (Custo por Lead)"
          value={formatMetric(metrics.cpl, 'currency')}
          subtitle="Investimento por cadastro"
          isHero={true}
          performance={cplPerformance}
          trend={null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Registros Completos"
          value={formatMetric(metrics.totalRegistrosCompletos, 'number')}
          subtitle="Cadastros finalizados"
          trend={null}
        />

        <MetricCard
          title="Taxa de Conversão"
          value={formatMetric(metrics.taxaConversaoLead, 'percentage')}
          subtitle="% de cliques que viraram lead"
          performance={taxaConversaoPerformance}
          trend={null}
        />
      </div>

      {/* Funil de Conversão */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Funil de Cadastros
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium">Cliques no Link</span>
            <span className="text-lg font-bold text-blue-600">{formatMetric(metrics.totalLinkClicks, 'number')}</span>
          </div>
          <div className="text-center text-xs text-gray-500">↓ {metrics.taxaConversaoLead.toFixed(1)}% converte</div>
          <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
            <span className="text-sm font-medium">Leads Gerados</span>
            <span className="text-lg font-bold text-orange-600">{formatMetric(metrics.totalLeads, 'number')}</span>
          </div>
          {metrics.totalRegistrosCompletos > 0 && (
            <>
              <div className="text-center text-xs text-gray-500">
                ↓ {metrics.totalLeads > 0 ? ((metrics.totalRegistrosCompletos / metrics.totalLeads) * 100).toFixed(1) : 0}% finaliza
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="text-sm font-medium">Registros Completos</span>
                <span className="text-lg font-bold text-green-600">{formatMetric(metrics.totalRegistrosCompletos, 'number')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          💡 Insights de Cadastros
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            • <strong>CPL:</strong> {metrics.cpl < 25 ? 'Excelente' : metrics.cpl < 50 ? 'Bom' : metrics.cpl < 100 ? 'Atenção' : 'Crítico'} 
            - R$ {metrics.cpl.toFixed(2)} por lead {metrics.cpl > 100 && '(otimize público e criativos)'}
          </p>
          <p>
            • <strong>Taxa de Conversão:</strong> {metrics.taxaConversaoLead > 15 ? 'Excelente' : metrics.taxaConversaoLead > 10 ? 'Boa' : 'Baixa'} 
            - {metrics.taxaConversaoLead.toFixed(1)}% dos cliques geram lead
          </p>
          <p>
            • <strong>Qualidade:</strong> {metrics.totalRegistrosCompletos > 0 ? 
              `${((metrics.totalRegistrosCompletos / metrics.totalLeads) * 100).toFixed(0)}% finalizam cadastro` : 
              'Configure eventos de registro completo'
            }
          </p>
          {metrics.totalLeads === 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ <strong>Atenção:</strong> Nenhum lead detectado - verifique configuração do Pixel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CadastrosDashboard;