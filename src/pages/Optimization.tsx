/**
 * Optimization Page - Enhanced Layout
 * Full-width list with drawer for details
 */

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OptimizationRecorder } from "@/components/OptimizationRecorder";
import { AccountSelector } from "@/components/optimization/AccountSelector";
import { OptimizationEmptyState } from "@/components/optimization/OptimizationEmptyState";
import { OptimizationStats } from "@/components/optimization/OptimizationStats";
import { OptimizationListCompact } from "@/components/optimization/OptimizationListCompact";
import { OptimizationDrawer } from "@/components/optimization/OptimizationDrawer";
import { OptimizationFilters, FilterStatus, SortBy } from "@/components/optimization/OptimizationFilters";
import { RecorderSkeleton, RecordingsListSkeleton, StatsSkeleton } from "@/components/optimization/OptimizationSkeleton";
import { JumperBackground } from "@/components/ui/jumper-background";
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
  const [stats, setStats] = useState({ total: 0, pending: 0, transcribed: 0, analyzed: 0 });
  
  // Filter and sort state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  
  // Recordings list
  const [recordings, setRecordings] = useState<OptimizationRecordingRow[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<OptimizationRecordingRow | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<OptimizationTranscriptRow | null>(null);
  const [context, setContext] = useState<OptimizationContext | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch account name
  useEffect(() => {
    if (selectedAccount) {
      supabase
        .from("j_ads_notion_db_accounts")
        .select("Conta")
        .eq("notion_id", selectedAccount)
        .single()
        .then(({ data }) => {
          if (data) setAccountName(data.Conta || selectedAccount);
        });
    }
  }, [selectedAccount]);

  // Fetch recordings when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchRecordings();
      fetchStats();
    } else {
      setRecordings([]);
    }
  }, [selectedAccount]);

  // Filter and sort recordings
  const filteredAndSortedRecordings = useMemo(() => {
    let filtered = [...recordings];

    // Apply filter
    switch (filterStatus) {
      case "pending":
        filtered = filtered.filter((r) => r.transcription_status === "pending");
        break;
      case "transcribed":
        filtered = filtered.filter((r) => r.transcription_status === "completed");
        break;
      case "analyzed":
        filtered = filtered.filter((r) => r.analysis_status === "completed");
        break;
      default:
        break;
    }

    // Apply sort
    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
        break;
      case "duration":
        filtered.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
        break;
    }

    return filtered;
  }, [recordings, filterStatus, sortBy]);

  async function fetchStats() {
    setIsLoadingStats(true);
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
    setIsLoadingStats(false);
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

    // Load audio URL
    if (recording.audio_file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("optimizations")
        .createSignedUrl(recording.audio_file_path, 3600);

      if (signedUrl) {
        setAudioUrl(signedUrl.signedUrl);
      }
    }

    // Load transcript if available
    if (recording.transcription_status === "completed") {
      const { data: transcriptData } = await supabase
        .from("j_ads_optimization_transcripts")
        .select("*")
        .eq("recording_id", recording.id)
        .single();

      if (transcriptData) {
        setTranscript(transcriptData as OptimizationTranscriptRow);
      }
    }

    // Load context if available
    if (recording.analysis_status === "completed") {
      const { data: contextData } = await supabase
        .from("j_ads_optimization_context")
        .select("*")
        .eq("recording_id", recording.id)
        .single();

      if (contextData) {
        setContext(rowToOptimizationContext(contextData));
      }
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
            <>
              {isLoadingStats ? (
                <StatsSkeleton />
              ) : (
                <OptimizationStats
                  total={stats.total}
                  pending={stats.pending}
                  transcribed={stats.transcribed}
                  analyzed={stats.analyzed}
                />
              )}
            </>
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
                {isLoadingRecordings && recordings.length === 0 ? (
                  <RecorderSkeleton />
                ) : (
                  <OptimizationRecorder
                    accountId={selectedAccount}
                    accountName={accountName}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </div>
            </div>

            {/* Recordings List - Takes remaining space */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters and sorting */}
              {recordings.length > 0 && (
                <OptimizationFilters
                  filterStatus={filterStatus}
                  sortBy={sortBy}
                  onFilterChange={setFilterStatus}
                  onSortChange={setSortBy}
                  totalCount={recordings.length}
                  filteredCount={filteredAndSortedRecordings.length}
                />
              )}

              {isLoadingRecordings ? (
                <RecordingsListSkeleton count={3} />
              ) : (
                <OptimizationListCompact
                  recordings={filteredAndSortedRecordings}
                  onRecordingClick={handleRecordingClick}
                  selectedRecordingId={selectedRecording?.id}
                />
              )}
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
        isTranscribing={isTranscribing}
        isAnalyzing={isAnalyzing}
      />
    </JumperBackground>
  );
}

