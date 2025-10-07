/**
 * UnifiedOptimizationEditorModal - Modal unificado para editar e regenerar análise de otimização
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OptimizationContext } from "@/types/optimization";

interface UnifiedOptimizationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: OptimizationContext;
  recordingId: string;
  onSaveSuccess: () => void;
}

const AI_MODELS = [
  { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (Padrão)" },
  { value: "gpt-5-2025-08-07", label: "GPT-5 (Mais Avançado)" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4 (Mais Inteligente)" },
] as const;

export function UnifiedOptimizationEditorModal({
  isOpen,
  onClose,
  context,
  recordingId,
  onSaveSuccess,
}: UnifiedOptimizationEditorModalProps) {
  // Estado para edição de texto
  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState("");
  const [metrics, setMetrics] = useState("");
  const [strategy, setStrategy] = useState("");
  const [timeline, setTimeline] = useState("");

  // Estado para IA
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4.1-2025-04-14");
  const [aiInstruction, setAiInstruction] = useState("");

  // Estados de controle
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);

  // Função auxiliar para converter array/objeto em texto com bullets
  const formatAsText = (data: any): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === "string") return `• ${item}`;
        if (typeof item === "object") {
          const entries = Object.entries(item).filter(([key]) => key !== "id");
          return `• ${entries.map(([key, val]) => `${key}: ${val}`).join(", ")}`;
        }
        return `• ${item}`;
      }).join("\n");
    }
    if (typeof data === "object") {
      return Object.entries(data)
        .filter(([key]) => key !== "id")
        .map(([key, val]) => `• ${key}: ${val}`)
        .join("\n");
    }
    return String(data);
  };

  // Inicializar campos quando o modal abre ou context muda
  useEffect(() => {
    if (isOpen && context) {
      setSummary(context.summary || "");
      setActions(formatAsText(context.actions_taken));
      setMetrics(formatAsText(context.metrics_mentioned));
      setStrategy(formatAsText(context.strategy));
      setTimeline(formatAsText(context.timeline));
      setAiInstruction("");
    }
  }, [isOpen, context]);

  // Função para aplicar IA
  const handleApplyAI = async () => {
    setIsApplyingAI(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "j_ads_analyze_optimization",
        {
          body: {
            recording_id: recordingId,
            model: selectedModel,
            correction_prompt: aiInstruction.trim(),
          },
        }
      );

      if (functionError) throw functionError;

      // Atualizar os campos de texto com o conteúdo regenerado
      if (data?.context) {
        setSummary(data.context.summary || "");
        setActions(formatAsText(data.context.actions_taken));
        setMetrics(formatAsText(data.context.metrics_mentioned));
        setStrategy(formatAsText(data.context.strategy));
        setTimeline(formatAsText(data.context.timeline));
        setAiInstruction("");
        
        toast.success("Análise regenerada! Revise e salve quando estiver pronto.");
      }
    } catch (err: any) {
      console.error("AI application error:", err);
      toast.error(err.message || "Erro ao aplicar IA");
    } finally {
      setIsApplyingAI(false);
    }
  };

  // Função para salvar edições
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const userEmail = (await supabase.auth.getUser()).data.user?.email;

      // Converter texto de volta para estruturas apropriadas
      const parseTextToArray = (text: string) => {
        return text
          .split("\n")
          .filter(line => line.trim())
          .map(line => line.replace(/^•\s*/, "").trim());
      };

      const { error: updateError } = await supabase
        .from("j_ads_optimization_context")
        .update({
          summary: summary.trim(),
          actions_taken: parseTextToArray(actions),
          metrics_mentioned: parseTextToArray(metrics),
          strategy: parseTextToArray(strategy),
          timeline: parseTextToArray(timeline),
          revised_at: new Date().toISOString(),
          revised_by: userEmail || 'unknown',
        })
        .eq("id", context.id);

      if (updateError) throw updateError;

      toast.success("Análise atualizada com sucesso!");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Erro ao salvar análise");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Extrato de Otimização</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="summary">Resumo</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Resumo da otimização..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actions">Ações Tomadas</Label>
            <Textarea
              id="actions"
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
              placeholder="• Ação 1&#10;• Ação 2&#10;• Ação 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metrics">Métricas Mencionadas</Label>
            <Textarea
              id="metrics"
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              rows={4}
              className="resize-none font-mono text-sm"
              placeholder="• Métrica 1&#10;• Métrica 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Estratégia</Label>
            <Textarea
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              rows={4}
              className="resize-none font-mono text-sm"
              placeholder="• Ponto estratégico 1&#10;• Ponto estratégico 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Textarea
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              rows={3}
              className="resize-none font-mono text-sm"
              placeholder="• Marco 1&#10;• Marco 2"
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label>Regenerar com IA (Opcional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-sm">Modelo de IA</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-instruction" className="text-sm">Instrução para IA (Opcional)</Label>
              <Textarea
                id="ai-instruction"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Ex: Seja mais específico nas ações tomadas. Dê ênfase às métricas de ROI..."
                rows={3}
                className="resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleApplyAI();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para regeneração completa ou adicione instruções específicas
              </p>
            </div>

            <Button
              onClick={handleApplyAI}
              disabled={isApplyingAI}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {isApplyingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Aplicar IA
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving || isApplyingAI}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isApplyingAI}>
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
