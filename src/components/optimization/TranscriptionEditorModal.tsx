import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";

interface TranscriptionEditorModalProps {
  recordingId: string;
  transcriptType: 'raw' | 'processed';
  initialText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function TranscriptionEditorModal({
  recordingId,
  transcriptType,
  initialText,
  open,
  onOpenChange,
  onSave,
}: TranscriptionEditorModalProps) {
  const [editedText, setEditedText] = useState(initialText);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleApplyAI = async () => {
    if (!aiInstruction.trim()) {
      toast.error("Digite uma instrução para a IA");
      return;
    }

    setIsApplyingAI(true);
    try {
      console.log('🤖 Applying AI correction with instruction:', aiInstruction);
      
      const { data, error } = await supabase.functions.invoke('j_hub_optimization_improve_transcript', {
        body: {
          recording_id: recordingId,
          instruction: aiInstruction,
        },
      });

      if (error) throw error;

      if (data?.corrected_text) {
        setEditedText(data.corrected_text);
        setAiInstruction("");
        toast.success("Correção aplicada com sucesso!");
      } else {
        throw new Error('No corrected text received');
      }

    } catch (error) {
      console.error('Error applying AI correction:', error);
      toast.error("Erro ao aplicar correção com IA");
    } finally {
      setIsApplyingAI(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userEmail = (await supabase.auth.getUser()).data.user?.email;

      const updateData = transcriptType === 'raw' 
        ? { full_text: editedText }
        : { processed_text: editedText };

      const { error } = await supabase
        .from('j_hub_optimization_transcripts')
        .update({
          ...updateData,
          revised_at: new Date().toISOString(),
          revised_by: userEmail || 'unknown',
        })
        .eq('recording_id', recordingId);

      if (error) throw error;

      toast.success("Transcrição revisada salva!");
      onSave();
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving revised transcription:', error);
      toast.error("Erro ao salvar revisão");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Editar Transcrição {transcriptType === 'processed' ? '(Processada)' : '(Bruta)'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edited-text">Texto da Transcrição</Label>
            <Textarea
              id="edited-text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Edite a transcrição diretamente aqui..."
            />
          </div>

          <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
            <Label htmlFor="ai-instruction">Correção com IA (Opcional)</Label>
            <Input
              id="ai-instruction"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="Ex: trocar 'CPA' por 'custo por aquisição' em todo o texto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleApplyAI();
                }
              }}
            />
            <Button
              onClick={handleApplyAI}
              disabled={isApplyingAI || !aiInstruction.trim()}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {isApplyingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Aplicar Correção com IA
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Revisão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}