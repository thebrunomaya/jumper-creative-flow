import { useState, useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/Header';
import { ObjectiveSelector } from '@/components/dashboards/ObjectiveSelector';
import { AccountsMetricsTable } from '@/components/dashboards/AccountsMetricsTable';
import { DateRangePicker } from '@/components/optimization/DateRangePicker';
import { useMultiAccountMetrics, type DashboardObjective, type AccountMetrics } from '@/hooks/useMultiAccountMetrics';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, RefreshCw, SlidersHorizontal, Search, X } from 'lucide-react';

export default function DashboardsMultiAccountPage() {
  // Get user role
  const { userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  // State for filters
  const [objective, setObjective] = useState<DashboardObjective>('geral');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfDay(subDays(new Date(), 1)), // Yesterday (default)
    end: startOfDay(subDays(new Date(), 1)),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Advanced filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Format dates for API
  const dateStart = format(dateRange.start, 'yyyy-MM-dd');
  const dateEnd = format(dateRange.end, 'yyyy-MM-dd');

  // Fetch metrics
  const { accounts, loading, error } = useMultiAccountMetrics({
    objective,
    dateStart,
    dateEnd,
    enabled: true,
    includeInactive,
  });

  // Extract unique values for filters
  const uniqueStatuses = useMemo(
    () => [...new Set(accounts.map((acc) => acc.status).filter(Boolean))] as string[],
    [accounts]
  );

  const uniqueTiers = useMemo(
    () => [...new Set(accounts.map((acc) => acc.tier).filter(Boolean))] as string[],
    [accounts]
  );

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((acc) =>
        acc.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (acc) => acc.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter((acc) => acc.tier === tierFilter);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.account_name || '').localeCompare(b.account_name || '');
        case 'tier':
          return (b.tier || '').localeCompare(a.tier || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'spend':
          return (b.metrics?.spend || 0) - (a.metrics?.spend || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [accounts, searchTerm, statusFilter, tierFilter, sortBy]);

  // Check if any filter is active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || tierFilter !== 'all' || includeInactive;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTierFilter('all');
    setIncludeInactive(false);
  };

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
                  {filteredAccounts.length === accounts.length
                    ? `${accounts.length} contas`
                    : `${filteredAccounts.length} de ${accounts.length} contas`}
                  {hasActiveFilters && ' (filtradas)'}
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

                {/* Advanced Filters */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={hasActiveFilters ? 'border-orange-500 text-orange-500' : ''}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Filtros Avançados</h4>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>

                      {/* Search */}
                      <div className="space-y-2">
                        <Label htmlFor="search" className="text-xs text-muted-foreground">
                          Buscar conta
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="search"
                            type="text"
                            placeholder="Nome da conta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            {uniqueStatuses.map((status) => (
                              <SelectItem key={status} value={status?.toLowerCase() || ''}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tier Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tier</Label>
                        <Select value={tierFilter} onValueChange={setTierFilter}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Tiers</SelectItem>
                            {uniqueTiers.map((tier) => (
                              <SelectItem key={tier} value={tier || ''}>
                                {tier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort By */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nome (A-Z)</SelectItem>
                            <SelectItem value="tier">Tier</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="spend">Investimento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show Inactive (Admin only) */}
                      {isAdmin && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Label htmlFor="include-inactive" className="text-xs text-muted-foreground">
                            Mostrar contas inativas
                          </Label>
                          <Switch
                            id="include-inactive"
                            checked={includeInactive}
                            onCheckedChange={setIncludeInactive}
                          />
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

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
        <AccountsMetricsTable accounts={filteredAccounts} objective={objective} loading={loading} />
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
