import React, { useState, useMemo, useEffect } from 'react';
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { AccountCard, AccessReason } from '@/components/AccountCard';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Filter, Users, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

function getAccessReason(
  account: any,
  userEmail: string,
  userRole: UserRole
): AccessReason {
  if (userRole === 'admin') return 'ADMIN';

  // Use email fields for OAuth matching (gestor_email, supervisor_email)
  const gestorEmail = account.gestor_email?.toLowerCase() || '';
  const supervisorEmail = account.supervisor_email?.toLowerCase() || '';
  const email = userEmail.toLowerCase();

  if (gestorEmail.includes(email)) return 'GESTOR';
  if (supervisorEmail.includes(email)) return 'SUPERVISOR';

  return 'GERENTE';
}

const MyAccounts: React.FC = () => {
  const { accounts, loading, error } = useMyNotionAccounts();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    document.title = 'Minhas Contas • Jumper Ads Platform';
  }, []);

  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((acc) =>
        acc.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          return (a.name || '').localeCompare(b.name || '');
        case 'tier':
          return (b.tier || '').localeCompare(a.tier || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [accounts, searchTerm, statusFilter, tierFilter, sortBy]);

  // Extract unique values for filters
  const uniqueStatuses = useMemo(
    () => [...new Set(accounts.map((acc) => acc.status).filter(Boolean))],
    [accounts]
  );

  const uniqueTiers = useMemo(
    () => [...new Set(accounts.map((acc) => acc.tier).filter(Boolean))],
    [accounts]
  );

  if (loading || roleLoading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando suas contas...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar contas: {error}
            </AlertDescription>
          </Alert>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-label="Minhas contas"
      >
        {/* Header Section */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Users className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Minhas Contas
              </h1>
              <p className="text-sm text-muted-foreground">
                {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'} sob
                sua gestão
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome da conta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[150px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
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

                <div className="flex-1 min-w-[150px]">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tier" />
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

                <div className="flex-1 min-w-[150px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                      <SelectItem value="tier">Tier</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(searchTerm || statusFilter !== 'all' || tierFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setTierFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </header>

        {/* Results Count */}
        {filteredAndSortedAccounts.length !== accounts.length && (
          <div className="mb-4">
            <Badge variant="secondary">
              {filteredAndSortedAccounts.length} de {accounts.length} contas
            </Badge>
          </div>
        )}

        {/* Accounts Grid */}
        {filteredAndSortedAccounts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium text-foreground">
                Nenhuma conta encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                accessReason={getAccessReason(
                  account,
                  currentUser?.email || '',
                  userRole
                )}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default MyAccounts;
