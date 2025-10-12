import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Check, Info, Bug } from 'lucide-react';
import { DiffView } from './DiffView';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIImprovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  currentText: string;
  whisperPrompt?: string;
  onApply: (newText: string) => void;
  isAdmin?: boolean;
  onDebug?: () => void;
}

export function AIImprovementsModal({
  isOpen,
  onClose,
  recordingId,
  currentText,
  whisperPrompt,
  onApply,
  isAdmin = false,
  onDebug,
}: AIImprovementsModalProps) {
  const [instructions, setInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleProcess = async () => {
    if (!instructions.trim()) {
      toast.error('Digite as instruções de ajuste');
      return;
    }

    setIsProcessing(true);

    try {
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke(
        'j_hub_optimization_improve_transcript',
        {
          body: {
            recording_id: recordingId,
            action: 'ai_improve',
            current_text: currentText,
            whisper_prompt: whisperPrompt || '',
            user_instructions: instructions,
          },
        }
      );

      if (error) throw error;

      if (data?.improved_text) {
        setSuggestedText(data.improved_text);
        setShowPreview(true);
      } else {
        throw new Error('No improved text returned');
      }
    } catch (error) {
      console.error('Error processing improvements:', error);
      toast.error('Erro ao processar melhorias com IA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    onApply(suggestedText);
    handleClose();
    toast.success('Alterações aplicadas com sucesso');
  };

  const handleClose = () => {
    setInstructions('');
    setSuggestedText('');
    setShowPreview(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Ajustar Transcrição com IA</DialogTitle>
            {isAdmin && onDebug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDebug();
                }}
                className="h-8 w-8 p-0"
                title="Debug (Admin)"
              >
                <Bug className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {!showPreview ? (
          // Step 1: User instructions
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descreva os ajustes necessários:
              </label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="• Trocar 'Tiaro' por 'Tyaro'&#10;• Corrigir 'SEV' para 'Seven'&#10;• "
                rows={4}
                className="font-mono text-sm"
              />
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Seja específico para evitar alterações indesejadas.
                  A IA fará apenas as correções que você solicitar, mantendo o resto do texto intacto.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleProcess}
                disabled={isProcessing || !instructions.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Processar com IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 2: Preview changes
          <>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Preview das Alterações:</h4>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto bg-muted/30">
                  <DiffView oldText={currentText} newText={suggestedText} />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Revise as alterações antes de aplicar. Você ainda poderá editar manualmente após aplicar.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowPreview(false)}
              >
                ← Voltar
              </Button>
              <Button onClick={handleApply}>
                <Check className="mr-2 h-4 w-4" />
                Aplicar Alterações
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
