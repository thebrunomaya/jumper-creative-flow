import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, Eye, MousePointer, Users, BarChart3, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCTRPerformance, 
  getCPMPerformance, 
  getCPCPerformance, 
  getFrequencyPerformance,
  formatCurrency, 
  formatPercentage, 
  formatNumber 
} from '@/utils/metricPerformance';

interface GeneralMetrics {
  total_spend: string;
  total_impressions: number;
  total_clicks: number;
  total_link_clicks: number;
  total_reach: number;
  avg_frequency: string;
  avg_cpm: string;
  avg_ctr: string;
  avg_cpc: string;
  days_active: number;
  campaigns_active: number;
  ad_sets_active: number;
}

interface AccountInfo {
  id: string;
  name: string;
  metaAdsId?: string;
}

interface GeneralDashboardProps {
  accountName?: string;
  accountInfo?: AccountInfo;
  selectedPeriod?: number;
}

export function GeneralDashboard({ accountName = 'Account', accountInfo, selectedPeriod = 7 }: GeneralDashboardProps) {
  const [metrics, setMetrics] = useState<GeneralMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeneralData = async () => {
    try {
      setLoading(true);
      
      if (!accountInfo?.metaAdsId) {
        throw new Error(`ID Meta Ads não configurado para "${accountName}"`);
      }

      const metaAdsAccountId = accountInfo.metaAdsId;
      console.log(`📊 Fetching general metrics for account: ${metaAdsAccountId} (${selectedPeriod} days)`);

      // Fetch data based on selected period
      const { data: rawData, error: dataError } = await supabase
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_id', metaAdsAccountId)
        .gte('date', new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (dataError) {
        throw new Error(`Erro ao buscar dados: ${dataError.message}`);
      }

      if (!rawData || rawData.length === 0) {
        throw new Error(`Nenhum dado encontrado para a conta ${accountName} (ID: ${metaAdsAccountId})`);
      }

      console.log(`✅ Found ${rawData.length} records for general metrics`);

      // Calculate general metrics
      const totalSpend = rawData.reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
      const totalImpressions = rawData.reduce((sum, row) => sum + (row.impressions || 0), 0);
      const totalClicks = rawData.reduce((sum, row) => sum + (row.clicks || 0), 0);
      const totalLinkClicks = rawData.reduce((sum, row) => sum + (row.link_clicks || 0), 0);
      const totalReach = rawData.reduce((sum, row) => sum + (row.reach || 0), 0);
      
      // Calculate averages
      const avgFrequency = totalReach > 0 ? (totalImpressions / totalReach).toFixed(2) : '0';
      const avgCPM = totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0';
      const avgCTR = totalImpressions > 0 ? ((totalLinkClicks / totalImpressions) * 100).toFixed(2) : '0';
      const avgCPC = totalLinkClicks > 0 ? (totalSpend / totalLinkClicks).toFixed(2) : '0';
      
      // Count unique campaigns and ad sets
      const uniqueCampaigns = new Set(rawData.map(row => row.campaign)).size;
      const uniqueAdSets = new Set(rawData.map(row => row.adset_name)).size;
      const uniqueDays = new Set(rawData.map(row => row.date)).size;

      const generalMetrics: GeneralMetrics = {
        total_spend: totalSpend.toFixed(2),
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_link_clicks: totalLinkClicks,
        total_reach: totalReach,
        avg_frequency: avgFrequency,
        avg_cpm: avgCPM,
        avg_ctr: avgCTR,
        avg_cpc: avgCPC,
        days_active: uniqueDays,
        campaigns_active: uniqueCampaigns,
        ad_sets_active: uniqueAdSets
      };

      setMetrics(generalMetrics);
      
    } catch (err: any) {
      setError(err.message);
      console.error('General dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneralData();
  }, [accountInfo, selectedPeriod]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return <SkeletonDashboard cardCount={4} heroCards={1} showHeader={true} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados: {error}</p>
          <Button onClick={fetchGeneralData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Nenhum dado encontrado para {accountInfo?.name || accountName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral da Conta</h2>
          <p className="text-muted-foreground">
            Métricas gerais - Últimos {selectedPeriod} dias
          </p>
        </div>
        <Button onClick={fetchGeneralData} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* General Metrics Cards - Jumper Design System */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Investimento Total"
          value={formatCurrency(metrics.total_spend)}
          subtitle={`${metrics.campaigns_active} campanhas ativas`}
          icon={DollarSign}
          performance="neutral"
          isHero={true}
        />

        <MetricCard
          title="Impressões"
          value={formatNumber(metrics.total_impressions)}
          subtitle={`CPM: ${formatCurrency(metrics.avg_cpm)}`}
          icon={Eye}
          performance={getCPMPerformance(parseFloat(metrics.avg_cpm))}
        />

        <MetricCard
          title="Cliques no Link"
          value={formatNumber(metrics.total_link_clicks)}
          subtitle={`CPC: ${formatCurrency(metrics.avg_cpc)}`}
          icon={MousePointer}
          performance={getCPCPerformance(parseFloat(metrics.avg_cpc))}
        />

        <MetricCard
          title="CTR (Link)"
          value={formatPercentage(metrics.avg_ctr)}
          subtitle="Taxa de cliques no link"
          icon={BarChart3}
          performance={getCTRPerformance(parseFloat(metrics.avg_ctr))}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.total_reach)}</div>
            <p className="text-xs text-muted-foreground">
              Pessoas alcançadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_frequency}</div>
            <p className="text-xs text-muted-foreground">
              Impressões por pessoa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estrutura</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ad_sets_active}</div>
            <p className="text-xs text-muted-foreground">
              Conjuntos de anúncios ativos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}