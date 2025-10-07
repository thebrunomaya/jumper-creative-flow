/**
 * Optimization Page - Week 1 MVP
 * 
 * Main page for OPTIMIZER system
 * Combines recorder and list components
 */

import { useState, useEffect } from "react";
import { OptimizationRecorder } from "@/components/OptimizationRecorder";
import { OptimizationList } from "@/components/OptimizationList";
import { AccountSelector } from "@/components/optimization/AccountSelector";
import { OptimizationEmptyState } from "@/components/optimization/OptimizationEmptyState";
import { OptimizationStats } from "@/components/optimization/OptimizationStats";
import { JumperBackground } from "@/components/ui/jumper-background";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

export default function Optimization() {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [stats, setStats] = useState({ total: 0, pending: 0, transcribed: 0, analyzed: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch stats when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchStats();
    }
  }, [selectedAccount, refreshKey]);

  async function fetchStats() {
    const { data } = await supabase
      .from("j_ads_optimization_recordings")
      .select("transcription_status, analysis_status")
      .eq("account_id", selectedAccount);

    if (data) {
      const total = data.length;
      const pending = data.filter(r => r.transcription_status === 'pending').length;
      const transcribed = data.filter(r => r.transcription_status === 'completed').length;
      const analyzed = data.filter(r => r.analysis_status === 'completed').length;
      
      setStats({ total, pending, transcribed, analyzed });
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Get account name for breadcrumbs
  const [accountName, setAccountName] = useState<string>("");
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

  return (
    <JumperBackground overlay={false}>
      {/* Header */}
      <Header />

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
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

          {/* Stats Cards */}
          {selectedAccount && (
            <OptimizationStats 
              total={stats.total}
              pending={stats.pending}
              transcribed={stats.transcribed}
              analyzed={stats.analyzed}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-5xl space-y-6">
          {!selectedAccount ? (
            <OptimizationEmptyState />
          ) : (
            <>
              {/* Recorder */}
              <OptimizationRecorder 
                accountId={selectedAccount} 
                accountName={accountName}
                onUploadComplete={handleRefresh}
              />

              {/* List */}
              <OptimizationList 
                accountId={selectedAccount}
                onRefresh={handleRefresh}
              />
            </>
          )}
        </div>
      </div>
    </JumperBackground>
  );
}
