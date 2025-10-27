/**
 * Optimization Page - Panel View
 * Shows all optimizations from user's accessible accounts
 * Similar to MyAccounts page logic
 */

import { useNavigate } from "react-router-dom";
import { useMyOptimizations } from "@/hooks/useMyOptimizations";
import { OptimizationsPanelList } from "@/components/optimization/OptimizationsPanelList";
import { JumperBackground } from "@/components/ui/jumper-background";
import { Loader2, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Optimization() {
  const navigate = useNavigate();
  const { optimizations, loading, error } = useMyOptimizations();

  const handleOptimizationClick = (optimization: any) => {
    // Navigate to fullscreen editor
    navigate(`/optimization/editor/${optimization.recording_id}`);
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Sparkles className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Painel de Otimizações
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {optimizations.length} {optimizations.length === 1 ? 'otimização' : 'otimizações'} nas suas contas
              </p>
            </div>
          </div>
        </header>

        {/* Optimizations List */}
        <OptimizationsPanelList
          optimizations={optimizations}
          onOptimizationClick={handleOptimizationClick}
        />
      </main>
    </JumperBackground>
  );
}

