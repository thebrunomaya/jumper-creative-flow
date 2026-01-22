import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MousePointer, Users, ShoppingCart, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { useIntegratedFunnel, FunnelData } from '@/hooks/useIntegratedFunnel';
import { startOfDay, subDays, format } from 'date-fns';

interface IntegratedFunnelDashboardProps {
  accountId: string;
  accountName: string;
  selectedPeriod?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const getTaxaChegadaPerformance = (taxa: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (taxa >= 25) return 'excellent';
  if (taxa >= 15) return 'good';
  if (taxa >= 10) return 'warning';
  return 'critical';
};

const getTaxaEngajamentoPerformance = (taxa: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (taxa >= 50) return 'excellent';
  if (taxa >= 30) return 'good';
  if (taxa >= 15) return 'warning';
  return 'critical';
};

export function IntegratedFunnelDashboard({
  accountId,
  accountName,
  selectedPeriod = 7,
}: IntegratedFunnelDashboardProps) {
  const { data, summary, loading, error, refetch } = useIntegratedFunnel(accountId, selectedPeriod);

  const endDate = startOfDay(subDays(new Date(), 1));
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1));
  const dateRangeDisplay = `${format(startDate, 'dd/MM/yy')} a ${format(endDate, 'dd/MM/yy')}`;

  if (loading) {
    return <SkeletonDashboard cardCount={8} />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem dados</CardTitle>
          <CardDescription>Nenhum dado encontrado para o período selecionado.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Funnel visualization data
  const funnelSteps = [
    { label: 'Impressões', value: summary.total_impressions, icon: '👁️' },
    { label: 'Cliques', value: summary.total_link_clicks, icon: '👆' },
    { label: 'Sessões', value: summary.total_sessions, icon: '🌐' },
    { label: 'Engajadas', value: summary.total_engaged_sessions, icon: '⏱️' },
    { label: 'Conversões', value: summary.total_ga4_conversions, icon: '🎯' },
  ];

  const maxFunnelValue = Math.max(...funnelSteps.map(s => s.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Funil Integrado</h2>
          <p className="text-muted-foreground">
            {accountName} | {dateRangeDisplay}
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Funil de Conversão
          </CardTitle>
          <CardDescription>
            Visualização do funil desde impressão até conversão no site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelSteps.map((step, index) => {
              const widthPercent = maxFunnelValue > 0 ? (step.value / maxFunnelValue) * 100 : 0;
              const dropRate = index > 0 && funnelSteps[index - 1].value > 0
                ? ((funnelSteps[index - 1].value - step.value) / funnelSteps[index - 1].value) * 100
                : 0;

              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{step.icon}</span>
                      <span className="font-medium">{step.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{formatNumber(step.value)}</span>
                      {dropRate > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          -{dropRate.toFixed(1)}%
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.max(widthPercent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Taxa de Chegada"
          value={formatPercentage(summary.avg_taxa_chegada)}
          subtitle="Cliques que viraram sessões"
          icon={MousePointer}
          performance={getTaxaChegadaPerformance(summary.avg_taxa_chegada)}
          isHero
        />
        <MetricCard
          title="Taxa de Engajamento"
          value={formatPercentage(summary.avg_taxa_engajamento)}
          subtitle="Sessões engajadas"
          icon={Users}
          performance={getTaxaEngajamentoPerformance(summary.avg_taxa_engajamento)}
          isHero
        />
        <MetricCard
          title="ROAS Meta"
          value={summary.avg_roas_meta.toFixed(2)}
          subtitle={formatCurrency(summary.total_meta_revenue)}
          icon={TrendingUp}
          performance={summary.avg_roas_meta >= 3 ? 'excellent' : summary.avg_roas_meta >= 2 ? 'good' : 'warning'}
          isHero
        />
        <MetricCard
          title="ROAS GA4"
          value={summary.avg_roas_ga4.toFixed(2)}
          subtitle={formatCurrency(summary.total_ga4_revenue)}
          icon={ShoppingCart}
          performance={summary.avg_roas_ga4 >= 3 ? 'excellent' : summary.avg_roas_ga4 >= 2 ? 'good' : 'warning'}
          isHero
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Investimento"
          value={formatCurrency(summary.total_spend)}
          subtitle={`${data.length} campanhas`}
        />
        <MetricCard
          title="Cliques"
          value={formatNumber(summary.total_link_clicks)}
          subtitle="Link clicks"
        />
        <MetricCard
          title="Sessões"
          value={formatNumber(summary.total_sessions)}
          subtitle="No site (GA4)"
        />
        <MetricCard
          title="Conversões GA4"
          value={formatNumber(summary.total_ga4_conversions)}
          subtitle="Eventos de conversão"
        />
      </div>

      {/* Comparison Meta vs GA4 */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Ads vs Google Analytics</CardTitle>
          <CardDescription>Comparação entre métricas reportadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">Meta Ads</Badge>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversões</span>
                  <span className="font-bold">{formatNumber(summary.total_meta_conversions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita</span>
                  <span className="font-bold">{formatCurrency(summary.total_meta_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROAS</span>
                  <span className="font-bold">{summary.avg_roas_meta.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">GA4</Badge>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversões</span>
                  <span className="font-bold">{formatNumber(summary.total_ga4_conversions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita</span>
                  <span className="font-bold">{formatCurrency(summary.total_ga4_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROAS</span>
                  <span className="font-bold">{summary.avg_roas_ga4.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Campanha</CardTitle>
          <CardDescription>Detalhamento do funil por campanha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Campanha</th>
                  <th className="text-right py-3 px-2">Spend</th>
                  <th className="text-right py-3 px-2">Cliques</th>
                  <th className="text-right py-3 px-2">Sessões</th>
                  <th className="text-right py-3 px-2">Taxa Chegada</th>
                  <th className="text-right py-3 px-2">Conv. GA4</th>
                  <th className="text-right py-3 px-2">ROAS GA4</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, index) => (
                  <tr key={`${row.campaign_id}-${row.date}-${index}`} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="max-w-xs truncate" title={row.campaign}>
                        {row.campaign}
                      </div>
                      <div className="text-xs text-muted-foreground">{row.date}</div>
                    </td>
                    <td className="text-right py-3 px-2">{formatCurrency(row.spend)}</td>
                    <td className="text-right py-3 px-2">{formatNumber(row.link_clicks)}</td>
                    <td className="text-right py-3 px-2">
                      {row.sessions != null ? formatNumber(row.sessions) : '-'}
                    </td>
                    <td className="text-right py-3 px-2">
                      {row.taxa_chegada != null ? (
                        <Badge
                          variant="outline"
                          className={
                            row.taxa_chegada >= 25
                              ? 'bg-green-50 text-green-700'
                              : row.taxa_chegada >= 15
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                          }
                        >
                          {formatPercentage(row.taxa_chegada)}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-right py-3 px-2">
                      {row.ga4_conversions != null ? formatNumber(row.ga4_conversions) : '-'}
                    </td>
                    <td className="text-right py-3 px-2">
                      {row.roas_ga4 != null ? row.roas_ga4.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
