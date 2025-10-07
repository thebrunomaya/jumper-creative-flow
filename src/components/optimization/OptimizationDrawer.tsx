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
  CheckCircle2,
  User,
  Download,
  Edit,
  RotateCw,
  Sparkles,
  Trash2,
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
import { generateAnalysisMarkdown } from "@/utils/markdownExport";
import { TranscriptionEditorModal } from "./TranscriptionEditorModal";
import { UnifiedOptimizationEditorModal } from "./UnifiedOptimizationEditorModal";
import { MarkdownPreviewModal } from "./MarkdownPreviewModal";

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
  onDelete?: () => void;
}

// Extracted Transcription Section Component
function TranscriptionSection({
  transcript,
  recordingId,
  onCopy,
  onRefresh,
  analysisStatus,
  onAnalyze,
  isAnalyzing,
}: {
  transcript: OptimizationTranscriptRow;
  recordingId: string;
  onCopy: () => void;
  onRefresh: () => void;
  analysisStatus: string;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Transcrição Completa
            </h3>
            {transcript.revised_at ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                ✏️ Revisado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Original IA
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <JumperButton
              onClick={() => setEditorOpen(true)}
              variant="ghost"
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </JumperButton>
            <JumperButton
              onClick={onCopy}
              variant="ghost"
              size="sm"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </JumperButton>
          </div>
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

        {/* Analyze Button */}
        {analysisStatus === "pending" && (
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

      <TranscriptionEditorModal
        recordingId={recordingId}
        initialText={transcript.full_text}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={onRefresh}
      />
    </>
  );
}

// Extracted Analysis Section Component
function AnalysisSection({
  context,
  recordingId,
  accountName,
  recordedBy,
  recordedAt,
  durationSeconds,
  onRefresh,
  onExportPDF,
}: {
  context: OptimizationContext;
  recordingId: string;
  accountName: string;
  recordedBy: string;
  recordedAt: Date;
  durationSeconds?: number;
  onRefresh: () => void;
  onExportPDF: () => void;
}) {
  const [unifiedEditorOpen, setUnifiedEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [markdown, setMarkdown] = useState("");

  // Check if analysis was revised
  const wasRevised = context.confidence_level === "revised" || !!(context as any).revised_at;

  const handleCopyAnalysis = () => {
    const md = generateAnalysisMarkdown(
      context,
      accountName,
      recordedBy,
      recordedAt,
      durationSeconds
    );
    setMarkdown(md);
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Extrato de Otimização
              </h3>
              {wasRevised ? (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  ✏️ Revisado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {context.confidence_level === 'high' && 'Alta confiança'}
                  {context.confidence_level === 'medium' && 'Média confiança'}
                  {context.confidence_level === 'low' && 'Baixa confiança'}
                  {!context.confidence_level && 'Média confiança'}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <JumperButton
                onClick={() => setUnifiedEditorOpen(true)}
                variant="ghost"
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </JumperButton>
              <JumperButton
                onClick={handleCopyAnalysis}
                variant="ghost"
                size="sm"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </JumperButton>
              <JumperButton
                onClick={onExportPDF}
                variant="ghost"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </JumperButton>
            </div>
          </div>
          {wasRevised && (context as any).revised_at && (
            <p className="text-xs text-muted-foreground">
              Extrato revisado em {new Date((context as any).revised_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <OptimizationContextCard context={context} />
      </div>

      <UnifiedOptimizationEditorModal
        isOpen={unifiedEditorOpen}
        onClose={() => setUnifiedEditorOpen(false)}
        context={context}
        recordingId={recordingId}
        onSaveSuccess={onRefresh}
      />

      <MarkdownPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        markdown={markdown}
        title="Preview do Extrato de Otimização"
      />
    </>
  );
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
  onDelete,
}: OptimizationDrawerProps) {
  if (!recording) return null;

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja apagar esta gravação? Esta ação não pode ser desfeita.'
    );

    if (!confirmDelete) return;

    try {
      // Delete audio file from storage if it exists
      if (recording.audio_file_path) {
        const { error: storageError } = await supabase.storage
          .from('optimizations')
          .remove([recording.audio_file_path]);
        
        if (storageError) {
          console.error('Error deleting audio file:', storageError);
          // Continue with deletion even if storage fails
        }
      }

      // Delete recording (cascade will delete context and transcript)
      const { error: deleteError } = await supabase
        .from('j_ads_optimization_recordings')
        .delete()
        .eq('id', recording.id);

      if (deleteError) throw deleteError;

      toast.success('Gravação apagada com sucesso!');
      
      // Close drawer
      onOpenChange(false);
      
      // Refresh recordings list
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao apagar gravação');
    }
  };

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
      <SheetContent className="w-full sm:max-w-[50vw] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3">
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
          
          <div className="flex justify-start pt-2">
            <JumperButton
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar Gravação
            </JumperButton>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            {/* Recording Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Gravado por: <strong className="text-foreground">{recording.recorded_by}</strong></span>
              </div>
              {recording.duration_seconds != null && recording.duration_seconds > 0 && (
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
              <TranscriptionSection
                transcript={transcript}
                recordingId={recording.id}
                onCopy={handleCopyTranscript}
                onRefresh={onRefresh}
                analysisStatus={recording.analysis_status}
                onAnalyze={onAnalyze}
                isAnalyzing={isAnalyzing}
              />
            )}

            {recording.transcription_status === "completed" && !transcript && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-destructive" />
                  Transcrição - Erro de Consistência
                </h3>
                <div className="p-6 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive mb-4">
                    ⚠️ O status indica "concluído" mas a transcrição não foi encontrada no banco de dados. 
                    Isso pode indicar um problema de sincronização.
                  </p>
                  <JumperButton
                    onClick={onTranscribe}
                    disabled={isTranscribing}
                    variant="critical"
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
                        Tentar Transcrever Novamente
                      </>
                    )}
                  </JumperButton>
                </div>
              </div>
            )}

            {/* AI Analysis Section */}
            {recording.analysis_status === "completed" && context && (
              <>
                <Separator />
                <AnalysisSection
                  context={context}
                  recordingId={recording.id}
                  accountName={accountName}
                  recordedBy={recording.recorded_by}
                  recordedAt={new Date(recording.recorded_at)}
                  durationSeconds={recording.duration_seconds}
                  onRefresh={onRefresh}
                  onExportPDF={handleExportPDF}
                />
              </>
            )}

            {recording.analysis_status === "completed" && !context && transcript && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-destructive" />
                    Análise com IA - Erro de Consistência
                  </h3>
                  <div className="p-6 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                    <p className="text-sm text-destructive mb-4">
                      ⚠️ O status indica "concluído" mas o contexto de análise não foi encontrado no banco de dados. 
                      Isso pode indicar um problema de sincronização.
                    </p>
                    <JumperButton
                      onClick={onAnalyze}
                      disabled={isAnalyzing}
                      variant="critical"
                      size="sm"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Tentar Analisar Novamente
                        </>
                      )}
                    </JumperButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
