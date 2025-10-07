import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { OptimizationContext } from "@/types/optimization";

interface AnalysisTextEditorModalProps {
  context: OptimizationContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function AnalysisTextEditorModal({
  context,
  open,
  onOpenChange,
  onSave,
}: AnalysisTextEditorModalProps) {
  const [editedSummary, setEditedSummary] = useState(context.summary);
  const [editedActions, setEditedActions] = useState(JSON.stringify(context.actions_taken, null, 2));
  const [editedMetrics, setEditedMetrics] = useState(JSON.stringify(context.metrics_mentioned, null, 2));
  const [editedStrategy, setEditedStrategy] = useState(JSON.stringify(context.strategy, null, 2));
  const [editedTimeline, setEditedTimeline] = useState(JSON.stringify(context.timeline, null, 2));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Parse JSON fields
      let actions, metrics, strategy, timeline;
      
      try {
        actions = JSON.parse(editedActions);
        metrics = JSON.parse(editedMetrics);
        strategy = JSON.parse(editedStrategy);
        timeline = JSON.parse(editedTimeline);
      } catch (parseError) {
        toast.error("Erro ao processar JSON. Verifique a formatação dos campos.");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('j_ads_optimization_context')
        .update({
          summary: editedSummary,
          actions_taken: actions,
          metrics_mentioned: metrics,
          strategy: strategy,
          timeline: timeline,
          revised_at: new Date().toISOString(),
        })
        .eq('id', context.id);

      if (error) throw error;

      toast.success("Extrato de otimização revisado salvo!");
      onSave();
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving revised analysis:', error);
      toast.error("Erro ao salvar revisão");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Extrato de Otimização</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edited-summary">Resumo Executivo</Label>
            <Textarea
              id="edited-summary"
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="min-h-[150px]"
              placeholder="Resumo executivo da otimização..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edited-actions">Ações Realizadas (JSON)</Label>
              <Textarea
                id="edited-actions"
                value={editedActions}
                onChange={(e) => setEditedActions(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder='[{"type": "pause_campaign", "target": "...", "reason": "..."}]'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edited-metrics">Métricas Mencionadas (JSON)</Label>
              <Textarea
                id="edited-metrics"
                value={editedMetrics}
                onChange={(e) => setEditedMetrics(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder='{"cpa": 200, "roas": 2.5, "ctr": 1.8}'
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edited-strategy">Estratégia (JSON)</Label>
              <Textarea
                id="edited-strategy"
                value={editedStrategy}
                onChange={(e) => setEditedStrategy(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder='{"type": "test", "duration_days": 7, ...}'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edited-timeline">Timeline (JSON)</Label>
              <Textarea
                id="edited-timeline"
                value={editedTimeline}
                onChange={(e) => setEditedTimeline(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder='{"reevaluate_date": "2025-01-15", "milestones": [...]}'
              />
            </div>
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
