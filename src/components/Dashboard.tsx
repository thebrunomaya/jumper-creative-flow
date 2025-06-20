
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrafts } from '@/hooks/useDrafts';
import { useNotionClients } from '@/hooks/useNotionData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Trash2, 
  Copy,
  Eye,
  Filter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { drafts, loading, error, fetchDrafts, deleteDraft } = useDrafts();
  const { clients } = useNotionClients();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'COMPLETED': return 'Finalizado';
      default: return status;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const handleContinueEditing = (draft: any) => {
    // Navigate to creative editor with draft data
    navigate(`/creative/${draft.creative_id}`, { 
      state: { draftData: draft } 
    });
  };

  const handleDeleteDraft = async (creativeId: string) => {
    try {
      await deleteDraft(creativeId);
      toast({
        title: "Rascunho excluído",
        description: "O rascunho foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir rascunho. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateDraft = (draft: any) => {
    // Navigate to new creative with pre-filled data
    navigate('/creative/new', { 
      state: { 
        duplicateData: {
          ...draft.form_data,
          // Clear file-related data for duplication
          files: [],
          validatedFiles: [],
          mediaVariations: draft.form_data.mediaVariations?.map((v: any) => ({
            ...v,
            squareFile: undefined,
            verticalFile: undefined,
            horizontalFile: undefined
          })),
          carouselCards: draft.form_data.carouselCards?.map((c: any) => ({
            ...c,
            file: undefined
          }))
        }
      } 
    });
  };

  const filteredDrafts = drafts.filter(draft => {
    if (statusFilter === 'all') return true;
    return draft.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-jumper-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-96" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jumper-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-jumper-text">Dashboard de Criativos</h1>
            <p className="text-gray-600 mt-1">Gerencie seus rascunhos e crie novos criativos</p>
          </div>
          <Button
            onClick={() => navigate('/creative/new')}
            className="bg-gradient-jumper hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Criativo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="w-4 h-4 text-gray-600" />
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            fetchDrafts(value === 'all' ? undefined : value);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="ml-3">
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{drafts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium">Rascunhos</p>
                  <p className="text-2xl font-bold">{drafts.filter(d => d.status === 'DRAFT').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium">Em Progresso</p>
                  <p className="text-2xl font-bold">{drafts.filter(d => d.status === 'IN_PROGRESS').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium">Finalizados</p>
                  <p className="text-2xl font-bold">{drafts.filter(d => d.status === 'COMPLETED').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drafts Grid */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredDrafts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'all' ? 'Nenhum criativo encontrado' : 'Nenhum criativo com esse status'}
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' 
                  ? 'Comece criando seu primeiro criativo'
                  : 'Tente filtrar por outro status ou crie um novo criativo'
                }
              </p>
              <Button onClick={() => navigate('/creative/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Criativo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {draft.creative_id}
                    </CardTitle>
                    <Badge className={getStatusColor(draft.status)}>
                      {getStatusLabel(draft.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getClientName(draft.client_id)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {draft.platform && (
                      <p className="text-sm"><span className="font-medium">Plataforma:</span> {draft.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</p>
                    )}
                    {draft.creative_type && (
                      <p className="text-sm"><span className="font-medium">Tipo:</span> {
                        draft.creative_type === 'single' ? 'Anúncio Único' :
                        draft.creative_type === 'carousel' ? 'Carrossel' : 'Coleção'
                      }</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Atualizado: {formatDate(draft.updated_at)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleContinueEditing(draft)}
                      className="flex-1"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Continuar
                    </Button>
                    <Button
                      onClick={() => handleDuplicateDraft(draft)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteDraft(draft.creative_id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
