/**
 * OptimizationList - Week 1 MVP Component
 * 
 * Lists optimization recordings for a specific account
 * Shows audio player and processing status
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, FileAudio, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OptimizationRecordingRow, OptimizationTranscriptRow } from "@/types/optimization";

interface Account {
  notion_id: string;
  Conta: string | null;
}

export function OptimizationList() {
  const { user } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recordings, setRecordings] = useState<OptimizationRecordingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [transcribing, setTranscribing] = useState<Record<string, boolean>>({});
  const [transcripts, setTranscripts] = useState<Record<string, OptimizationTranscriptRow>>({});

  // Fetch user's accounts
  useEffect(() => {
    fetchAccounts();
  }, [user]);

  // Fetch recordings when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchRecordings();
    }
  }, [selectedAccount]);

  async function fetchAccounts() {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("j_ads_notion_db_accounts")
      .select("notion_id, Conta")
      .order("Conta", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      return;
    }

    setAccounts(data || []);
  }

  async function fetchRecordings() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("j_ads_optimization_recordings")
      .select("*")
      .eq("account_id", selectedAccount)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching recordings:", error);
      setIsLoading(false);
      return;
    }

    setRecordings((data || []) as OptimizationRecordingRow[]);

    // Generate signed URLs for audio files
    const urls: Record<string, string> = {};
    for (const recording of data || []) {
      if (recording.audio_file_path) {
        const { data: signedUrl } = await supabase.storage
          .from("optimizations")
          .createSignedUrl(recording.audio_file_path, 3600); // 1 hour

        if (signedUrl) {
          urls[recording.id] = signedUrl.signedUrl;
        }
      }
    }

    setAudioUrls(urls);

    // Fetch transcripts for completed transcriptions
    const completedRecordings = (data || []).filter(
      r => r.transcription_status === 'completed'
    );
    
    if (completedRecordings.length > 0) {
      const { data: transcriptsData } = await supabase
        .from('j_ads_optimization_transcripts')
        .select('*')
        .in('recording_id', completedRecordings.map(r => r.id));

      if (transcriptsData) {
        const transcriptsMap: Record<string, OptimizationTranscriptRow> = {};
        transcriptsData.forEach(t => {
          transcriptsMap[t.recording_id] = t;
        });
        setTranscripts(transcriptsMap);
      }
    }

    setIsLoading(false);
  }

  async function handleTranscribe(recordingId: string) {
    setTranscribing(prev => ({ ...prev, [recordingId]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('j_ads_transcribe_optimization', {
        body: { recording_id: recordingId }
      });

      if (error) throw error;

      toast.success('Transcrição concluída!');
      
      // Reload recordings to show updated status
      fetchRecordings();
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Erro ao transcrever áudio');
    } finally {
      setTranscribing(prev => ({ ...prev, [recordingId]: false }));
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "outline", label: "Concluído" },
      failed: { variant: "destructive", label: "Falha" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const selectedAccountName = accounts.find(a => a.notion_id === selectedAccount)?.Conta || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Gravações de Otimização
        </CardTitle>
        <CardDescription>
          Histórico de narrativas de otimização por conta
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && selectedAccount && recordings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma gravação encontrada para <strong>{selectedAccountName}</strong>
            </p>
          </div>
        )}

        {/* Recordings List */}
        {!isLoading && recordings.length > 0 && (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <Card key={recording.id} className="border-l-4 border-l-primary/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(recording.recorded_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">
                          Por: <span className="font-medium">{recording.recorded_by}</span>
                        </p>
                        {recording.duration_seconds && (
                          <p className="text-sm text-muted-foreground">
                            Duração: {Math.floor(recording.duration_seconds / 60)}:
                            {(recording.duration_seconds % 60).toString().padStart(2, "0")}
                          </p>
                        )}
                      </div>

                      {/* Status Badges & Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(recording.transcription_status)}
                          {recording.transcription_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTranscribe(recording.id)}
                              disabled={transcribing[recording.id]}
                            >
                              {transcribing[recording.id] ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <FileText className="mr-1 h-3 w-3" />
                                  Transcrever
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {getStatusBadge(recording.analysis_status)}
                      </div>
                    </div>

                    {/* Audio Player */}
                    {audioUrls[recording.id] && (
                      <div className="p-3 bg-muted rounded-lg">
                        <audio controls src={audioUrls[recording.id]} className="w-full" />
                      </div>
                    )}

                    {!audioUrls[recording.id] && recording.audio_file_path && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                        Carregando áudio...
                      </div>
                    )}

                    {/* Transcript Display */}
                    {recording.transcription_status === 'completed' && transcripts[recording.id] && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-primary" />
                          Transcrição
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {transcripts[recording.id].full_text}
                          </p>
                          {transcripts[recording.id].confidence_score && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Confiança: {(Number(transcripts[recording.id].confidence_score) * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
