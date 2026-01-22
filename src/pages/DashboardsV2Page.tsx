import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, BarChart3, TrendingUp, Scale } from 'lucide-react';
import { useMyNotionAccounts, NotionAccount } from '@/hooks/useMyNotionAccounts';
import { IntegratedFunnelDashboard } from '@/components/dashboards-v2/IntegratedFunnelDashboard';
import { DiscrepancyDashboard } from '@/components/dashboards-v2/DiscrepancyDashboard';

type DashboardTemplate = 'funnel' | 'discrepancy';

interface TemplateOption {
  value: DashboardTemplate;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const dashboardTemplates: TemplateOption[] = [
  {
    value: 'funnel',
    label: 'Funil Integrado',
    description: 'Meta Ads + GA4 combinados',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    value: 'discrepancy',
    label: 'Discrepância',
    description: 'Meta vs GA4 conversões',
    icon: <Scale className="h-4 w-4" />,
  },
];

export default function DashboardsV2Page() {
  const { accounts, loading, error } = useMyNotionAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate>('funnel');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);

  // Filter accounts that have meta_ads_id (required for these dashboards)
  const accountsWithMetaAds = useMemo(() => {
    return accounts.filter((acc) => acc.meta_ads_id);
  }, [accounts]);

  // Get selected account info
  const selectedAccount = useMemo(() => {
    return accountsWithMetaAds.find((acc) => acc.meta_ads_id === selectedAccountId);
  }, [accountsWithMetaAds, selectedAccountId]);

  // Auto-select first account if none selected
  React.useEffect(() => {
    if (!selectedAccountId && accountsWithMetaAds.length > 0) {
      setSelectedAccountId(accountsWithMetaAds[0].meta_ads_id || '');
    }
  }, [accountsWithMetaAds, selectedAccountId]);

  const renderDashboard = () => {
    if (!selectedAccountId || !selectedAccount) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione uma conta</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Escolha uma conta no seletor acima para visualizar os dashboards integrados.
            </p>
          </CardContent>
        </Card>
      );
    }

    switch (selectedTemplate) {
      case 'funnel':
        return (
          <IntegratedFunnelDashboard
            accountId={selectedAccountId}
            accountName={selectedAccount.name}
            selectedPeriod={selectedPeriod}
          />
        );
      case 'discrepancy':
        return (
          <DiscrepancyDashboard
            accountId={selectedAccountId}
            accountName={selectedAccount.name}
            selectedPeriod={selectedPeriod}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar contas</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (accountsWithMetaAds.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma conta disponível</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Não foram encontradas contas com ID Meta Ads configurado.
                Verifique se suas contas estão corretamente vinculadas.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Controls Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Dashboards Integrados v2
                  </CardTitle>
                  <CardDescription>
                    Análise cross-platform: Meta Ads + Google Analytics 4
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Account Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Conta:</span>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountsWithMetaAds.map((account) => (
                          <SelectItem key={account.meta_ads_id} value={account.meta_ads_id || ''}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Period Selector */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(parseInt(v))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="14">14 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Dashboard Template Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tipo de Dashboard:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {dashboardTemplates.map((template) => (
                    <button
                      key={template.value}
                      onClick={() => setSelectedTemplate(template.value)}
                      className={`
                        relative p-4 border rounded-lg text-left transition-all duration-200 hover:shadow-md
                        ${selectedTemplate === template.value
                          ? 'border-[hsl(var(--orange-hero))] bg-[hsl(var(--orange-subtle))] ring-2 ring-[hsl(var(--orange-hero)/0.2)]'
                          : 'border-border hover:border-muted-foreground bg-card'
                        }
                      `}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 font-medium text-sm ${
                          selectedTemplate === template.value
                            ? 'text-[hsl(var(--orange-hero))]'
                            : 'text-foreground'
                        }`}>
                          {template.icon}
                          {template.label}
                        </div>
                        <div className={`text-xs ${
                          selectedTemplate === template.value
                            ? 'text-[hsl(var(--orange-hero)/0.8)]'
                            : 'text-muted-foreground'
                        }`}>
                          {template.description}
                        </div>
                      </div>
                      {selectedTemplate === template.value && (
                        <div className="absolute top-2 right-2">
                          <div className="h-2 w-2 bg-[hsl(var(--orange-hero))] rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Content */}
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}
