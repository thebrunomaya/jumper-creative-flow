/**
 * OptimizationDrawer - Detailed view of a single optimization recording
 * Opens as a side drawer with full details
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Clock,
  FileText,
  Brain,
  Copy,
  Trash2,
  CheckCircle2,
  User,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
} from "@/types/optimization";
import { OptimizationContextCard } from "@/components/OptimizationContextCard";
import { exportOptimizationToPDF } from "@/utils/pdfExport";
import { TranscriptionCorrectionCard } from "./TranscriptionCorrectionCard";
import { AnalysisRegenerationCard } from "./AnalysisRegenerationCard";

interface OptimizationDrawerProps {
  recording: OptimizationRecordingRow | null;
  audioUrl: string | null;
  transcript: OptimizationTranscriptRow | null;
  context: OptimizationContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscribe: () => void;
  onAnalyze: () => void;
  onRefresh: () => void;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  accountName?: string;
}

export function OptimizationDrawer({
  recording,
  audioUrl,
  transcript,
  context,
  open,
  onOpenChange,
  onTranscribe,
  onAnalyze,
  onRefresh,
  isTranscribing,
  isAnalyzing,
  accountName = "Conta",
}: OptimizationDrawerProps) {
  if (!recording) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pending: { variant: "secondary", label: "Pendente" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "outline", label: "Concluído" },
      failed: { variant: "destructive", label: "Falha" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCopyTranscript = () => {
    if (transcript?.full_text) {
      navigator.clipboard.writeText(transcript.full_text);
      toast.success("Transcrição copiada!");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExportPDF = () => {
    exportOptimizationToPDF(recording, accountName, transcript, context);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">Detalhes da Gravação</SheetTitle>
              <SheetDescription>
                {format(new Date(recording.recorded_at), "PPP 'às' HH:mm", { locale: ptBR })}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(recording.transcription_status)}
              {getStatusBadge(recording.analysis_status)}
            </div>
          </div>

          {/* Export PDF Button */}
          {transcript && (
            <div className="pt-4">
              <JumperButton
                onClick={handleExportPDF}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Relatório em PDF
              </JumperButton>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            {/* Recording Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Gravado por: <strong className="text-foreground">{recording.recorded_by}</strong></span>
              </div>
              {recording.duration_seconds && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duração: <strong className="text-foreground">{formatDuration(recording.duration_seconds)}</strong></span>
                </div>
              )}
            </div>

            <Separator />

            {/* Audio Player */}
            {audioUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Gravação de Áudio
                </h3>
                <div className="p-4 bg-muted rounded-lg border">
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              </div>
            )}

            {!audioUrl && recording.audio_file_path && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Carregando áudio...
              </div>
            )}

            <Separator />

            {/* Transcription Section */}
            {recording.transcription_status === "pending" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Transcrição
                </h3>
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta gravação ainda não foi transcrita
                  </p>
                  <JumperButton
                    onClick={onTranscribe}
                    disabled={isTranscribing}
                    variant="primary"
                    size="sm"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Transcrever Agora
                      </>
                    )}
                  </JumperButton>
                </div>
              </div>
            )}

            {recording.transcription_status === "completed" && transcript && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Transcrição Completa
                  </h3>
                  <JumperButton
                    onClick={handleCopyTranscript}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </JumperButton>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border max-h-96 overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {transcript.full_text}
                  </p>
                  {transcript.confidence_score && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Confiança: {(Number(transcript.confidence_score) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Transcription Correction Card */}
                <TranscriptionCorrectionCard
                  transcription={transcript.full_text}
                  recordingId={recording.id}
                  onRegenerateSuccess={onRefresh}
                />

                {/* Analyze Button */}
                {recording.analysis_status === "pending" && (
                  <JumperButton
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    variant="primary"
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Analisar com IA
                      </>
                    )}
                  </JumperButton>
                )}
              </div>
            )}

            {/* AI Analysis Section */}
            {recording.analysis_status === "completed" && context && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Análise com IA
                  </h3>
                  <OptimizationContextCard context={context} />
                  
                  {/* Analysis Regeneration Card */}
                  <AnalysisRegenerationCard
                    recordingId={recording.id}
                    onRegenerateSuccess={onRefresh}
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
