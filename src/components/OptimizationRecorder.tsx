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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, Play, Pause, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Account {
  notion_id: string;
  Conta: string | null;
}

export function OptimizationRecorder() {
  const { user } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
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

  // Fetch user's accounts
  useEffect(() => {
    fetchAccounts();
  }, [user]);

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

  async function fetchAccounts() {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("j_ads_notion_db_accounts")
      .select("notion_id, Conta")
      .order("Conta", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Erro ao carregar contas");
      return;
    }

    setAccounts(data || []);
  }

  async function handleUpload() {
    if (!mediaBlobUrl || !selectedAccount || !user?.email) {
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
      const fileName = `${selectedAccount}/${timestamp}.webm`;
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
          account_id: selectedAccount,
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
      setSelectedAccount("");
      setRecordingDuration(0);

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

  const selectedAccountName = accounts.find(a => a.notion_id === selectedAccount)?.Conta || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Gravar Otimização
        </CardTitle>
        <CardDescription>
          Narre suas otimizações de tráfego para documentar estratégias e decisões
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Account Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Conta</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta..." />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.notion_id} value={account.notion_id}>
                  {account.Conta || account.notion_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recording Controls */}
        <div className="space-y-4">
          {status === "idle" && (
            <Button
              onClick={startRecording}
              disabled={!selectedAccount}
              className="w-full"
              size="lg"
            >
              <Mic className="mr-2 h-4 w-4" />
              Iniciar Gravação
            </Button>
          )}

          {status === "recording" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="font-mono text-lg font-semibold">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              </div>

              <Button
                onClick={stopRecording}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Square className="mr-2 h-4 w-4" />
                Parar Gravação
              </Button>
            </div>
          )}

          {status === "stopped" && mediaBlobUrl && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Gravação concluída: {formatDuration(recordingDuration)}
                  <br />
                  Conta: <strong>{selectedAccountName}</strong>
                </AlertDescription>
              </Alert>

              {/* Audio Preview */}
              <div className="p-4 border rounded-lg">
                <audio controls src={mediaBlobUrl} className="w-full" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
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
                </Button>

                <Button
                  onClick={() => {
                    clearBlobUrl();
                    setRecordingDuration(0);
                  }}
                  variant="outline"
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
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
