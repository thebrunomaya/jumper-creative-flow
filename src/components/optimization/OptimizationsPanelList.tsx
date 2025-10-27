/**
 * OptimizationsPanelList - Panel view of all optimizations across accessible accounts
 * Similar to "Gravações Recentes" but shows all user's optimizations with account context
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileAudio, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OptimizationWithDetails } from "@/hooks/useMyOptimizations";

interface OptimizationsPanelListProps {
  optimizations: OptimizationWithDetails[];
  onOptimizationClick: (optimization: OptimizationWithDetails) => void;
}

export function OptimizationsPanelList({
  optimizations,
  onOptimizationClick,
}: OptimizationsPanelListProps) {
  const getStatusIcon = (transcriptionStatus: string, analysisStatus: string) => {
    if (analysisStatus === "completed") {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
    if (transcriptionStatus === "completed") {
      return <FileAudio className="h-5 w-5 text-primary" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, type: "transcription" | "analysis") => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pending: { variant: "secondary", label: type === "transcription" ? "Pendente" : "Não Analisado" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "outline", label: type === "transcription" ? "Transcrito" : "Analisado" },
      failed: { variant: "destructive", label: "Falha" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (optimizations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma otimização encontrada</h3>
          <p className="text-sm text-muted-foreground">
            As otimizações das suas contas aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {optimizations.map((optimization) => {
        const recordedDate = new Date(optimization.recorded_at);
        const formattedDate = format(recordedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

        return (
          <Card
            key={optimization.id}
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => onOptimizationClick(optimization)}
          >
            <CardContent className="p-5">
              {/* Header: Account Name + Date */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(optimization.transcription_status, optimization.analysis_status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {optimization.account_name} - {formattedDate}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate">
                        por {optimization.recorded_by}
                      </p>
                      {optimization.duration_seconds && (
                        <span className="text-xs text-muted-foreground">
                          • {formatDuration(optimization.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  {getStatusBadge(optimization.transcription_status, "transcription")}
                  {optimization.transcription_status === "completed" && (
                    getStatusBadge(optimization.analysis_status, "analysis")
                  )}
                </div>
              </div>

              {/* Extract Preview */}
              {optimization.extract_text && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Extrato:
                  </p>
                  <div className="text-sm whitespace-pre-wrap line-clamp-4">
                    {optimization.extract_text}
                  </div>
                </div>
              )}

              {!optimization.extract_text && optimization.analysis_status !== 'completed' && (
                <div className="mt-3 p-3 bg-muted/30 rounded-md border border-dashed">
                  <p className="text-xs text-muted-foreground italic">
                    Extrato será gerado após análise da gravação
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
