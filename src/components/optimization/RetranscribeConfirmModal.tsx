import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface RetranscribeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RetranscribeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: RetranscribeConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Re-gerar Transcrição?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Isso irá chamar o Whisper novamente com o áudio original e substituir
              a transcrição atual completamente.
            </p>
            <p className="font-medium text-foreground">
              ✓ A versão anterior será salva como backup
            </p>
            <p className="text-xs text-muted-foreground">
              Você poderá usar "Desfazer" para restaurar a versão anterior se necessário.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Re-gerando...
              </>
            ) : (
              'Confirmar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
