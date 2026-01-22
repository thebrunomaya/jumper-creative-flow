/**
 * OptimizationNew - Create New Optimization Recording
 *
 * Complete flow for creating a new optimization:
 * 1. Select account (required)
 * 2. Select date range (required)
 * 3. Edit context (optional)
 * 4. Record/Upload audio
 * 5. Auto-save draft
 * 6. Navigate to editor after transcription
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JumperBackground } from "@/components/ui/jumper-background";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JumperButton } from "@/components/ui/jumper-button";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/optimization/DateRangePicker";
import { ContextEditor } from "@/components/optimization/ContextEditor";
import { OptimizationRecorder } from "@/components/OptimizationRecorder";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Edit,
  Home,
  Loader2,
  Plus,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OptimizationNew() {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading, error: accountsError } = useMyNotionAccounts();
  const { userRole } = useUserRole();
  const { currentUser } = useAuth();
  const { loadDraft, saveDraft, clearDraft, hasDraft, markDirty, startAutoSave } = useDraftManager();

  // Form state - using UUID only (after migration cleanup)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const [accountContext, setAccountContext] = useState<string>("");
  const [customContext, setCustomContext] = useState<string>("");
  const [accountObjectives, setAccountObjectives] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // Last 7 days default
    end: new Date(),
  });

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft()) {
      setShowDraftRecovery(true);
    }
  }, [hasDraft]);

  // Auto-save draft when form changes
  useEffect(() => {
    if (selectedAccountId) {
      markDirty();
      const draft = {
        accountId: selectedAccountId,  // UUID
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
        customContext,
        platform: "meta" as const,
        objectives: accountObjectives,
      };
      startAutoSave(draft);
    }
  }, [selectedAccountId, dateRange, customContext, accountObjectives, markDirty, startAutoSave]);

  const handleAccountChange = (accountId: string) => {
    // accountId parameter is UUID from PrioritizedAccountSelect
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      console.log('🔍 Account loaded:', {
        id: account.id,
        name: account.name,
        objectives: account.objectives,
        contexto: account.contexto_otimizacao
      });

      setSelectedAccountId(account.id);
      setSelectedAccountName(account.name);

      // Use FULL context for optimization (not transcription summary)
      const fullContext = account.contexto_otimizacao || "";
      setAccountContext(fullContext);
      setCustomContext(fullContext);
      setAccountObjectives(account.objectives || []);
    }
  };

  const handleRecoverDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setDateRange({
        start: new Date(draft.dateRange.start),
        end: new Date(draft.dateRange.end),
      });
      setCustomContext(draft.customContext);

      // Restore account by UUID
      const account = accounts.find(a => a.id === draft.accountId);
      if (account) {
        setSelectedAccountId(account.id);
        setSelectedAccountName(account.name);
        setAccountContext(account.contexto_otimizacao || "");
        setAccountObjectives(account.objectives || []);
      }
    }
    setShowDraftRecovery(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRecovery(false);
  };

  const handleUploadComplete = () => {
    clearDraft();
    // Navigate to panel view - user will see toast with "Continue editing" option
    navigate("/optimization");
  };

  const formatDateRange = () => {
    return `${dateRange.start.toLocaleDateString('pt-BR')} - ${dateRange.end.toLocaleDateString('pt-BR')}`;
  };

  const canRecord = selectedAccountId && dateRange.start && dateRange.end;

  if (accountsLoading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando contas...</p>
            </div>
          </div>
        </main>
      </JumperBackground>
    );
  }

  if (accountsError) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar contas: {accountsError}
            </AlertDescription>
          </Alert>
        </main>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => navigate("/optimization")}
            className="hover:text-foreground transition-colors"
          >
            Optimizations
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Nova Otimização</span>
        </div>

        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Plus className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Nova Otimização
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Grave insights sobre as otimizações realizadas em uma conta
              </p>
            </div>
          </div>
        </header>

        {/* Configuration Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--orange-hero))]" />
              Configuração da Otimização
            </CardTitle>
            <CardDescription>
              Selecione a conta e o período analisado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Conta <span className="text-destructive">*</span>
              </label>
              <PrioritizedAccountSelect
                accounts={accounts}
                loading={accountsLoading}
                value={selectedAccountId}
                onChange={handleAccountChange}
                userEmail={currentUser?.email}
                userRole={userRole}
                placeholder="Selecione uma conta"
                className="w-full"
                showInactiveToggle={true}
              />
            </div>

            <Separator />

            {/* Date Range Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Período de Análise <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione o período em que você observou os dados para fazer as otimizações
              </p>

              <div className="flex gap-2">
                <div className="flex-1 p-3 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatDateRange()}</span>
                </div>
                <JumperButton
                  variant="outline"
                  onClick={() => setShowDatePicker(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Alterar
                </JumperButton>
              </div>
            </div>

            <Separator />

            {/* Context Editor */}
            {selectedAccountId && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Contexto da Conta
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Contexto carregado do Notion. Você pode editar apenas para esta gravação.
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 p-3 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {customContext || "Nenhum contexto definido"}
                    </p>
                  </div>
                  <JumperButton
                    variant="outline"
                    onClick={() => setShowContextEditor(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </JumperButton>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recorder Section */}
        {canRecord ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎙️ Gravação / Upload
              </CardTitle>
              <CardDescription>
                Grave sua narração ou envie um arquivo de áudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptimizationRecorder
                accountId={selectedAccountId}
                accountName={selectedAccountName}
                accountContext={accountContext}
                notionObjectives={['Geral', ...accountObjectives]}
                dateRange={dateRange}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione uma conta e um período para começar a gravar
            </AlertDescription>
          </Alert>
        )}

        {/* Date Range Picker Modal */}
        <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DialogContent className="max-w-fit p-0">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              onClose={() => setShowDatePicker(false)}
              onApply={() => setShowDatePicker(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Context Editor Modal */}
        <ContextEditor
          isOpen={showContextEditor}
          onClose={() => setShowContextEditor(false)}
          originalContext={accountContext}
          currentContext={customContext}
          onSave={setCustomContext}
          accountId={selectedAccountId}
          showPreview
          dateRange={dateRange}
        />

        {/* Draft Recovery Modal */}
        <Dialog open={showDraftRecovery} onOpenChange={setShowDraftRecovery}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rascunho Encontrado</DialogTitle>
              <DialogDescription>
                Você tem um rascunho de otimização não finalizado. Deseja continuar de onde parou?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <JumperButton variant="outline" onClick={handleDiscardDraft}>
                Descartar
              </JumperButton>
              <JumperButton onClick={handleRecoverDraft}>
                Continuar Rascunho
              </JumperButton>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </JumperBackground>
  );
}
