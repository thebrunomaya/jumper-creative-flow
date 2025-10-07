/**
 * UnifiedOptimizationEditorModal - Modal unificado para editar e regenerar análise de otimização
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  // Estado para regeneração
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4.1-2025-04-14");
  const [correctionPrompt, setCorrectionPrompt] = useState("");

  // Estados de controle
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("edit");

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
      setCorrectionPrompt("");
      setError(null);
    }
  }, [isOpen, context]);

  // Função para salvar edições manuais
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
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
        })
        .eq("id", context.id);

      if (updateError) throw updateError;

      toast.success("Análise atualizada com sucesso!");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMessage = err.message || "Erro ao salvar análise";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para regenerar com IA
  const handleRegenerate = async () => {
    if (!selectedModel) {
      toast.error("Por favor, selecione um modelo de IA");
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "j_ads_analyze_optimization",
        {
          body: {
            recording_id: recordingId,
            model: selectedModel,
            correction_prompt: correctionPrompt.trim() || undefined,
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
        
        toast.success("Análise regenerada! Revise o conteúdo na aba 'Editar Texto' e salve quando estiver pronto.");
        setActiveTab("edit"); // Volta para aba de edição
      }
    } catch (err: any) {
      console.error("Regeneration error:", err);
      const errorMessage = err.message || "Erro ao regenerar análise";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Editar Extrato de Otimização
          </DialogTitle>
          <DialogDescription>
            Edite o texto diretamente ou regenere com IA
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">📝 Editar Texto</TabsTrigger>
            <TabsTrigger value="regenerate">🤖 Regenerar</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Resumo
              </label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Resumo da otimização..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Ações Tomadas
              </label>
              <Textarea
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                rows={6}
                className="resize-none font-mono text-sm"
                placeholder="• Ação 1&#10;• Ação 2&#10;• Ação 3"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Métricas Mencionadas
              </label>
              <Textarea
                value={metrics}
                onChange={(e) => setMetrics(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
                placeholder="• Métrica 1&#10;• Métrica 2"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Estratégia
              </label>
              <Textarea
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                rows={4}
                className="resize-none font-mono text-sm"
                placeholder="• Ponto estratégico 1&#10;• Ponto estratégico 2"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Timeline
              </label>
              <Textarea
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                rows={3}
                className="resize-none font-mono text-sm"
                placeholder="• Marco 1&#10;• Marco 2"
              />
            </div>
          </TabsContent>

          <TabsContent value="regenerate" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Modelo de IA *
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
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

            <div>
              <label className="text-sm font-medium mb-2 block">
                Prompt Corretivo (Opcional)
              </label>
              <Textarea
                placeholder="Exemplo: Dê mais ênfase às métricas de conversão. Analise melhor a estratégia de segmentação..."
                value={correctionPrompt}
                onChange={(e) => setCorrectionPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use este campo para dar instruções específicas sobre como a IA deve melhorar a análise.
              </p>
            </div>

            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || !selectedModel}
              className="w-full"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerar Análise
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              💡 Após regenerar, o conteúdo será atualizado na aba "Editar Texto" para você revisar antes de salvar.
            </p>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isRegenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isRegenerating}
          >
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
