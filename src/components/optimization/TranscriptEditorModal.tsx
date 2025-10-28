/**
 * TranscriptEditorModal - Edit Step 1 (Transcrição) with all actions
 * Provides full editing capabilities: manual edit, AI improvements, recreate, undo, view AI changes
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { JumperButton } from "@/components/ui/jumper-button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Sparkles, RotateCw, Undo2, Bot, Loader2 } from "lucide-react";

interface TranscriptEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  currentText: string;
  originalText: string; // For "Ver Mudanças IA"
  onSave: (editedText: string) => Promise<void>;
  onAIImprove: () => void;
  onRetranscribe: () => void;
  hasUndo: boolean;
  onUndo: () => Promise<void>;
  onViewEnhancement: () => void;
  editCount: number;
  lastEditedAt?: string;
  isRetranscribing?: boolean; // Loading state from parent
}

export function TranscriptEditorModal({
  open,
  onOpenChange,
  recordingId,
  currentText,
  originalText,
  onSave,
  onAIImprove,
  onRetranscribe,
  hasUndo,
  onUndo,
  onViewEnhancement,
  editCount,
  lastEditedAt,
  isRetranscribing = false,
}: TranscriptEditorModalProps) {
  const [editedText, setEditedText] = useState(currentText);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with external changes (only when currentText prop changes, not when modal opens/closes)
  useEffect(() => {
    setEditedText(currentText);
    setHasChanges(false);
  }, [currentText]);

  // Track changes
  useEffect(() => {
    setHasChanges(editedText !== currentText);
  }, [editedText, currentText]);

  const handleSave = async () => {
    await onSave(editedText);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Don't allow closing while retranscribing
    if (isRetranscribing) return;

    setEditedText(currentText);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleAIImprove = () => {
    // Parent will open AI improvements modal
    onAIImprove();
    onOpenChange(false);
  };

  const handleRetranscribe = () => {
    // Parent will trigger retranscription
    // Modal stays open - will close when parent finishes
    onRetranscribe();
  };

  const handleUndo = async () => {
    await onUndo();
    onOpenChange(false);
  };

  const handleViewEnhancement = () => {
    // Parent will open enhancement diff modal
    onViewEnhancement();
    // Don't close this modal - let user compare
  };

  // Check if enhancement exists (original_text different from current)
  const hasEnhancement = originalText && originalText !== currentText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transcrição</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Edit count badge */}
          {editCount > 0 && (
            <Badge variant="secondary" className="mb-2">
              Editado {editCount}x
              {lastEditedAt && (
                <span className="ml-2 text-xs opacity-70">
                  • {new Date(lastEditedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </Badge>
          )}

          {/* Text Editor */}
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Transcrição do áudio..."
          />

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Edite o texto livremente. A formatação automática já adicionou pontuação e parágrafos.
          </p>
        </div>

        <DialogFooter className="flex flex-wrap gap-2 justify-between">
          {/* Left side: Primary actions */}
          <div className="flex flex-wrap gap-2">
            <JumperButton
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || isRetranscribing}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Edição Manual
            </JumperButton>

            <JumperButton
              variant="outline"
              onClick={handleAIImprove}
              disabled={isRetranscribing}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ajustar com IA
            </JumperButton>

            <JumperButton
              variant="outline"
              onClick={handleRetranscribe}
              disabled={isRetranscribing}
            >
              {isRetranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recriando com Whisper...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Recriar
                </>
              )}
            </JumperButton>
          </div>

          {/* Right side: Secondary actions */}
          <div className="flex gap-2">
            {hasEnhancement && (
              <JumperButton
                variant="outline"
                onClick={handleViewEnhancement}
                disabled={isRetranscribing}
                title="Ver o que a IA corrigiu automaticamente"
              >
                <Bot className="mr-2 h-4 w-4" />
                Ver Mudanças IA
              </JumperButton>
            )}

            {hasUndo && (
              <JumperButton
                variant="ghost"
                onClick={handleUndo}
                disabled={isRetranscribing}
                title="Restaurar versão anterior"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Desfazer
              </JumperButton>
            )}

            <JumperButton variant="ghost" onClick={handleCancel} disabled={isRetranscribing}>
              Cancelar
            </JumperButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
