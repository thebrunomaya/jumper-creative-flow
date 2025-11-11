import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save, Undo2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MarkdownEditorProps {
  deckId: string;
  initialMarkdown: string;
  onRegenerate: (newMarkdown: string) => Promise<void>;
  disabled?: boolean;
}

const DRAFT_KEY_PREFIX = "deck-markdown-draft-";
const MAX_MARKDOWN_LENGTH = 15000; // Reasonable limit for Claude context

export function MarkdownEditor({
  deckId,
  initialMarkdown,
  onRegenerate,
  disabled = false,
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${deckId}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft && savedDraft !== initialMarkdown) {
      const confirmRestore = window.confirm(
        "Encontramos um rascunho salvo automaticamente. Deseja restaurá-lo?"
      );
      if (confirmRestore) {
        setMarkdown(savedDraft);
        setHasChanges(true);
        toast.info("Rascunho restaurado com sucesso!");
      } else {
        localStorage.removeItem(draftKey);
      }
    }
  }, [deckId, draftKey, initialMarkdown]);

  // Auto-save to localStorage
  useEffect(() => {
    if (markdown !== initialMarkdown) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(draftKey, markdown);
        setLastSaved(new Date());
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [markdown, initialMarkdown, draftKey]);

  // Detect changes
  useEffect(() => {
    setHasChanges(markdown !== initialMarkdown);
  }, [markdown, initialMarkdown]);

  const handleRegenerate = async () => {
    if (markdown.trim().length === 0) {
      toast.error("O markdown não pode estar vazio.");
      return;
    }

    if (markdown.length > MAX_MARKDOWN_LENGTH) {
      toast.error(`O markdown excede o limite de ${MAX_MARKDOWN_LENGTH} caracteres.`);
      return;
    }

    setIsGenerating(true);
    try {
      await onRegenerate(markdown);

      // Clear draft after successful regeneration
      localStorage.removeItem(draftKey);
      setHasChanges(false);

      toast.success("Deck regenerado com sucesso!", {
        description: "Uma nova versão foi criada.",
      });
    } catch (error) {
      console.error("Error regenerating deck:", error);
      toast.error("Erro ao regenerar deck", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Deseja reverter para o markdown original? As alterações não salvas serão perdidas."
    );
    if (confirmReset) {
      setMarkdown(initialMarkdown);
      localStorage.removeItem(draftKey);
      toast.info("Markdown revertido para o original.");
    }
  };

  const characterCount = markdown.length;
  const isNearLimit = characterCount > MAX_MARKDOWN_LENGTH * 0.9;
  const isOverLimit = characterCount > MAX_MARKDOWN_LENGTH;

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Edite o markdown abaixo e clique em <strong>Recriar Deck</strong> para gerar uma nova versão.
          As alterações são salvas automaticamente como rascunho.
        </AlertDescription>
      </Alert>

      {/* Markdown Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="markdown-editor" className="text-base font-semibold">
            Markdown Source
          </Label>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                Salvo às {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <span className={`font-mono ${isOverLimit ? "text-destructive font-bold" : isNearLimit ? "text-warning" : ""}`}>
              {characterCount.toLocaleString()} / {MAX_MARKDOWN_LENGTH.toLocaleString()}
            </span>
          </div>
        </div>

        <Textarea
          id="markdown-editor"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          disabled={disabled || isGenerating}
          className="min-h-[500px] font-mono text-sm"
          placeholder="# Título do Deck

## Slide 1
Conteúdo do slide...

## Slide 2
Mais conteúdo..."
        />

        {isOverLimit && (
          <p className="text-sm text-destructive">
            ⚠️ O markdown excede o limite máximo. Reduza o tamanho antes de regenerar.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isGenerating || disabled}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Reverter Original
        </Button>

        <Button
          onClick={handleRegenerate}
          disabled={isGenerating || disabled || isOverLimit}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Nova Versão...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recriar Deck
            </>
          )}
        </Button>
      </div>

      {/* Change indicator */}
      {hasChanges && !isGenerating && (
        <p className="text-sm text-muted-foreground text-center">
          ⚠️ Você tem alterações não salvas. Clique em "Recriar Deck" para gerar uma nova versão.
        </p>
      )}
    </div>
  );
}
