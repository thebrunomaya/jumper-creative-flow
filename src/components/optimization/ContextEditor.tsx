import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface ContextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  originalContext: string;
  currentContext: string;
  onSave: (newContext: string) => void;
}

export const ContextEditor = ({
  isOpen,
  onClose,
  originalContext,
  currentContext,
  onSave,
}: ContextEditorProps) => {
  const [editedContext, setEditedContext] = useState(currentContext);

  const handleSave = () => {
    onSave(editedContext);
    onClose();
  };

  const handleRestore = () => {
    setEditedContext(originalContext);
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

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Contexto da Conta</label>
            <Textarea
              value={editedContext}
              onChange={(e) => setEditedContext(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Digite o contexto da conta..."
            />
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
