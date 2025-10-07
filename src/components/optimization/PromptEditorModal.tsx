import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useOptimizationPrompts, OptimizationPrompt } from '@/hooks/useOptimizationPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'meta' | 'google';
  objective: string;
  accountName?: string;
  accountContext?: string;
}

export const PromptEditorModal = ({
  isOpen,
  onClose,
  platform,
  objective,
  accountName,
  accountContext,
}: PromptEditorModalProps) => {
  const { getPrompt, updatePrompt, renderPromptVariables } = useOptimizationPrompts();
  const { user } = useAuth();
  
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<OptimizationPrompt | undefined>();
  const [analysisPrompt, setAnalysisPrompt] = useState<OptimizationPrompt | undefined>();
  const [editedTranscription, setEditedTranscription] = useState('');
  const [editedAnalysis, setEditedAnalysis] = useState('');

  useEffect(() => {
    if (isOpen) {
      const trans = getPrompt(platform, objective, 'transcription');
      const anal = getPrompt(platform, objective, 'analysis');
      
      setTranscriptionPrompt(trans);
      setAnalysisPrompt(anal);
      setEditedTranscription(trans?.prompt_text || '');
      setEditedAnalysis(anal?.prompt_text || '');
    }
  }, [isOpen, platform, objective]);

  const handleSaveTranscription = async () => {
    if (!transcriptionPrompt || !user?.email) return;
    const success = await updatePrompt(transcriptionPrompt.id, editedTranscription, user.email);
    if (success) onClose();
  };

  const handleSaveAnalysis = async () => {
    if (!analysisPrompt || !user?.email) return;
    const success = await updatePrompt(analysisPrompt.id, editedAnalysis, user.email);
    if (success) onClose();
  };

  const handleRestoreTranscription = () => {
    if (!transcriptionPrompt) return;
    setEditedTranscription(transcriptionPrompt.prompt_text);
    toast.info('Prompt restaurado');
  };

  const handleRestoreAnalysis = () => {
    if (!analysisPrompt) return;
    setEditedAnalysis(analysisPrompt.prompt_text);
    toast.info('Prompt restaurado');
  };

  const variables = ['account_name', 'objectives', 'platform', 'context'];

  const renderPreview = (promptText: string) => {
    return renderPromptVariables(promptText, {
      account_name: accountName || 'Nome da Conta',
      objectives: [objective],
      platform: platform === 'meta' ? 'Meta Ads' : 'Google Ads',
      context: accountContext || 'Contexto da conta...',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Prompts para {platform === 'meta' ? 'Meta Ads' : 'Google Ads'} - {objective}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transcription" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcription">Transcrição</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="transcription" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prompt de Transcrição</label>
              <Textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
                placeholder="Digite o prompt de transcrição..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Variáveis Disponíveis</label>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-xs">
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preview do Prompt Renderizado</label>
              <div className="bg-muted p-4 rounded-lg text-sm">
                {renderPreview(editedTranscription)}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleRestoreTranscription}>
                Restaurar Padrão
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSaveTranscription}>Salvar</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prompt de Análise</label>
              <Textarea
                value={editedAnalysis}
                onChange={(e) => setEditedAnalysis(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
                placeholder="Digite o prompt de análise..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Variáveis Disponíveis</label>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-xs">
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preview do Prompt Renderizado</label>
              <div className="bg-muted p-4 rounded-lg text-sm">
                {renderPreview(editedAnalysis)}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleRestoreAnalysis}>
                Restaurar Padrão
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSaveAnalysis}>Salvar</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
