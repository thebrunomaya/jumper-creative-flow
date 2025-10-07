/**
 * OptimizationListCompact - Compact list view of optimization recordings
 * Displays minimal info, clicking opens drawer with details
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileAudio, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OptimizationRecordingRow } from "@/types/optimization";

interface OptimizationListCompactProps {
  recordings: OptimizationRecordingRow[];
  onRecordingClick: (recording: OptimizationRecordingRow) => void;
  selectedRecordingId?: string;
}

export function OptimizationListCompact({
  recordings,
  onRecordingClick,
  selectedRecordingId,
}: OptimizationListCompactProps) {
  const getStatusIcon = (transcriptionStatus: string, analysisStatus: string) => {
    if (analysisStatus === "completed") {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (transcriptionStatus === "completed") {
      return <FileAudio className="h-4 w-4 text-primary" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getOverallStatus = (transcriptionStatus: string, analysisStatus: string) => {
    if (transcriptionStatus === 'processing' || analysisStatus === 'processing') {
      return { variant: 'default' as const, label: '🟡 Processando', color: 'text-yellow-500' };
    }
    if (transcriptionStatus === 'failed' || analysisStatus === 'failed') {
      return { variant: 'destructive' as const, label: '🔴 Falhou', color: 'text-destructive' };
    }
    if (analysisStatus === 'completed') {
      return { variant: 'outline' as const, label: '🟢 Concluído', color: 'text-success' };
    }
    return { variant: 'secondary' as const, label: '⚪ Pendente', color: 'text-muted-foreground' };
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

  if (recordings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma gravação encontrada para esta conta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {recordings.map((recording) => {
        const isSelected = selectedRecordingId === recording.id;
        return (
          <Card
            key={recording.id}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              isSelected ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => onRecordingClick(recording)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(recording.transcription_status, recording.analysis_status)}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {formatDistanceToNow(new Date(recording.recorded_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    {recording.duration_seconds && (
                      <span className="text-xs text-muted-foreground">
                        • {formatDuration(recording.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {recording.recorded_by}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  {getStatusBadge(recording.transcription_status, "transcription")}
                  {recording.transcription_status === "completed" && (
                    getStatusBadge(recording.analysis_status, "analysis")
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
