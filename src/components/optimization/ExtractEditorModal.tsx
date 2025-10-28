/**
 * ExtractEditorModal - Edit Step 3 (Extrato da Otimização) with all actions
 * Allows manual editing, AI regeneration, and undo functionality
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
import { Save, RotateCw, Undo2, Loader2 } from "lucide-react";

interface ExtractEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  currentText: string;
  onSave: (newText: string) => Promise<void>;
  onRegenerate: () => void;
  hasUndo: boolean;
  onUndo: () => Promise<void>;
  editCount: number;
  lastEditedAt?: string;
  isRegenerating?: boolean; // Loading state from parent
}

export function ExtractEditorModal({
  open,
  onOpenChange,
  recordingId,
  currentText,
  onSave,
  onRegenerate,
  hasUndo,
  onUndo,
  editCount,
  lastEditedAt,
  isRegenerating = false,
}: ExtractEditorModalProps) {
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
    // Don't allow closing while regenerating
    if (isRegenerating) return;

    setEditedText(currentText);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleRegenerate = () => {
    // Parent will trigger AI regeneration
    // Modal stays open - will close when parent finishes
    onRegenerate();
  };

  const handleUndo = async () => {
    await onUndo();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Extrato da Otimização</DialogTitle>
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
            placeholder="• [VERBA] Descrição da ação&#10;• [CRIATIVOS] Descrição da ação&#10;• [CONJUNTOS] Descrição da ação&#10;• [COPY] Descrição da ação"
          />

          {/* Info text */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Formato:</strong> Uma ação por linha, começando com • e categoria entre colchetes
            </p>
            <p>
              <strong>Categorias disponíveis:</strong> [VERBA], [CRIATIVOS], [CONJUNTOS], [COPY], [OBSERVAÇÃO]
            </p>
            <p>
              <strong>Exemplo:</strong> • [VERBA] Aumentado budget em 30% (R$500 → R$650)
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2 justify-between">
          {/* Left side: Primary actions */}
          <div className="flex flex-wrap gap-2">
            <JumperButton
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || isRegenerating}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Edição Manual
            </JumperButton>

            <JumperButton
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recriando com IA...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Recriar com IA
                </>
              )}
            </JumperButton>
          </div>

          {/* Right side: Secondary actions */}
          <div className="flex gap-2">
            {hasUndo && (
              <JumperButton
                variant="ghost"
                onClick={handleUndo}
                disabled={isRegenerating}
                title="Restaurar versão anterior"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Desfazer
              </JumperButton>
            )}

            <JumperButton variant="ghost" onClick={handleCancel} disabled={isRegenerating}>
              Cancelar
            </JumperButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
