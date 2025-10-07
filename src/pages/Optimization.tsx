/**
 * Optimization Page - Enhanced Layout
 * Full-width list with drawer for details
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OptimizationRecorder } from "@/components/OptimizationRecorder";
import { AccountSelector } from "@/components/optimization/AccountSelector";
import { OptimizationEmptyState } from "@/components/optimization/OptimizationEmptyState";
import { OptimizationStats } from "@/components/optimization/OptimizationStats";
import { OptimizationListCompact } from "@/components/optimization/OptimizationListCompact";
import { OptimizationDrawer } from "@/components/optimization/OptimizationDrawer";
import { JumperBackground } from "@/components/ui/jumper-background";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
  rowToOptimizationContext,
} from "@/types/optimization";

export default function Optimization() {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [accountContext, setAccountContext] = useState<string>("");
  const [notionObjectives, setNotionObjectives] = useState<string[]>([]);
  const [availableObjectives, setAvailableObjectives] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, transcribed: 0, analyzed: 0 });
  
  // Recordings list
  const [recordings, setRecordings] = useState<OptimizationRecordingRow[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<OptimizationRecordingRow | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<OptimizationTranscriptRow | null>(null);
  const [context, setContext] = useState<OptimizationContext | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch account data (name, context, objectives)
  useEffect(() => {
    if (selectedAccount) {
      supabase
        .from("j_ads_notion_db_accounts")
        .select("Conta, \"Contexto para Otimização\", Objetivos")
        .eq("notion_id", selectedAccount)
        .single()
        .then(({ data }) => {
          if (data) {
            setAccountName(data.Conta || selectedAccount);
            setAccountContext(data["Contexto para Otimização"] || "");
            
            // Parse objectives from comma-separated string
            const objectives = data.Objetivos 
              ? data.Objetivos.split(',').map((o: string) => o.trim())
              : [];
            setNotionObjectives(objectives);
          }
        });
    }
  }, [selectedAccount]);

  // Fetch all unique objectives for checkboxes
  useEffect(() => {
    supabase
      .from("j_ads_notion_db_accounts")
      .select("Objetivos")
      .then(({ data }) => {
        if (data) {
          const allObjectives = new Set<string>();
          data.forEach((row: any) => {
            if (row.Objetivos) {
              row.Objetivos.split(',').forEach((obj: string) => {
                const trimmed = obj.trim();
                if (trimmed) allObjectives.add(trimmed);
              });
            }
          });
          setAvailableObjectives(Array.from(allObjectives).sort());
        }
      });
  }, []);

  // Fetch recordings when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchRecordings();
      fetchStats();
    } else {
      setRecordings([]);
    }
  }, [selectedAccount]);

  async function fetchStats() {
    const { data } = await supabase
      .from("j_ads_optimization_recordings")
      .select("transcription_status, analysis_status")
      .eq("account_id", selectedAccount);

    if (data) {
      const total = data.length;
      const pending = data.filter((r) => r.transcription_status === "pending").length;
      const transcribed = data.filter((r) => r.transcription_status === "completed").length;
      const analyzed = data.filter((r) => r.analysis_status === "completed").length;

      setStats({ total, pending, transcribed, analyzed });
    }
  }

  async function fetchRecordings() {
    setIsLoadingRecordings(true);

    const { data, error } = await supabase
      .from("j_ads_optimization_recordings")
      .select("*")
      .eq("account_id", selectedAccount)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching recordings:", error);
      setIsLoadingRecordings(false);
      return;
    }

    setRecordings((data || []) as OptimizationRecordingRow[]);
    setIsLoadingRecordings(false);
  }

  async function handleRecordingClick(recording: OptimizationRecordingRow) {
    setSelectedRecording(recording);
    setDrawerOpen(true);
    loadRecordingDetails(recording);
  }

  async function loadRecordingDetails(recording: OptimizationRecordingRow) {
    // Reset states
    setTranscript(null);
    setContext(null);
    setAudioUrl(null);

    // Load audio URL
    if (recording.audio_file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("optimizations")
        .createSignedUrl(recording.audio_file_path, 3600);

      if (signedUrl) {
        setAudioUrl(signedUrl.signedUrl);
      }
    }

    // Always try to load transcript (might exist even if status is not updated)
    const { data: transcriptData } = await supabase
      .from("j_ads_optimization_transcripts")
      .select("*")
      .eq("recording_id", recording.id)
      .maybeSingle();

    if (transcriptData) {
      setTranscript(transcriptData as OptimizationTranscriptRow);
    }

    // Always try to load context (might exist even if status is not updated)
    const { data: contextData } = await supabase
      .from("j_ads_optimization_context")
      .select("*")
      .eq("recording_id", recording.id)
      .maybeSingle();

    if (contextData) {
      setContext(rowToOptimizationContext(contextData));
    }
  }

  async function handleTranscribe() {
    if (!selectedRecording) return;
    
    setIsTranscribing(true);

    try {
      const { error } = await supabase.functions.invoke("j_ads_transcribe_optimization", {
        body: { recording_id: selectedRecording.id },
      });

      if (error) throw error;

      toast.success("Transcrição concluída!");
      
      // Refresh data
      await fetchRecordings();
      await handleRecordingClick(selectedRecording);
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Erro ao transcrever áudio");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function handleAnalyze() {
    if (!selectedRecording) return;
    
    setIsAnalyzing(true);

    try {
      const { error } = await supabase.functions.invoke("j_ads_analyze_optimization", {
        body: { recording_id: selectedRecording.id },
      });

      if (error) throw error;

      toast.success("Análise com IA concluída!");
      
      // Refresh data
      await fetchRecordings();
      await handleRecordingClick(selectedRecording);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Erro ao analisar transcrição");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleUploadComplete = () => {
    fetchRecordings();
    fetchStats();
  };

  return (
    <JumperBackground overlay={false}>
      <Header />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header - Full Width */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Otimização</h1>
            <p className="text-muted-foreground mt-1">
              Documente suas otimizações de tráfego com gravações de áudio e análise com IA
            </p>
          </div>

          {/* Account Selector */}
          <div className="max-w-md">
            <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
          </div>

          {/* Stats Cards - Full Width Grid */}
          {selectedAccount && (
            <OptimizationStats
              total={stats.total}
              pending={stats.pending}
              transcribed={stats.transcribed}
              analyzed={stats.analyzed}
            />
          )}
        </div>

        {/* Main Content - Full Width */}
        {!selectedAccount ? (
          <OptimizationEmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recorder - Fixed on left */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <OptimizationRecorder
                  accountId={selectedAccount}
                  accountName={accountName}
                  accountContext={accountContext}
                  notionObjectives={notionObjectives}
                  availableObjectives={availableObjectives}
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            </div>

            {/* Recordings List - Takes remaining space */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gravações Recentes</h2>
                {isLoadingRecordings && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>

              <OptimizationListCompact
                recordings={recordings}
                onRecordingClick={handleRecordingClick}
                selectedRecordingId={selectedRecording?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer for recording details */}
      <OptimizationDrawer
        recording={selectedRecording}
        audioUrl={audioUrl}
        transcript={transcript}
        context={context}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onTranscribe={handleTranscribe}
        onAnalyze={handleAnalyze}
        onRefresh={() => selectedRecording && loadRecordingDetails(selectedRecording)}
        isTranscribing={isTranscribing}
        isAnalyzing={isAnalyzing}
        accountName={accountName}
      />
    </JumperBackground>
  );
}

