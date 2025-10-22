/**
 * Optimization Page - Executive Panel
 * Shows ALL optimizations with quick RADAR view via drawer
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OptimizationCard } from "@/components/optimization/OptimizationCard";
import { RadarDrawer } from "@/components/optimization/RadarDrawer";
import { AccountSelector } from "@/components/optimization/AccountSelector";
import { JumperBackground } from "@/components/ui/jumper-background";
import { JumperButton } from "@/components/ui/jumper-button";
import { Loader2, Plus } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import { RadarTags, initializeEmptyTags } from "@/types/radarTags";

interface OptimizationData {
  id: string;
  account_id: string;
  recorded_by: string;
  recorded_at: string;
  account_name: string;
  extract_text: string | null;
  extract_tags: RadarTags | null;
}

export default function Optimization() {
  const navigate = useNavigate();

  // Filter state
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");

  // Data state
  const [optimizations, setOptimizations] = useState<OptimizationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<OptimizationData | null>(null);

  // Fetch optimizations on mount and filter change
  useEffect(() => {
    setOptimizations([]);
    setPage(0);
    setHasMore(true);
    fetchOptimizations(true);
  }, [selectedAccountFilter]);

  // Fetch optimizations with pagination
  async function fetchOptimizations(reset = false) {
    setIsLoading(true);

    const currentPage = reset ? 0 : page;
    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // Build query
      let query = supabase
        .from('j_hub_optimization_recordings')
        .select(`
          id,
          account_id,
          recorded_by,
          recorded_at,
          extract:j_hub_optimization_extracts!recording_id(extract_text, tags)
        `)
        .order('recorded_at', { ascending: false })
        .range(from, to);

      // Apply account filter if not 'all'
      if (selectedAccountFilter && selectedAccountFilter !== 'all') {
        query = query.eq('account_id', selectedAccountFilter);
      }

      const { data: recordings, error: recordingsError } = await query;

      if (recordingsError) {
        console.error('Error fetching recordings:', recordingsError);
        toast.error('Erro ao carregar otimizações');
        setIsLoading(false);
        return;
      }

      // Fetch account names for all recordings
      const accountIds = [...new Set(recordings?.map((r) => r.account_id) || [])];

      const { data: accounts } = await supabase
        .from('j_hub_notion_db_accounts')
        .select('notion_id, Conta')
        .in('notion_id', accountIds);

      const accountMap = new Map(accounts?.map((a) => [a.notion_id, a.Conta]) || []);

      // Transform data
      const transformed: OptimizationData[] = (recordings || []).map((r) => ({
        id: r.id,
        account_id: r.account_id,
        recorded_by: r.recorded_by,
        recorded_at: r.recorded_at,
        account_name: accountMap.get(r.account_id) || r.account_id,
        extract_text: (r.extract as any)?.[0]?.extract_text || null,
        extract_tags: (r.extract as any)?.[0]?.tags || null,
      }));

      // Update state
      if (reset) {
        setOptimizations(transformed);
      } else {
        setOptimizations((prev) => [...prev, ...transformed]);
      }

      // Check if there are more items
      setHasMore(transformed.length === ITEMS_PER_PAGE);

      if (!reset) {
        setPage((p) => p + 1);
      }
    } catch (error) {
      console.error('Error fetching optimizations:', error);
      toast.error('Erro ao carregar otimizações');
    } finally {
      setIsLoading(false);
    }
  }

  // Handlers
  function handleOpenDrawer(optimization: OptimizationData) {
    if (!optimization.extract_text) {
      toast.error('Esta otimização ainda não tem extrato gerado');
      return;
    }

    setDrawerData(optimization);
    setDrawerOpen(true);
  }

  function handleOpenFull(optimizationId: string) {
    navigate(`/optimization/editor/${optimizationId}`);
  }

  function handleShare() {
    if (drawerData) {
      navigate(`/optimization/editor/${drawerData.id}`);
      // User can share from full editor
    }
  }

  // Load more on scroll
  function handleLoadMore() {
    if (!isLoading && hasMore) {
      fetchOptimizations();
    }
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Painel de Otimizações</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e organize todas as otimizações de tráfego com o método RADAR
            </p>
          </div>

          {/* Account Filter */}
          <div className="max-w-md">
            <label className="text-sm font-medium mb-2 block">Filtrar por Conta (Opcional)</label>
            <AccountSelector
              value={selectedAccountFilter}
              onValueChange={setSelectedAccountFilter}
              allowAll={true}
            />
          </div>
        </div>

        {/* Optimizations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedAccountFilter === 'all'
                ? 'Todas as Otimizações'
                : 'Otimizações Filtradas'}
            </h2>
            {isLoading && page === 0 && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Cards List */}
          {optimizations.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma otimização encontrada</p>
              {selectedAccountFilter !== 'all' && (
                <p className="text-sm mt-2">Tente selecionar "Todas as Contas"</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {optimizations.map((opt) => (
                <OptimizationCard
                  key={opt.id}
                  recordingId={opt.id}
                  accountName={opt.account_name}
                  recordedBy={opt.recorded_by}
                  recordedAt={opt.recorded_at}
                  tags={opt.extract_tags}
                  hasExtract={!!opt.extract_text}
                  onOpenDrawer={() => handleOpenDrawer(opt)}
                  onOpenFull={() => handleOpenFull(opt.id)}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && optimizations.length > 0 && (
            <div className="flex justify-center pt-4">
              <JumperButton
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Carregar Mais'
                )}
              </JumperButton>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button - New Optimization */}
      <button
        onClick={() => toast.info('Gravador será implementado em modal/drawer separado')}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center group z-50"
        aria-label="Nova Otimização"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Nova Otimização</span>
      </button>

      {/* RADAR Drawer */}
      {drawerData && (
        <RadarDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          recordingId={drawerData.id}
          accountName={drawerData.account_name}
          recordedBy={drawerData.recorded_by}
          recordedAt={drawerData.recorded_at}
          radarText={drawerData.extract_text || ''}
          tags={drawerData.extract_tags}
          onOpenFull={() => handleOpenFull(drawerData.id)}
          onShare={handleShare}
        />
      )}
    </JumperBackground>
  );
}
