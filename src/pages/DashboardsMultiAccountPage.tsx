import { useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/Header';
import { ObjectiveSelector } from '@/components/dashboards/ObjectiveSelector';
import { AccountsMetricsTable } from '@/components/dashboards/AccountsMetricsTable';
import { DateRangePicker } from '@/components/optimization/DateRangePicker';
import { useMultiAccountMetrics, type DashboardObjective } from '@/hooks/useMultiAccountMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, RefreshCw } from 'lucide-react';

export default function DashboardsMultiAccountPage() {
  // State for filters
  const [objective, setObjective] = useState<DashboardObjective>('geral');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfDay(subDays(new Date(), 1)), // Yesterday (default)
    end: startOfDay(subDays(new Date(), 1)),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format dates for API
  const dateStart = format(dateRange.start, 'yyyy-MM-dd');
  const dateEnd = format(dateRange.end, 'yyyy-MM-dd');

  // Fetch metrics
  const { accounts, loading, error } = useMultiAccountMetrics({
    objective,
    dateStart,
    dateEnd,
    enabled: true,
  });

  const handleDateRangeApply = (newRange: { start: Date; end: Date }) => {
    setDateRange(newRange);
    setShowDatePicker(false);
  };

  const formatDateRangeDisplay = () => {
    const isSameDay = dateRange.start.toDateString() === dateRange.end.toDateString();

    if (isSameDay) {
      return format(dateRange.start, "dd 'de' MMMM", { locale: ptBR });
    }

    return `${format(dateRange.start, "dd 'de' MMM", { locale: ptBR })} - ${format(
      dateRange.end,
      "dd 'de' MMM",
      { locale: ptBR }
    )}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Relatórios de Performance</CardTitle>
                <CardDescription>
                  Visão comparativa de todas as contas acessíveis
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* Date Range Selector */}
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(true)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRangeDisplay()}</span>
                </Button>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={loading}
                  onClick={() => {
                    // Force refetch by updating state (hacky, better with React Query)
                    setObjective(objective);
                  }}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Objective Selector */}
            <ObjectiveSelector value={objective} onChange={setObjective} />
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-medium">Erro ao carregar métricas:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Table */}
        <AccountsMetricsTable accounts={accounts} objective={objective} loading={loading} />
      </main>

      {/* Date Range Picker Dialog */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-fit p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Selecionar Período</DialogTitle>
            <DialogDescription>
              Escolha o intervalo de datas para análise dos relatórios
            </DialogDescription>
          </DialogHeader>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            showCompare={false}
            onClose={() => setShowDatePicker(false)}
            onApply={() => handleDateRangeApply(dateRange)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
