/**
 * OptimizationRecorder - Enhanced with Context & Objectives
 * 
 * Allows managers to record optimization audio narrations with:
 * - Account context (editable for this recording only)
 * - Platform selection (Meta/Google)
 * - Objective selection with custom prompts
 */

import { useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { JumperButton } from "@/components/ui/jumper-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Mic, Square, Upload, Loader2, AlertCircle, ChevronDown, Edit } from "lucide-react";
import { toast } from "sonner";
import { ContextEditor } from "./optimization/ContextEditor";
import { PromptEditorModal } from "./optimization/PromptEditorModal";
import { PlatformSelector } from "./optimization/PlatformSelector";
import { ObjectiveCheckboxes } from "./optimization/ObjectiveCheckboxes";

interface OptimizationRecorderProps {
  accountId: string;
  accountName: string;
  accountContext?: string;
  notionObjectives?: string[];
  availableObjectives?: string[];
  onUploadComplete?: () => void;
}

export function OptimizationRecorder({ 
  accountId, 
  accountName, 
  accountContext = '',
  notionObjectives = [],
  availableObjectives = [],
  onUploadComplete 
}: OptimizationRecorderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Context & Optimization state
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [editedContext, setEditedContext] = useState(accountContext);
  const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(notionObjectives);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    objective?: string;
  }>({ isOpen: false });

  // Update edited context when account changes
  useEffect(() => {
    setEditedContext(accountContext);
    setSelectedObjectives(notionObjectives);
  }, [accountId, accountContext, notionObjectives]);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    askPermissionOnMount: false,
  });

  // Track recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "recording") {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const canStartRecording = () => {
    if (!accountId) {
      toast.error("Selecione uma conta");
      return false;
    }
    if (selectedObjectives.length === 0) {
      toast.error("Selecione pelo menos um objetivo");
      return false;
    }
    return true;
  };

  const handleStartRecording = () => {
    if (canStartRecording()) {
      startRecording();
    }
  };

  async function handleUpload() {
    if (!mediaBlobUrl || !accountId || !user?.email) {
      toast.error("Selecione uma conta e grave um áudio primeiro");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${accountId}/${timestamp}.webm`;
      const filePath = `optimizations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("optimizations")
        .upload(filePath, blob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert with new fields
      const { error: dbError } = await supabase
        .from("j_ads_optimization_recordings")
        .insert({
          account_id: accountId,
          recorded_by: user.email,
          audio_file_path: filePath,
          duration_seconds: recordingDuration,
          transcription_status: "pending",
          analysis_status: "pending",
          override_context: editedContext !== accountContext ? editedContext : null,
          platform,
          selected_objectives: selectedObjectives,
        });

      if (dbError) {
        await supabase.storage.from("optimizations").remove([filePath]);
        throw dbError;
      }

      toast.success("Gravação enviada com sucesso!");
      
      clearBlobUrl();
      setRecordingDuration(0);
      setEditedContext(accountContext); // Reset to original
      
      onUploadComplete?.();

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Erro ao enviar gravação");
    } finally {
      setIsUploading(false);
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Nova Gravação de Otimização
        </CardTitle>
        <CardDescription>
          Conta: <strong>{accountName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Account Context (Collapsible) */}
        <Collapsible open={isContextOpen} onOpenChange={setIsContextOpen}>
          <div className="border rounded-lg">
            <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-medium">📝 Contexto da Conta</span>
                {editedContext !== accountContext && (
                  <span className="text-xs text-primary">(Editado)</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                <div className="bg-muted/50 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                  {editedContext || 'Nenhum contexto disponível'}
                </div>
                <JumperButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsContextEditorOpen(true)}
                  className="w-full"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Editar Contexto (Apenas para esta gravação)
                </JumperButton>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 2: Optimization Context */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">🎯 Contexto da Otimização</h3>
          
          <PlatformSelector
            value={platform}
            onChange={setPlatform}
            onEditPrompt={() => setPromptModalState({ isOpen: true })}
          />

          <ObjectiveCheckboxes
            availableObjectives={availableObjectives}
            selectedObjectives={selectedObjectives}
            notionObjectives={notionObjectives}
            onChange={setSelectedObjectives}
            onEditPrompt={(objective) => setPromptModalState({ isOpen: true, objective })}
          />
        </div>

        {/* Recording Controls */}
        <div className="space-y-4">
          {status === "idle" && (
            <div className="flex justify-center py-8">
              <button
                onClick={handleStartRecording}
                className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Iniciar gravação"
              >
                <Mic className="h-10 w-10 text-white" />
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-75" />
              </button>
            </div>
          )}

          {status === "recording" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                        <Mic className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-destructive/30 animate-ping" />
                </div>
                
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold tabular-nums">
                    {formatDuration(recordingDuration)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Gravando...</p>
                </div>
              </div>

              <JumperButton
                onClick={stopRecording}
                variant="critical"
                className="w-full"
                size="lg"
              >
                <Square className="mr-2 h-4 w-4 fill-current" />
                Parar Gravação
              </JumperButton>
            </div>
          )}

          {status === "stopped" && mediaBlobUrl && (
            <div className="space-y-4">
              <Alert className="border-success/50 bg-success/5">
                <AlertCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  ✓ Gravação concluída: {formatDuration(recordingDuration)}
                </AlertDescription>
              </Alert>

              <div className="p-4 border rounded-lg">
                <audio controls src={mediaBlobUrl} className="w-full" />
              </div>

              <div className="flex gap-3">
                <JumperButton
                  onClick={handleUpload}
                  disabled={isUploading}
                  variant="primary"
                  className="flex-1"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Gravação
                    </>
                  )}
                </JumperButton>

                <JumperButton
                  onClick={() => {
                    clearBlobUrl();
                    setRecordingDuration(0);
                  }}
                  variant="ghost"
                  disabled={isUploading}
                  size="lg"
                >
                  Cancelar
                </JumperButton>
              </div>
            </div>
          )}
        </div>

        {status === "acquiring_media" && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Aguardando permissão do microfone...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Modals */}
      <ContextEditor
        isOpen={isContextEditorOpen}
        onClose={() => setIsContextEditorOpen(false)}
        originalContext={accountContext}
        currentContext={editedContext}
        onSave={setEditedContext}
      />

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState({ isOpen: false })}
        platform={platform}
        objective={promptModalState.objective || selectedObjectives[0] || 'Vendas'}
        accountName={accountName}
        accountContext={editedContext}
      />
    </Card>
  );
}
