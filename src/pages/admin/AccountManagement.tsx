/**
 * AccountManagement - Admin page for managing account data
 * Allows editing accounts with sync to Notion
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { JumperBackground } from "@/components/ui/jumper-background";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMyNotionAccounts, NotionAccount } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { AccountForm } from "@/components/admin/AccountForm";
import {
  Building2,
  ChevronRight,
  Edit,
  Home,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountManagement() {
  const navigate = useNavigate();
  const { accounts, loading, error, refetch } = useMyNotionAccounts();
  const { userRole, isAdmin } = useUserRole();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Edit state
  const [selectedAccount, setSelectedAccount] = useState<NotionAccount | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.gestor?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" ||
        account.status?.toLowerCase() === statusFilter.toLowerCase();

      // Tier filter
      const matchesTier = tierFilter === "all" ||
        account.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [accounts, searchQuery, statusFilter, tierFilter]);

  const handleEditAccount = (account: NotionAccount) => {
    setSelectedAccount(account);
    setIsSheetOpen(true);
  };

  const handleEditSuccess = () => {
    setIsSheetOpen(false);
    setSelectedAccount(null);
    refetch();
  };

  const handleEditCancel = () => {
    setIsSheetOpen(false);
    setSelectedAccount(null);
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "ativo":
        return "default";
      case "inativo":
        return "secondary";
      case "pausado":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando contas...</p>
            </div>
          </div>
        </main>
      </JumperBackground>
    );
  }

  if (error) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar contas: {error}
            </AlertDescription>
          </Alert>
        </main>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Gestão de Contas</span>
        </div>

        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Building2 className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Gestão de Contas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Edite dados das contas. Alterações são salvas no Notion em tempo real.
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou gestor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                  <SelectItem value="5">Tier 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredAccounts.length} de {accounts.length} contas
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {filteredAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma conta encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map(account => (
              <Card key={account.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base truncate">
                          {account.name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(account.status)}>
                          {account.status || "N/A"}
                        </Badge>
                        {account.tier && (
                          <Badge variant="outline">Tier {account.tier}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {account.gestor && (
                          <span>Gestor: {account.gestor}</span>
                        )}
                        {account.objectives && account.objectives.length > 0 && (
                          <span>
                            Objetivos: {account.objectives.slice(0, 3).join(", ")}
                            {account.objectives.length > 3 && ` +${account.objectives.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAccount(account)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Conta</SheetTitle>
            <SheetDescription>
              {selectedAccount?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedAccount && (
            <div className="mt-6">
              <AccountForm
                account={selectedAccount}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </JumperBackground>
  );
}
