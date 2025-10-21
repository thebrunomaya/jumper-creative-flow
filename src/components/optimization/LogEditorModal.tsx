/**
 * LogEditorModal - Edit Step 2 (Log da Otimização) in Markdown format
 * Provides full editing capabilities: manual edit, AI improvements, recreate, undo
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
import { Save, Sparkles, RotateCw, Undo2 } from "lucide-react";

interface LogEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  currentText: string;
  onSave: (editedText: string) => Promise<void>;
  onAIImprove: () => void;
  onReprocess: () => void;
  onUndo: () => Promise<void>;
  hasUndo: boolean;
  editCount: number;
  lastEditedAt?: string;
}

export function LogEditorModal({
  open,
  onOpenChange,
  recordingId,
  currentText,
  onSave,
  onAIImprove,
  onReprocess,
  onUndo,
  hasUndo,
  editCount,
  lastEditedAt,
}: LogEditorModalProps) {
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
    setEditedText(currentText);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleAIImprove = () => {
    // Parent will open AI improvements modal
    onAIImprove();
    onOpenChange(false);
  };

  const handleReprocess = () => {
    // Parent will open reprocess confirm modal
    onReprocess();
    onOpenChange(false);
  };

  const handleUndo = async () => {
    await onUndo();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Log da Otimização</DialogTitle>
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

          {/* Markdown Editor */}
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder="Log da otimização em Markdown..."
          />

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Use Markdown para formatação: **negrito**, emojis, bullets (•), títulos (##)
          </p>
        </div>

        <DialogFooter className="flex flex-wrap gap-2 justify-between">
          {/* Left side: Primary actions */}
          <div className="flex flex-wrap gap-2">
            <JumperButton
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Edição Manual
            </JumperButton>

            <JumperButton
              variant="outline"
              onClick={handleAIImprove}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ajustar com IA
            </JumperButton>

            <JumperButton
              variant="outline"
              onClick={handleReprocess}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Recriar
            </JumperButton>
          </div>

          {/* Right side: Secondary actions */}
          <div className="flex gap-2">
            {hasUndo && (
              <JumperButton
                variant="ghost"
                onClick={handleUndo}
                title="Restaurar versão anterior"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Desfazer
              </JumperButton>
            )}

            <JumperButton variant="ghost" onClick={handleCancel}>
              Cancelar
            </JumperButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
