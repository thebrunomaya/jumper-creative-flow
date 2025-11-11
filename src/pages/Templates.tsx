import { useTemplateList } from "@/hooks/useTemplateList";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCode, Search, Loader2, GitCompare } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export default function Templates() {
  const navigate = useNavigate();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { data: templates, isLoading, error } = useTemplateList();

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  // Filter and search templates (MUST be before conditional returns)
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      const matchesSearch = template.template_id
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesBrand =
        brandFilter === "all" || template.brand_identity === brandFilter;

      return matchesSearch && matchesBrand;
    });
  }, [templates, searchQuery, brandFilter]);

  // Check if user is admin
  const isAdmin = userRole === "admin";

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar esta página",
      });
      navigate("/decks");
    }
  }, [roleLoading, isAdmin, navigate]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Carregando templates...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <FileCode className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Erro ao carregar templates
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {error instanceof Error ? error.message : "Erro desconhecido"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileCode className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold">Gerenciar Templates</h1>
            </div>
            <p className="text-muted-foreground">
              Visualize e edite templates de apresentações
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/decks/templates/compare")}
          >
            <GitCompare className="h-4 w-4 mr-2" />
            Comparar Templates
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Brand Filter */}
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            <SelectItem value="jumper">Jumper</SelectItem>
            <SelectItem value="koko">Koko</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template
          {filteredTemplates.length !== 1 ? "s" : ""} encontrado
          {filteredTemplates.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <FileCode className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Tente ajustar seus filtros de busca
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.template_id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
