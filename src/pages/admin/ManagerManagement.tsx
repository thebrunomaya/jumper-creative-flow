/**
 * ManagerManagement - Admin page for managing manager data
 * Allows editing managers with sync to Notion
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { JumperBackground } from "@/components/ui/jumper-background";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMyManagers, NotionManager } from "@/hooks/useMyManagers";
import { ManagerForm } from "@/components/admin/ManagerForm";
import {
  Users,
  ChevronRight,
  Edit,
  Home,
  Loader2,
  Search,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManagerManagement() {
  const navigate = useNavigate();
  const { managers, loading, error, refetch } = useMyManagers();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Edit state
  const [selectedManager, setSelectedManager] = useState<NotionManager | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter managers
  const filteredManagers = useMemo(() => {
    return managers.filter(manager => {
      const matchesSearch = searchQuery === "" ||
        manager.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [managers, searchQuery]);

  const handleEditManager = (manager: NotionManager) => {
    setSelectedManager(manager);
    setIsSheetOpen(true);
  };

  const handleEditSuccess = () => {
    setIsSheetOpen(false);
    setSelectedManager(null);
    refetch();
  };

  const handleEditCancel = () => {
    setIsSheetOpen(false);
    setSelectedManager(null);
  };

  if (loading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando gerentes...</p>
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
              Erro ao carregar gerentes: {error}
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
          <span className="text-foreground font-medium">Gestão de Gerentes</span>
        </div>

        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Users className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Gestão de Gerentes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Edite dados dos gerentes parceiros. Alterações são salvas no Notion.
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredManagers.length} de {managers.length} gerentes
        </div>

        {/* Managers List */}
        <div className="space-y-3">
          {filteredManagers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum gerente encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredManagers.map(manager => (
              <Card key={manager.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base truncate">
                          {manager.nome || "Sem nome"}
                        </h3>
                        {manager.funcao.map(f => (
                          <Badge key={f} variant="secondary">
                            {f}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {manager.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {manager.email}
                          </span>
                        )}
                        {manager.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {manager.telefone}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditManager(manager)}
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
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Gerente</SheetTitle>
            <SheetDescription>
              {selectedManager?.nome}
            </SheetDescription>
          </SheetHeader>

          {selectedManager && (
            <div className="mt-6">
              <ManagerForm
                manager={selectedManager}
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
