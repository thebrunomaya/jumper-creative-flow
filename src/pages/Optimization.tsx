/**
 * Optimization Page - Panel View
 * Shows all optimizations from user's accessible accounts
 * Similar to MyAccounts page logic
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyOptimizations } from "@/hooks/useMyOptimizations";
import { OptimizationsPanelList } from "@/components/optimization/OptimizationsPanelList";
import { JumperBackground } from "@/components/ui/jumper-background";
import { Loader2, Sparkles, X } from "lucide-react";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JumperButton } from "@/components/ui/jumper-button";

export default function Optimization() {
  const navigate = useNavigate();
  const { optimizations, loading, error } = useMyOptimizations();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Get unique accounts from optimizations
  const uniqueAccounts = useMemo(() => {
    const accountsMap = new Map<string, string>();
    optimizations.forEach(opt => {
      accountsMap.set(opt.account_id, opt.account_name);
    });
    return Array.from(accountsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [optimizations]);

  // Filter optimizations by selected account
  const filteredOptimizations = useMemo(() => {
    if (!selectedAccountId) return optimizations;
    return optimizations.filter(opt => opt.account_id === selectedAccountId);
  }, [optimizations, selectedAccountId]);

  const handleOptimizationClick = (optimization: any) => {
    // Navigate to fullscreen editor
    navigate(`/optimization/editor/${optimization.recording_id}`);
  };

  const handleClearFilter = () => {
    setSelectedAccountId(null);
  };

  if (loading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando otimizações...</p>
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
              Erro ao carregar otimizações: {error}
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
        {/* Page Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
                <Sparkles className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Painel de Otimizações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredOptimizations.length} {filteredOptimizations.length === 1 ? 'otimização' : 'otimizações'}
                  {selectedAccountId && ' nesta conta'}
                  {!selectedAccountId && ' nas suas contas'}
                </p>
              </div>
            </div>

            {/* Account Filter */}
            {uniqueAccounts.length > 1 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedAccountId || "all"}
                  onValueChange={(value) => setSelectedAccountId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filtrar por conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {uniqueAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAccountId && (
                  <JumperButton
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilter}
                    className="h-10 px-3"
                  >
                    <X className="h-4 w-4" />
                  </JumperButton>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Optimizations List */}
        <OptimizationsPanelList
          optimizations={filteredOptimizations}
          onOptimizationClick={handleOptimizationClick}
        />
      </main>
    </JumperBackground>
  );
}

