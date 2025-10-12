/**
 * OptimizationEditor - Fullscreen editor for optimization recordings
 * Replaces the drawer with a dedicated page with 3 independent sections
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { JumperBackground } from "@/components/ui/jumper-background";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizationStepCard } from "@/components/optimization/OptimizationStepCard";
import { DebugModal } from "@/components/optimization/DebugModal";
import { OptimizationContextCard } from "@/components/OptimizationContextCard";
import { AIImprovementsModal } from "@/components/optimization/AIImprovementsModal";
import { RetranscribeConfirmModal } from "@/components/optimization/RetranscribeConfirmModal";
import { AIProcessImprovementsModal } from "@/components/optimization/AIProcessImprovementsModal";
import { ReprocessConfirmModal } from "@/components/optimization/ReprocessConfirmModal";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
  rowToOptimizationContext,
} from "@/types/optimization";
import {
  ChevronDown,
  ChevronLeft,
  Mic,
  FileText,
  Brain,
  Save,
  RotateCw,
  Sparkles,
  Share2,
  Download,
  Edit,
  Loader2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { exportOptimizationToPDF } from "@/utils/pdfExport";
import { ShareOptimizationModal } from "@/components/optimization/ShareOptimizationModal";

const AI_MODELS = [
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Recomendado)" },
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4" },
] as const;

export default function OptimizationEditor() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Data states
  const [recording, setRecording] = useState<OptimizationRecordingRow | null>(null);
  const [transcript, setTranscript] = useState<OptimizationTranscriptRow | null>(null);
  const [context, setContext] = useState<OptimizationContext | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>("");

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edit states
  const [editedTranscript, setEditedTranscript] = useState("");
  const [editedProcessed, setEditedProcessed] = useState("");

  // Analysis model selection
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-5-20250929");

  // Debug modal
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugStep, setDebugStep] = useState<'transcribe' | 'process' | 'analyze' | 'improve_transcript'>('transcribe');

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // AI improvements modal
  const [aiImprovementsModalOpen, setAiImprovementsModalOpen] = useState(false);
  const [originalWhisperPrompt, setOriginalWhisperPrompt] = useState<string>("");

  // Retranscribe confirm modal
  const [retranscribeModalOpen, setRetranscribeModalOpen] = useState(false);
  const [isRetranscribing, setIsRetranscribing] = useState(false);

  // AI improvements modal for Step 2 (processed text)
  const [aiProcessImprovementsModalOpen, setAiProcessImprovementsModalOpen] = useState(false);

  // Reprocess confirm modal
  const [reprocessModalOpen, setReprocessModalOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (recordingId) {
      loadRecording();
    }
  }, [recordingId]);

  async function loadRecording() {
    if (!recordingId) return;

    setIsLoadingData(true);
    try {
      // Fetch recording
      const { data: recordingData, error: recordingError } = await supabase
        .from('j_ads_optimization_recordings')
        .select('*')
        .eq('id', recordingId)
        .single();

      if (recordingError) throw recordingError;
      setRecording(recordingData as OptimizationRecordingRow);

      // Fetch account name
      const { data: accountData } = await supabase
        .from('j_ads_notion_db_accounts')
        .select('Conta')
        .eq('notion_id', recordingData.account_id)
        .maybeSingle();

      setAccountName(accountData?.Conta || recordingData.account_id);

      // Fetch audio URL
      if (recordingData.audio_file_path) {
        const { data: signedUrl } = await supabase.storage
          .from('optimizations')
          .createSignedUrl(recordingData.audio_file_path, 3600);
        if (signedUrl) setAudioUrl(signedUrl.signedUrl);
      }

      // Fetch transcript
      const { data: transcriptData } = await supabase
        .from('j_ads_optimization_transcripts')
        .select('*')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (transcriptData) {
        setTranscript(transcriptData as OptimizationTranscriptRow);
        setEditedTranscript(transcriptData.full_text || '');
        setEditedProcessed(transcriptData.processed_text || '');
      }

      // Fetch context
      const { data: contextData } = await supabase
        .from('j_ads_optimization_context')
        .select('*')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (contextData) {
        setContext(rowToOptimizationContext(contextData));
      }

      // Fetch original Whisper prompt from transcribe log
      const { data: transcribeLog } = await supabase
        .from('j_ads_optimization_api_logs')
        .select('prompt_sent')
        .eq('recording_id', recordingId)
        .eq('step', 'transcribe')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transcribeLog?.prompt_sent) {
        setOriginalWhisperPrompt(transcribeLog.prompt_sent);
      }
    } catch (error) {
      console.error('Error loading recording:', error);
      toast.error('Erro ao carregar gravação');
    } finally {
      setIsLoadingData(false);
    }
  }

  // Step 1: Transcribe
  async function handleTranscribe(regenerate = false) {
    if (!recordingId) return;

    setIsTranscribing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_transcribe', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Transcrição regerada!' : 'Transcrição concluída!');
      await loadRecording();
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Erro ao transcrever');
    } finally {
      setIsTranscribing(false);
    }
  }

  // Step 1: Save edited transcript
  async function handleSaveTranscript() {
    if (!recordingId || !user?.id) return;

    try {
      const { error } = await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: editedTranscript,
        p_user_id: user.id,
      });

      if (error) throw error;

      toast.success('Transcrição salva!');
      await loadRecording();
    } catch (error: any) {
      console.error('Save transcript error:', error);
      toast.error('Erro ao salvar transcrição');
    }
  }

  // Step 1: Apply AI improvements
  async function handleApplyAIImprovements(improvedText: string) {
    if (!recordingId || !user?.id) return;

    try {
      const { error } = await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: improvedText,
        p_user_id: user.id,
      });

      if (error) throw error;

      setEditedTranscript(improvedText);
      await loadRecording();
    } catch (error: any) {
      console.error('Apply AI improvements error:', error);
      toast.error('Erro ao aplicar melhorias');
    }
  }

  // Step 1: Retranscribe with confirmation
  async function handleRetranscribe() {
    if (!recordingId || !user?.id) return;

    setIsRetranscribing(true);
    try {
      // Save current version as backup before retranscribing
      await supabase.rpc('save_transcript_edit', {
        p_recording_id: recordingId,
        p_new_text: editedTranscript,
        p_user_id: user.id,
      });

      // Call retranscribe action
      const { error } = await supabase.functions.invoke(
        'j_hub_optimization_improve_transcript',
        {
          body: {
            recording_id: recordingId,
            action: 'retranscribe',
          },
        }
      );

      if (error) throw error;

      toast.success('Transcrição regerada com sucesso!');
      setRetranscribeModalOpen(false);
      await loadRecording();
    } catch (error: any) {
      console.error('Retranscribe error:', error);
      toast.error('Erro ao re-gerar transcrição');
    } finally {
      setIsRetranscribing(false);
    }
  }

  // Step 1: Undo to previous version
  async function handleUndo() {
    if (!recordingId || !transcript?.previous_version) return;

    try {
      const { error } = await supabase
        .from('j_ads_optimization_transcripts')
        .update({
          full_text: transcript.previous_version,
          previous_version: null,
          edit_count: Math.max(0, (transcript.edit_count || 1) - 1),
          last_edited_at: new Date().toISOString(),
          last_edited_by: user?.id || null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Versão anterior restaurada!');
      await loadRecording();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast.error('Erro ao desfazer');
    }
  }

  // Step 2: Process transcript
  async function handleProcess(regenerate = false) {
    if (!recordingId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_process', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Bullets regenerados!' : 'Organizado em tópicos!');
      await loadRecording();
    } catch (error: any) {
      console.error('Process error:', error);
      toast.error(error.message || 'Erro ao processar');
    } finally {
      setIsProcessing(false);
    }
  }

  // Step 2: Save edited processed text (with versioning)
  async function handleSaveProcessed() {
    if (!recordingId || !user) return;

    try {
      const { error } = await supabase.rpc('save_processed_edit', {
        p_recording_id: recordingId,
        p_new_text: editedProcessed,
        p_user_id: user.id,
      });

      if (error) throw error;

      toast.success('Bullets salvos!');
      await loadRecording();
    } catch (error: any) {
      console.error('Save processed error:', error);
      toast.error('Erro ao salvar bullets');
    }
  }

  // Step 2: Apply AI improvements to processed text
  async function handleApplyProcessedImprovements(improvedText: string) {
    if (!recordingId || !user) return;

    try {
      const { error } = await supabase.rpc('save_processed_edit', {
        p_recording_id: recordingId,
        p_new_text: improvedText,
        p_user_id: user.id,
      });

      if (error) throw error;

      await loadRecording();
    } catch (error: any) {
      console.error('Apply improvements error:', error);
      throw error;
    }
  }

  // Step 2: Reprocess with IA (regenerate)
  async function handleReprocess() {
    if (!recordingId || !user) return;

    setIsReprocessing(true);
    try {
      // Save current as backup before reprocessing
      if (transcript?.processed_text) {
        await supabase.rpc('save_processed_edit', {
          p_recording_id: recordingId,
          p_new_text: transcript.processed_text,
          p_user_id: user.id,
        });
      }

      // Call process function directly (simpler than going through improve_processed)
      const { error } = await supabase.functions.invoke(
        'j_hub_optimization_process',
        {
          body: {
            recording_id: recordingId,
          },
        }
      );

      if (error) throw error;

      toast.success('Bullets reprocessados!');
      await loadRecording();
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast.error('Erro ao reprocessar: ' + error.message);
    } finally {
      setIsReprocessing(false);
    }
  }

  // Step 2: Undo processed edit (restore previous version)
  async function handleUndoProcessed() {
    if (!recordingId || !transcript?.processed_previous_version) return;

    try {
      const { error } = await supabase
        .from('j_ads_optimization_transcripts')
        .update({
          processed_text: transcript.processed_previous_version,
          processed_previous_version: null,
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success('Versão anterior restaurada!');
      await loadRecording();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast.error('Erro ao desfazer');
    }
  }

  // Step 3: Analyze
  async function handleAnalyze(regenerate = false) {
    if (!recordingId) return;

    setIsAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('j_hub_optimization_analyze', {
        body: {
          recording_id: recordingId,
          model: selectedModel,
        }
      });

      if (error) throw error;

      toast.success(regenerate ? 'Análise regenerada!' : 'Análise concluída!');
      await loadRecording();
    } catch (error: any) {
      console.error('Analyze error:', error);
      toast.error(error.message || 'Erro ao analisar');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Debug modal handlers
  function openDebug(step: 'transcribe' | 'process' | 'analyze') {
    setDebugStep(step);
    setDebugModalOpen(true);
  }

  // Export handlers
  function handleExportPDF() {
    if (!recording || !accountName) return;
    exportOptimizationToPDF(recording, accountName, transcript, context);
    toast.success('PDF gerado!');
  }

  function handleShare() {
    setShareModalOpen(true);
  }

  if (isLoadingData) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </JumperBackground>
    );
  }

  if (!recording) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center">
          <p className="text-muted-foreground mb-4">Gravação não encontrada</p>
          <JumperButton onClick={() => navigate('/optimization')}>
            Voltar para Lista
          </JumperButton>
        </div>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      {/* Breadcrumb */}
      <div className="px-8 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <JumperButton variant="ghost" size="sm" onClick={() => navigate('/optimization')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para Lista
        </JumperButton>
        <h1 className="text-2xl font-bold mt-2">
          Edição de Otimização - {accountName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gravado em {new Date(recording.recorded_at).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="px-8 py-6 max-w-6xl mx-auto space-y-6">

          {/* SEÇÃO 1: TRANSCRIÇÃO */}
          <OptimizationStepCard
            stepNumber={1}
            title="Transcrição"
            description="Áudio → Texto bruto"
            status={recording.transcription_status}
            onDebug={isAdmin ? () => openDebug('transcribe') : undefined}
          >
            {/* Audio Player */}
            {audioUrl && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            {/* Pending State */}
            {recording.transcription_status === 'pending' && (
              <div className="text-center py-8 space-y-4">
                <Mic className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Este áudio ainda não foi transcrito
                </p>
                <JumperButton onClick={() => handleTranscribe()} disabled={isTranscribing} size="lg">
                  {isTranscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Transcrever Áudio
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Completed State */}
            {recording.transcription_status === 'completed' && transcript && (
              <div className="space-y-3">
                {/* Edit count badge */}
                {transcript.edit_count > 0 && (
                  <Badge variant="secondary" className="mb-2">
                    Editado {transcript.edit_count}x
                    {transcript.last_edited_at && (
                      <span className="ml-2 text-xs opacity-70">
                        • {new Date(transcript.last_edited_at).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </Badge>
                )}

                <Textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Transcrição bruta do Whisper..."
                />

                <div className="flex flex-wrap gap-2">
                  {/* Primary actions */}
                  <JumperButton
                    variant="outline"
                    onClick={handleSaveTranscript}
                    disabled={editedTranscript === transcript.full_text}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Edição Manual
                  </JumperButton>

                  <JumperButton
                    variant="outline"
                    onClick={() => setAiImprovementsModalOpen(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ajustar com IA
                  </JumperButton>

                  <JumperButton
                    variant="outline"
                    onClick={() => setRetranscribeModalOpen(true)}
                    disabled={isRetranscribing}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Re-gerar
                  </JumperButton>

                  {/* Undo button (only if previous version exists) */}
                  {transcript.previous_version && (
                    <JumperButton
                      variant="ghost"
                      onClick={handleUndo}
                      title="Restaurar versão anterior"
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Desfazer
                    </JumperButton>
                  )}
                </div>
              </div>
            )}
          </OptimizationStepCard>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <ChevronDown className="h-8 w-8 text-muted-foreground animate-bounce" />
          </div>

          {/* SEÇÃO 2: PROCESSAMENTO */}
          <OptimizationStepCard
            stepNumber={2}
            title="Organização em Tópicos"
            description="Texto → Bullets estruturados"
            status={recording.processing_status}
            onDebug={isAdmin ? () => openDebug('process') : undefined}
          >
            {/* Pending State */}
            {recording.processing_status === 'pending' && (
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Transcrição bruta pronta. Organize em tópicos para facilitar a análise.
                </p>
                <JumperButton
                  onClick={() => handleProcess()}
                  disabled={isProcessing || !transcript?.full_text}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Organizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Organizar em Tópicos
                    </>
                  )}
                </JumperButton>
              </div>
            )}

            {/* Completed State */}
            {recording.processing_status === 'completed' && transcript?.processed_text && (
              <div className="space-y-3">
                {/* Edit count badge */}
                {transcript.processed_edit_count > 0 && (
                  <Badge variant="secondary" className="mb-2">
                    Editado {transcript.processed_edit_count}x
                    {transcript.processed_last_edited_at && (
                      <span className="ml-2 text-xs opacity-70">
                        • {new Date(transcript.processed_last_edited_at).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </Badge>
                )}

                <Textarea
                  value={editedProcessed}
                  onChange={(e) => setEditedProcessed(e.target.value)}
                  className="min-h-[400px] text-sm"
                  placeholder="Bullets organizados..."
                />

                <div className="flex flex-wrap gap-2">
                  {/* Primary actions */}
                  <JumperButton
                    variant="outline"
                    onClick={handleSaveProcessed}
                    disabled={editedProcessed === transcript.processed_text}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Edição Manual
                  </JumperButton>

                  <JumperButton
                    variant="outline"
                    onClick={() => setAiProcessImprovementsModalOpen(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ajustar com IA
                  </JumperButton>

                  <JumperButton
                    variant="outline"
                    onClick={() => setReprocessModalOpen(true)}
                    disabled={isReprocessing}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Reprocessar
                  </JumperButton>

                  {/* Undo button (only if previous version exists) */}
                  {transcript.processed_previous_version && (
                    <JumperButton
                      variant="ghost"
                      onClick={handleUndoProcessed}
                      title="Restaurar versão anterior"
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Desfazer
                    </JumperButton>
                  )}
                </div>
              </div>
            )}
          </OptimizationStepCard>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <ChevronDown className="h-8 w-8 text-muted-foreground animate-bounce" />
          </div>

          {/* SEÇÃO 3: ANÁLISE */}
          <OptimizationStepCard
            stepNumber={3}
            title="Análise Estruturada"
            description="Bullets → Relatório JSON"
            status={recording.analysis_status}
            onDebug={isAdmin ? () => openDebug('analyze') : undefined}
          >
            {/* Pending State */}
            {recording.analysis_status === 'pending' && (
              <div className="text-center py-8 space-y-4">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Bullets organizados. Gere o extrato estruturado final.
                </p>
                <div className="max-w-xs mx-auto space-y-3">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <JumperButton
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing || !transcript?.processed_text}
                    size="lg"
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Analisar com IA
                      </>
                    )}
                  </JumperButton>
                </div>
              </div>
            )}

            {/* Completed State */}
            {recording.analysis_status === 'completed' && context && (
              <div className="space-y-4">
                <OptimizationContextCard context={context} />
                <div className="flex gap-2 flex-wrap">
                  <JumperButton variant="ghost" onClick={() => handleAnalyze(true)} disabled={isAnalyzing}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Regenerar
                  </JumperButton>
                  <JumperButton variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </JumperButton>
                  <JumperButton variant="outline" onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </JumperButton>
                </div>
              </div>
            )}
          </OptimizationStepCard>

        </div>
      </ScrollArea>

      {/* Modals */}
      <DebugModal
        open={debugModalOpen}
        onOpenChange={setDebugModalOpen}
        recordingId={recordingId!}
        step={debugStep}
      />

      <ShareOptimizationModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        recordingId={recordingId!}
        accountName={accountName}
        recordedAt={recording.recorded_at}
      />

      <AIImprovementsModal
        isOpen={aiImprovementsModalOpen}
        onClose={() => setAiImprovementsModalOpen(false)}
        recordingId={recordingId!}
        currentText={editedTranscript}
        whisperPrompt={originalWhisperPrompt}
        onApply={handleApplyAIImprovements}
        isAdmin={isAdmin}
        onDebug={() => {
          openDebug('improve_transcript');
        }}
      />

      <RetranscribeConfirmModal
        isOpen={retranscribeModalOpen}
        onClose={() => setRetranscribeModalOpen(false)}
        onConfirm={handleRetranscribe}
        isLoading={isRetranscribing}
      />

      <AIProcessImprovementsModal
        isOpen={aiProcessImprovementsModalOpen}
        onClose={() => setAiProcessImprovementsModalOpen(false)}
        recordingId={recordingId!}
        currentText={editedProcessed}
        onApply={handleApplyProcessedImprovements}
        isAdmin={isAdmin}
        onDebug={() => {
          openDebug('improve_processed');
        }}
      />

      <ReprocessConfirmModal
        isOpen={reprocessModalOpen}
        onClose={() => setReprocessModalOpen(false)}
        onConfirm={handleReprocess}
        isProcessing={isReprocessing}
      />
    </JumperBackground>
  );
}
