import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { CreativeDetailsModal } from "@/components/CreativeDetailsModal";

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

const statusToLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  pending: { label: "Armazenado", variant: "secondary" },
  queued: { label: "Na Fila", variant: "secondary" },
  processing: { label: "Processando", variant: "secondary" },
  processed: { label: "Publicado", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

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

    const { data, error } = await supabase.functions.invoke("j_ads_admin_actions", {
      body: {
        action: "listAll",
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Falha ao carregar");

    return (data.items || []) as SubmissionRow[];
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
      const { data, error } = await supabase.functions.invoke("j_ads_admin_actions", {
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
      const { data, error } = await supabase.functions.invoke("j_ads_admin_actions", {
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
      const { data, error } = await supabase.functions.invoke("j_ads_admin_actions", {
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
      const { data, error } = await supabase.functions.invoke("j_ads_notion_sync");
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
      const { data, error } = await supabase.functions.invoke("j_ads_admin_actions", {
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
      const { data, error } = await supabase.functions.invoke('j_ads_admin_actions', {
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

  const rows = useMemo(() => items, [items]);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section>
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerencie as submissões e publique no Notion.</p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">Voltar à Home</Button>
            </Link>
            </header>

            <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <div className="text-sm text-muted-foreground">
                {isFetching ? "Carregando…" : `${rows.length} criativo(s)`}
              </div>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar</Button>
                 <Button variant="outline" size="sm" onClick={() => backfillEmailsMutation.mutate()} disabled={backfillEmailsMutation.isPending}>Corrigir Emails</Button>
                 <Button size="sm" onClick={() => syncNotionMutation.mutate()} disabled={syncNotionMutation.isPending}>Sincronizar Notion</Button>
               </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Criativo</TableHead>
                    <TableHead className="w-[25%]">Conta</TableHead>
                    <TableHead className="w-[20%]">Gerente</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[15%]"/>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const statusInfo = statusToLabel[row.status] || { label: row.status, variant: "outline" };
                    const conta = row.client_name || row.client || "—";
                    const criativo = row.creative_name || "Sem nome";
                    const gerente = row.manager_name || "—";

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={criativo}>{criativo}</span>
                            <span className="text-xs text-muted-foreground">ID: {row.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={conta}>{conta}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[150px]" title={gerente}>{gerente}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.status === "draft" ? (
                            <div className="flex gap-1 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(row)}>Detalhes</Button>
                              <Link to={`/create/${row.id}`}>
                                <Button variant="outline" size="sm">Editar</Button>
                              </Link>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este rascunho?")) {
                                    deleteMutation.mutate(row.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                Excluir
                              </Button>
                            </div>
                          ) : row.status === "error" ? (
                            <div className="flex gap-1 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(row)}>Detalhes</Button>
                              <Link to={`/create/${row.id}`}>
                                <Button variant="outline" size="sm">Editar</Button>
                              </Link>
                              <Button size="sm" onClick={() => publishMutation.mutate(row.id)} disabled={publishMutation.isPending}>Publicar</Button>
                            </div>
                          ) : row.status === "processed" ? (
                            <div className="flex gap-1 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(row)}>Detalhes</Button>
                            </div>
                          ) : ["pending", "queued", "processing"].includes(row.status) ? (
                            <div className="flex gap-1 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(row)}>Detalhes</Button>
                              <Link to={`/create/${row.id}`}>
                                <Button variant="outline" size="sm">Editar</Button>
                              </Link>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este criativo?")) {
                                    deleteMutation.mutate(row.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                Excluir
                              </Button>
                              <Button size="sm" onClick={() => publishMutation.mutate(row.id)} disabled={publishMutation.isPending}>Publicar</Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

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
