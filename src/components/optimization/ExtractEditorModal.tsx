/**
 * ExtractEditorModal
 * Modal for manually editing optimization extract (OptimizationContext)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { JumperButton } from '@/components/ui/jumper-button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Save,
  X,
  AlertCircle,
  Undo2,
  Loader2,
} from 'lucide-react';
import { OptimizationContext } from '@/types/optimization';

interface ExtractEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: OptimizationContext;
  onSave: (updatedContext: OptimizationContext) => void;
}

export function ExtractEditorModal({
  open,
  onOpenChange,
  context,
  onSave,
}: ExtractEditorModalProps) {
  const [editedJson, setEditedJson] = useState('');
  const [originalJson, setOriginalJson] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize JSON when modal opens
  useEffect(() => {
    if (open && context) {
      const jsonString = JSON.stringify({
        summary: context.summary,
        actions_taken: context.actions_taken,
        metrics_mentioned: context.metrics_mentioned,
        strategy: context.strategy,
        timeline: context.timeline,
        confidence_level: context.confidence_level,
      }, null, 2);

      setEditedJson(jsonString);
      setOriginalJson(jsonString);
      setIsValid(true);
    }
  }, [open, context]);

  // Validate JSON on change
  useEffect(() => {
    try {
      JSON.parse(editedJson);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  }, [editedJson]);

  const handleSave = async () => {
    if (!isValid) {
      toast.error('JSON inválido. Corrija os erros antes de salvar.');
      return;
    }

    setIsSaving(true);

    try {
      const parsedContext = JSON.parse(editedJson);

      // Update database
      const { error } = await supabase
        .from('j_hub_optimization_context')
        .update({
          summary: parsedContext.summary,
          actions_taken: parsedContext.actions_taken,
          metrics_mentioned: parsedContext.metrics_mentioned,
          strategy: parsedContext.strategy,
          timeline: parsedContext.timeline,
          confidence_level: parsedContext.confidence_level || 'revised',
        })
        .eq('id', context.id);

      if (error) throw error;

      // Update local state
      onSave({
        ...context,
        ...parsedContext,
        confidence_level: parsedContext.confidence_level || 'revised',
      });

      toast.success('Extrato atualizado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving extract:', error);
      toast.error(error.message || 'Erro ao salvar extrato');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = () => {
    setEditedJson(originalJson);
    toast.info('Restaurado para versão original');
  };

  const handleClose = () => {
    if (editedJson !== originalJson) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja descartar?');
      if (!confirm) return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Extrato de Otimização
            <Badge variant="outline" className="text-xs">
              JSON Editor
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Edite manualmente os campos do extrato ou use IA para melhorar automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-orange-600 mb-1">Atenção: Edição Manual</p>
            <p>
              Certifique-se de manter a estrutura JSON válida. Use "Melhorar com IA" se preferir
              uma reprocessamento completo baseado na transcrição original.
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Extrato Estruturado (JSON)
            </Label>
            <div className="flex items-center gap-2">
              {!isValid && (
                <Badge variant="destructive" className="text-xs">
                  JSON Inválido
                </Badge>
              )}
              {isValid && editedJson !== originalJson && (
                <Badge variant="secondary" className="text-xs">
                  Modificado
                </Badge>
              )}
            </div>
          </div>

          <Textarea
            value={editedJson}
            onChange={(e) => setEditedJson(e.target.value)}
            className={`flex-1 font-mono text-xs resize-none ${
              !isValid ? 'border-destructive' : ''
            }`}
            placeholder="JSON do extrato..."
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <JumperButton
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={editedJson === originalJson || isSaving}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Restaurar Original
          </JumperButton>

          <div className="flex gap-2">
            <JumperButton
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </JumperButton>

            <JumperButton
              size="sm"
              onClick={handleSave}
              disabled={!isValid || isSaving || editedJson === originalJson}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </JumperButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
