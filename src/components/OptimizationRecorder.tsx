/**
 * OptimizationRecorder - Week 1 MVP Component
 * 
 * Allows managers to record optimization audio narrations for Meta Ads accounts
 * Uses react-media-recorder for audio capture
 * Uploads to Supabase Storage in /optimizations/{account_id}/{timestamp}.webm
 */

import { useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { JumperButton } from "@/components/ui/jumper-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OptimizationRecorderProps {
  accountId: string;
  accountName: string;
  onUploadComplete?: () => void;
}

export function OptimizationRecorder({ accountId, accountName, onUploadComplete }: OptimizationRecorderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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

  async function handleUpload() {
    if (!mediaBlobUrl || !accountId || !user?.email) {
      toast.error("Selecione uma conta e grave um áudio primeiro");
      return;
    }

    setIsUploading(true);

    try {
      // Fetch the blob from the URL
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${accountId}/${timestamp}.webm`;
      const filePath = `optimizations/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("optimizations")
        .upload(filePath, blob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert metadata into database
      const { error: dbError } = await supabase
        .from("j_ads_optimization_recordings")
        .insert({
          account_id: accountId,
          recorded_by: user.email,
          audio_file_path: filePath,
          duration_seconds: recordingDuration,
          transcription_status: "pending",
          analysis_status: "pending",
        });

      if (dbError) {
        // Rollback: delete uploaded file
        await supabase.storage.from("optimizations").remove([filePath]);
        throw dbError;
      }

      toast.success("Gravação enviada com sucesso!");
      
      // Reset state
      clearBlobUrl();
      setRecordingDuration(0);
      
      // Notify parent
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
        {/* Recording Controls */}
        <div className="space-y-4">
          {status === "idle" && (
            <div className="flex justify-center py-8">
              <button
                onClick={startRecording}
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
              {/* Recording indicator with animated timer */}
              <div className="flex flex-col items-center justify-center py-8 gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                        <Mic className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  {/* Pulse rings */}
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

              {/* Audio Preview */}
              <div className="p-4 border rounded-lg">
                <audio controls src={mediaBlobUrl} className="w-full" />
              </div>

              {/* Action Buttons */}
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

        {/* Permission Alert */}
        {status === "acquiring_media" && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Aguardando permissão do microfone...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
