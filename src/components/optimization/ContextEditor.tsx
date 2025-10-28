import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  originalContext: string;
  currentContext: string;
  onSave: (newContext: string) => void;
  accountId?: string; // Optional: for loading last used context
  showPreview?: boolean; // Optional: show prompt preview tab
  dateRange?: { start: Date; end: Date }; // Optional: for preview
}

export const ContextEditor = ({
  isOpen,
  onClose,
  originalContext,
  currentContext,
  onSave,
  accountId,
  showPreview = false,
  dateRange,
}: ContextEditorProps) => {
  const [editedContext, setEditedContext] = useState(currentContext);
  const [lastUsedContext, setLastUsedContext] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editedContext]);

  // Load last used context for this account
  useEffect(() => {
    if (!accountId || !isOpen) return;

    const loadLastContext = async () => {
      try {
        // TODO: Fetch from Supabase - get last optimization recording for this account
        // For now, check localStorage as fallback
        const storageKey = `last_context_${accountId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored && stored !== originalContext) {
          setLastUsedContext(stored);
        }
      } catch (error) {
        console.error('Failed to load last used context:', error);
      }
    };

    loadLastContext();
  }, [accountId, isOpen, originalContext]);

  const handleSave = () => {
    // Save to localStorage for future reference
    if (accountId) {
      try {
        localStorage.setItem(`last_context_${accountId}`, editedContext);
      } catch (error) {
        console.error('Failed to save context to localStorage:', error);
      }
    }

    onSave(editedContext);
    onClose();
  };

  const handleRestore = () => {
    setEditedContext(originalContext);
  };

  const handleLoadLastUsed = () => {
    if (lastUsedContext) {
      setEditedContext(lastUsedContext);
    }
  };

  const charCount = editedContext.length;
  const wordCount = editedContext.trim().split(/\s+/).filter(w => w).length;

  const renderPreview = () => {
    if (!showPreview) return null;

    const dateStr = dateRange
      ? `${dateRange.start.toLocaleDateString('pt-BR')} - ${dateRange.end.toLocaleDateString('pt-BR')}`
      : 'Período não selecionado';

    return (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">Preview do Prompt de IA</h4>
              <p className="text-xs text-muted-foreground">
                Como o contexto aparecerá no prompt enviado para análise
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-lg p-4 text-sm space-y-2">
          <p><strong>Período analisado:</strong> {dateStr}</p>
          <div className="border-t pt-2 mt-2">
            <p className="text-muted-foreground mb-1">Contexto da conta:</p>
            <p className="whitespace-pre-wrap font-mono text-xs">{editedContext || '(vazio)'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contexto da Conta</DialogTitle>
          <DialogDescription>
            Modifique o contexto apenas para esta gravação
          </DialogDescription>
        </DialogHeader>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Atenção: Alteração Temporária</p>
              <p className="text-muted-foreground">
                Esta alteração vale <strong>apenas para esta gravação</strong>.
                Para mudar permanentemente o contexto da conta, edite no Notion.
              </p>
            </div>
          </div>
        </div>

        {showPreview ? (
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Contexto da Conta</label>
                  <div className="text-xs text-muted-foreground">
                    {charCount} caracteres · {wordCount} palavras
                  </div>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={editedContext}
                  onChange={(e) => setEditedContext(e.target.value)}
                  className="min-h-[300px] font-mono text-sm resize-none"
                  placeholder="Digite o contexto da conta..."
                />
              </div>

              {lastUsedContext && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadLastUsed}
                  className="w-full"
                >
                  📋 Carregar Último Contexto Usado
                </Button>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {renderPreview()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Contexto da Conta</label>
                <div className="text-xs text-muted-foreground">
                  {charCount} caracteres · {wordCount} palavras
                </div>
              </div>
              <Textarea
                ref={textareaRef}
                value={editedContext}
                onChange={(e) => setEditedContext(e.target.value)}
                className="min-h-[300px] font-mono text-sm resize-none"
                placeholder="Digite o contexto da conta..."
              />
            </div>

            {lastUsedContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadLastUsed}
                className="w-full"
              >
                📋 Carregar Último Contexto Usado
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleRestore}
            disabled={editedContext === originalContext}
          >
            Restaurar Original do Notion
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar para Esta Gravação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
