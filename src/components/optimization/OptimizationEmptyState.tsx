/**
 * OptimizationEmptyState - Shows when no account is selected
 */

import { Card, CardContent } from "@/components/ui/card";
import { FileAudio, ArrowRight } from "lucide-react";

export function OptimizationEmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          <FileAudio className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhuma conta selecionada</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Selecione uma conta de anúncios acima para começar a gravar e visualizar suas otimizações de tráfego
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Escolha uma conta</span>
          <ArrowRight className="h-4 w-4" />
          <span>Grave sua otimização</span>
          <ArrowRight className="h-4 w-4" />
          <span>Receba análise com IA</span>
        </div>
      </CardContent>
    </Card>
  );
}
