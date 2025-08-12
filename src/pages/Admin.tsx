import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import { Link } from "react-router-dom";

interface SubmissionRow {
  id: string;
  client: string | null;
  manager_id: string | null;
  status: string;
  error: string | null;
  created_at: string;
  updated_at?: string;
  client_name?: string | null;
}

const statusToLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  pending: { label: "Armazenado", variant: "secondary" },
  queued: { label: "Armazenado", variant: "secondary" },
  processing: { label: "Armazenado", variant: "secondary" },
  processed: { label: "Publicado", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

    const { data, error } = await supabase.functions.invoke("admin-actions", {
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
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: {
          action: "publish",
          submissionId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao publicar");
      return data;
    },
    onMutate: (id) => {
      toast({ title: "Publicando…", description: `Criativo ${id} em processamento.` });
    },
    onSuccess: async () => {
      toast({ title: "Publicado", description: "Criativo enviado ao Notion com sucesso." });
      await qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
    },
    onError: (err: any) => {
      toast({ title: "Falha ao publicar", description: err?.message || "Tente novamente.", variant: "destructive" });
    },
  });

  const queueMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
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

  const syncNotionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("notion-sync");
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
                <Button size="sm" onClick={() => syncNotionMutation.mutate()} disabled={syncNotionMutation.isPending}>Sincronizar Notion</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[32%]">Conta</TableHead>
                    <TableHead className="w-[24%]">Gerente</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[24%]"/>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const statusInfo = statusToLabel[row.status] || { label: row.status, variant: "outline" };
                    const gerente = row.manager_id ? (row.manager_id === currentUser?.id ? currentUser?.name : row.manager_id) : "—";
                    const conta = row.client_name || row.client || "—";

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground truncate max-w-[420px]" title={conta}>{conta}</span>
                            <span className="text-xs text-muted-foreground">ID: {row.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">{gerente}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.status === "error" ? (
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setErrorDetails(row.error || "Sem detalhes disponíveis")}>Ver erro</Button>
                              <Button size="sm" onClick={() => publishMutation.mutate(row.id)} disabled={publishMutation.isPending}>Publicar novamente</Button>
                            </div>
                          ) : row.status === "processed" ? (
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => toast({ title: "Publicado", description: "Este criativo já foi publicado." })}>Detalhes</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => queueMutation.mutate(row.id)} disabled={queueMutation.isPending}>Fila</Button>
                              <Button size="sm" onClick={() => publishMutation.mutate(row.id)} disabled={publishMutation.isPending}>Publicar</Button>
                            </div>
                          )}
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
      </main>
    </>
  );
};

export default AdminPage;
