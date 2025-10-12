/**
 * ReprocessConfirmModal - Confirmation dialog before re-processing organized bullets
 * Shows what will happen and optionally shows preview before applying
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JumperButton } from "@/components/ui/jumper-button";
import { AlertCircle, RotateCw, X } from "lucide-react";

interface ReprocessConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isProcessing?: boolean;
}

export function ReprocessConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: ReprocessConfirmModalProps) {
  async function handleConfirm() {
    await onConfirm();
    onClose();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            Reprocessar Bullets com IA?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Isso irá chamar o Claude novamente com a transcrição original e substituir
              os bullets organizados completamente.
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p className="font-medium text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                O que acontecerá:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>✓ A versão anterior será salva como backup</li>
                <li>✓ Novo processamento com IA será gerado</li>
                <li>✓ Você poderá desfazer se necessário</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <JumperButton
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </JumperButton>
          <JumperButton
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            {isProcessing ? 'Reprocessando...' : 'Reprocessar'}
          </JumperButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
