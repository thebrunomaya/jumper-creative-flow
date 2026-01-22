import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Scale, DollarSign } from 'lucide-react';
import { useConversionDiscrepancy } from '@/hooks/useConversionDiscrepancy';
import { startOfDay, subDays, format } from 'date-fns';

interface DiscrepancyDashboardProps {
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

const getDiscrepancyPerformance = (pct: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  const absPct = Math.abs(pct);
  if (absPct <= 10) return 'excellent';
  if (absPct <= 20) return 'good';
  if (absPct <= 30) return 'warning';
  return 'critical';
};

export function DiscrepancyDashboard({
  accountId,
  accountName,
  selectedPeriod = 7,
}: DiscrepancyDashboardProps) {
  const { data, summary, loading, error, refetch } = useConversionDiscrepancy(accountId, selectedPeriod);

  const endDate = startOfDay(subDays(new Date(), 1));
  const startDate = startOfDay(subDays(endDate, selectedPeriod - 1));
  const dateRangeDisplay = `${format(startDate, 'dd/MM/yy')} a ${format(endDate, 'dd/MM/yy')}`;

  if (loading) {
    return <SkeletonDashboard cardCount={6} />;
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

  const hasHighDiscrepancy = summary.campaigns_with_high_discrepancy > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discrepância de Conversões</h2>
          <p className="text-muted-foreground">
            {accountName} | {dateRangeDisplay}
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Alert Card */}
      {hasHighDiscrepancy && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Discrepância Alta Detectada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-400">
              {summary.campaigns_with_high_discrepancy} campanha(s) com discrepância maior que 30%.
              Verifique o tracking e a atribuição de conversões.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Discrepância Média"
          value={formatPercentage(summary.avg_discrepancy_pct)}
          subtitle={`${formatNumber(summary.total_discrepancy)} conversões de diferença`}
          icon={Scale}
          performance={getDiscrepancyPerformance(summary.avg_discrepancy_pct)}
          isHero
        />
        <MetricCard
          title="Conversões Meta"
          value={formatNumber(summary.total_meta_conversions)}
          subtitle={formatCurrency(summary.total_meta_revenue)}
          icon={TrendingUp}
          isHero
        />
        <MetricCard
          title="Conversões GA4"
          value={formatNumber(summary.total_ga4_conversions)}
          subtitle={formatCurrency(summary.total_ga4_revenue)}
          icon={TrendingDown}
          isHero
        />
        <MetricCard
          title="Campanhas Críticas"
          value={summary.campaigns_with_high_discrepancy.toString()}
          subtitle="Discrepância >30%"
          icon={AlertTriangle}
          performance={summary.campaigns_with_high_discrepancy === 0 ? 'excellent' : 'critical'}
          isHero
        />
      </div>

      {/* Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Comparativo Meta Ads vs Google Analytics
          </CardTitle>
          <CardDescription>
            Diferença entre conversões e receita reportadas por cada plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8">
            {/* Meta Column */}
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">Meta Ads</Badge>
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Conversões</div>
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(summary.total_meta_conversions)}</div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Receita</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_meta_revenue)}</div>
                </div>
              </div>
            </div>

            {/* Delta Column */}
            <div className="space-y-4 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Diferença</div>
                <div className={`text-3xl font-bold ${summary.avg_discrepancy_pct > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {summary.avg_discrepancy_pct > 0 ? '+' : ''}{formatPercentage(summary.avg_discrepancy_pct)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {summary.total_discrepancy > 0 ? '+' : ''}{formatNumber(summary.total_discrepancy)} conversões
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-px w-8 bg-border" />
                <span className="text-xs">vs</span>
                <div className="h-px w-8 bg-border" />
              </div>
            </div>

            {/* GA4 Column */}
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">GA4</Badge>
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Conversões</div>
                  <div className="text-2xl font-bold text-green-600">{formatNumber(summary.total_ga4_conversions)}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Receita</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_ga4_revenue)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROAS Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              ROAS Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {summary.total_spend > 0 ? (summary.total_meta_revenue / summary.total_spend).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(summary.total_meta_revenue)} / {formatCurrency(summary.total_spend)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              ROAS GA4
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary.total_spend > 0 ? (summary.total_ga4_revenue / summary.total_spend).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(summary.total_ga4_revenue)} / {formatCurrency(summary.total_spend)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discrepância por Campanha</CardTitle>
          <CardDescription>Ordenado por maior discrepância percentual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Campanha</th>
                  <th className="text-right py-3 px-2">Spend</th>
                  <th className="text-right py-3 px-2">Conv. Meta</th>
                  <th className="text-right py-3 px-2">Conv. GA4</th>
                  <th className="text-right py-3 px-2">Discrepância</th>
                  <th className="text-right py-3 px-2">ROAS Meta</th>
                  <th className="text-right py-3 px-2">ROAS GA4</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 15).map((row, index) => {
                  const absPct = Math.abs(row.discrepancy_pct);
                  return (
                    <tr key={`${row.campaign}-${row.date}-${index}`} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="max-w-xs truncate" title={row.campaign}>
                          {row.campaign}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.date}</div>
                      </td>
                      <td className="text-right py-3 px-2">{formatCurrency(row.spend)}</td>
                      <td className="text-right py-3 px-2">
                        <span className="text-blue-600 font-medium">{formatNumber(row.meta_conversions)}</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="text-green-600 font-medium">{formatNumber(row.ga4_conversions)}</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <Badge
                          variant="outline"
                          className={
                            absPct <= 10
                              ? 'bg-green-50 text-green-700'
                              : absPct <= 20
                              ? 'bg-yellow-50 text-yellow-700'
                              : absPct <= 30
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-red-50 text-red-700'
                          }
                        >
                          {row.discrepancy_pct > 0 ? '+' : ''}{formatPercentage(row.discrepancy_pct)}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-2 text-blue-600">
                        {row.roas_meta != null ? row.roas_meta.toFixed(2) : '-'}
                      </td>
                      <td className="text-right py-3 px-2 text-green-600">
                        {row.roas_ga4 != null ? row.roas_ga4.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como interpretar a discrepância</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Meta Ads reporta MAIS conversões:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Atribuição view-through (usuário viu anúncio mas não clicou)</li>
                <li>Janela de atribuição maior no Meta (7 dias vs 1 dia)</li>
                <li>Conversões em outros dispositivos</li>
                <li>Bloqueadores de tracking (usuário bloqueou GA4)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">GA4 reporta MAIS conversões:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Pixel do Meta não instalado corretamente</li>
                <li>Evento de conversão configurado diferente</li>
                <li>Usuários em navegação privada (não trackados pelo Meta)</li>
                <li>Conversões vindas de outros canais atribuídas errado</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Recomendação:</strong> Uma discrepância de até 20% é considerada normal.
              Acima de 30%, investigue problemas de tracking ou configuração de eventos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
