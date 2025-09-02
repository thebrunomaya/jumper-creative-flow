import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { RefreshCw, Settings, ArrowLeft } from "lucide-react";
import { CreativeDetailsModal } from "@/components/CreativeDetailsModal";
import { NotionSyncControl } from "@/components/NotionSyncControl";
import { StatusMetrics } from "@/components/admin/StatusMetrics";
import { FilterBar } from "@/components/admin/FilterBar";
import { CreativeCard } from "@/components/admin/CreativeCard";

interface SubmissionRow {
  id: string;
  client: string | null;
  manager_id: string | null;
  status: string;
  error: string | null;
  created_at: string;
  updated_at?: string;
  client_name?: string | null;
  creative_name?: string | null;
  manager_name?: string | null;
  payload?: any;
  files?: any[];
}


const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null);
  const [detailsSubmission, setDetailsSubmission] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [publishingSubmission, setPublishingSubmission] = useState<string | null>(null);
  const [publishingLogs, setPublishingLogs] = useState<string[]>([]);
  const [publishingResult, setPublishingResult] = useState<any>(null);
  
  // New state for the improved UI
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNotionSync, setShowNotionSync] = useState(false);

  useEffect(() => {
    document.title = "Admin • Ad Uploader";
  }, []);

  const fetchSubmissions = async (): Promise<SubmissionRow[]> => {
    if (!currentUser) {
      throw new Error("Não autenticado");
    }

    // Verificação defensiva de função admin para evitar chamadas 403 desnecessárias
    const { data: authData } = await supabase.auth.getUser();
    const userId = currentUser?.id || authData?.user?.id || null;
    const { data: isAdmin, error: roleErr } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (roleErr || !isAdmin) {
      throw new Error('Acesso negado: apenas administradores.');
    }

    const { data, error } = await supabase.functions.invoke("j_ads_admin_dashboard", {
      body: { action: "list" },
    });

    if (error) throw error;
    if (!data?.submissions) throw new Error(data?.error || "Falha ao carregar");

    // Extract creative names from payload for each submission
    const enrichedSubmissions = data.submissions.map((sub: any) => ({
      ...sub,
      creative_name: sub.payload?.creativeName || null,
    }));

    return enrichedSubmissions as SubmissionRow[];
  };

  const { data: items = [], isFetching, refetch } = useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: fetchSubmissions,
  });

  const publishMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      // Start polling
      setPublishingSubmission(submissionId);
      setPublishingLogs(["🚀 Iniciando publicação..."]);
      setPublishingResult(null);

      // Start the publication process
      const { data, error } = await supabase.functions.invoke("j_ads_admin_dashboard", {
        body: {
          action: "publish",
          submissionId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao publicar");
      return data;
    },
    onMutate: () => {
      // No toast here, we'll show the overlay
    },
    onSuccess: async (data) => {
      setPublishingResult(data.result);
      
      // Show success toast with details
      toast({ 
        title: "✅ Publicação Concluída", 
        description: JSON.stringify(data.result?.createdCreatives || {}, null, 2),
        duration: 10000 
      });
      
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
      
      // Auto-open details modal after success
      if (publishingSubmission) {
        setTimeout(async () => {
          const details = await fetchSubmissionDetails(publishingSubmission);
          setDetailsSubmission(details);
          setIsDetailsModalOpen(true);
        }, 1000);
      }
    },
    onError: (err: any) => {
      let details: any = undefined;
      try {
        if (err?.context) {
          details = typeof err.context === 'string' ? JSON.parse(err.context) : err.context;
        }
      } catch {}

      setPublishingResult({
        success: false,
        error: err?.message || 'Edge Function error',
        stack: err?.stack,
        details,
      });
      
      toast({ 
        title: "❌ Falha na Publicação", 
        description: `Erro: ${err?.message || "Erro desconhecido"}`, 
        variant: "destructive",
        duration: 10000
      });
    },
    onSettled: () => {
      // Não feche automaticamente; espere o administrador fechar manualmente
    },
  });

  const queueMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke("j_ads_admin_dashboard", {
        body: {
          action: "queue",
          submissionId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao enfileirar");
      return data;
    },
    onMutate: (id) => {
      toast({ title: "Enfileirando…", description: `Criativo ${id} foi colocado na fila.` });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao enfileirar", description: err?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke("j_ads_admin_dashboard", {
        body: {
          action: "deleteSubmission",
          submissionId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao excluir");
      return data;
    },
    onMutate: (id) => {
      toast({ title: "Excluindo…", description: `Removendo criativo ${id}...` });
    },
    onSuccess: async () => {
      toast({ title: "Excluído", description: "Criativo removido com sucesso." });
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao excluir", description: err?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const syncNotionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("j_ads_notion_sync_accounts");
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao sincronizar Notion");
      return data;
    },
    onMutate: () => {
      toast({ title: "Sincronizando…", description: "Buscando dados do Notion e atualizando o Supabase." });
    },
    onSuccess: async (data: any) => {
      const s = data?.synced || {};
      toast({
        title: "Sincronizado",
        description: `Contas: ${s.accounts || 0} | Gerentes: ${s.managers || 0} | Vínculos: ${s.links || 0}`,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao sincronizar", description: err?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const backfillEmailsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("j_ads_admin_dashboard", {
        body: { action: "backfill_manager_emails" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao preencher emails");
      return data;
    },
    onMutate: () => {
      toast({ title: "Preenchendo emails…", description: "Corrigindo emails de gerentes em submissões antigas." });
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Emails preenchidos",
        description: `${data.updated || 0} de ${data.total || 0} submissões atualizadas`,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao preencher emails", description: err?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const fetchSubmissionDetails = async (submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('j_ads_admin_dashboard', {
        body: { action: 'getDetails', submissionId }
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch details');
      
      return data.submission;
    } catch (error: any) {
      toast({
        title: "Erro ao carregar detalhes",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleViewDetails = async (submission: SubmissionRow) => {
    try {
      const details = await fetchSubmissionDetails(submission.id);
      setDetailsSubmission(details);
      setIsDetailsModalOpen(true);
    } catch (error) {
      // Error already handled in fetchSubmissionDetails
    }
  };

  // Polling for publishing status
  useEffect(() => {
    if (!publishingSubmission) return;

    const pollInterval = setInterval(async () => {
      try {
        const details = await fetchSubmissionDetails(publishingSubmission);
        const result = details?.result;
        
        if (result?.logs) {
          setPublishingLogs(result.logs);
        }
        
        // Stop polling if finished
        if (details?.status === "processed" || details?.status === "error") {
          clearInterval(pollInterval);
          setPublishingResult(result);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [publishingSubmission]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.creative_name?.toLowerCase().includes(query)) ||
        (item.client_name?.toLowerCase().includes(query)) ||
        (item.manager_name?.toLowerCase().includes(query)) ||
        (item.client?.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    return filtered;
  }, [items, searchQuery, statusFilter]);

  // Selection handlers
  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, id]
        : prev.filter(item => item !== id)
    );
  };

  const handleBulkPublish = async () => {
    if (selectedItems.length === 0) return;
    
    toast({
      title: "Publicação em lote iniciada",
      description: `Publicando ${selectedItems.length} criativo(s)...`
    });
    
    // Process each selected item
    for (const itemId of selectedItems) {
      try {
        await publishMutation.mutateAsync(itemId);
      } catch (error) {
        console.error(`Failed to publish ${itemId}:`, error);
      }
    }
    
    // Clear selection after bulk operation
    setSelectedItems([]);
  };

  const rows = filteredItems;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie submissões, publique criativos e sincronize dados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-[#FA4721] hover:bg-[#E03E1A] text-white border-[#FA4721] hover:border-[#E03E1A]"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotionSync(!showNotionSync)}
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" asChild className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Status Metrics */}
        <section>
          <StatusMetrics
            items={items}
            onStatusFilter={setStatusFilter}
            activeFilter={statusFilter}
          />
        </section>

        {/* Main Content */}
        <section>
          <Card className="overflow-hidden">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedItems={selectedItems}
              onBulkPublish={handleBulkPublish}
              isPublishing={publishMutation.isPending}
              totalItems={rows.length}
            />
            
            <div className="p-6">
              {rows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    {isFetching 
                      ? "Carregando criativos..." 
                      : searchQuery || statusFilter
                        ? "Nenhum criativo encontrado com os filtros aplicados"
                        : "Nenhum criativo encontrado"
                    }
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {rows.map((submission) => (
                    <CreativeCard
                      key={submission.id}
                      submission={submission}
                      isSelected={selectedItems.includes(submission.id)}
                      onSelectionChange={handleSelectionChange}
                      onViewDetails={handleViewDetails}
                      onPublish={(id) => publishMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isPublishing={publishMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Notion Sync Section - Collapsible */}
        {showNotionSync && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Sincronização Notion</h3>
                  <NotionSyncControl />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Operações de Manutenção</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => backfillEmailsMutation.mutate()} 
                      disabled={backfillEmailsMutation.isPending}
                    >
                      {backfillEmailsMutation.isPending ? 'Corrigindo...' : 'Corrigir Emails'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => syncNotionMutation.mutate()} 
                      disabled={syncNotionMutation.isPending}
                    >
                      {syncNotionMutation.isPending ? 'Sincronizando...' : 'Sincronizar Notion'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <Dialog open={!!errorDetails} onOpenChange={() => setErrorDetails(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do erro</DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-left">
                {errorDetails}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <CreativeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setDetailsSubmission(null);
          }}
          submission={detailsSubmission}
        />

        {/* Publishing Overlay */}
        {publishingSubmission && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Card className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-r-transparent"></div>
                  Publicando Criativo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    ID: {publishingSubmission}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Logs em Tempo Real:</h4>
                    <ScrollArea className="h-60 w-full border rounded p-3">
                      <div className="space-y-1">
                        {publishingLogs.map((log, index) => (
                          <div key={index} className="text-sm font-mono">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {publishingResult && (
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        {publishingResult.success ? "✅ Resultado da Publicação:" : "❌ Erro na Publicação:"}
                      </h4>
                      <div className="border rounded p-3 bg-muted/30">
                        {publishingResult.success ? (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Criativos criados no Notion:</strong>
                            </div>
                            <pre className="text-xs bg-background p-2 rounded overflow-auto">
                              {JSON.stringify(publishingResult.createdCreatives || {}, null, 2)}
                            </pre>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(publishingResult, null, 2));
                                  toast({ title: "Copiado!", description: "Resultado copiado para área de transferência" });
                                }}
                              >
                                Copiar JSON Completo
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm text-destructive">
                              <strong>Erro:</strong> {publishingResult.error}
                            </div>
                            {publishingResult.stack && (
                              <div className="text-xs">
                                <strong>Stack trace:</strong>
                                <pre className="text-xs bg-background p-2 rounded overflow-auto mt-1">
                                  {publishingResult.stack}
                                </pre>
                              </div>
                            )}
                            {publishingResult.details && (
                              <div className="text-xs">
                                <strong>Detalhes (payload do servidor):</strong>
                                <pre className="text-xs bg-background p-2 rounded overflow-auto mt-1">
                                  {JSON.stringify(publishingResult.details, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(publishingResult, null, 2));
                                  toast({ title: "Copiado!", description: "Erro copiado para área de transferência" });
                                }}
                              >
                                Copiar Erro Completo
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {publishingResult && (
                    <div className="flex justify-end">
                      <Button onClick={() => {
                        setPublishingSubmission(null);
                        setPublishingLogs([]);
                        setPublishingResult(null);
                      }}>
                        Fechar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
};

export default AdminPage;
