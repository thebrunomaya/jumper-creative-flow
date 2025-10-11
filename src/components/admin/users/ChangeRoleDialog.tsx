import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    nome: string | null;
    role: string;
  } | null;
  onConfirm: (userId: string, newRole: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const roleOptions = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Acesso total ao sistema (desenvolvedor)',
    color: 'text-orange-600',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Gestor Jumper - edição, publicação e otimizações',
    color: 'text-blue-600',
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Supervisor de agências parceiras',
    color: 'text-purple-600',
  },
  {
    value: 'gerente',
    label: 'Gerente',
    description: 'Gerente de marketing (cliente)',
    color: 'text-green-600',
  },
  {
    value: 'user',
    label: 'User',
    description: 'Usuário comum - apenas upload e visualização',
    color: 'text-gray-600',
  },
];

export const ChangeRoleDialog: React.FC<ChangeRoleDialogProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'user');
  const [reason, setReason] = useState<string>('');

  // Reset state when dialog opens with new user
  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setReason('');
    }
  }, [user]);

  if (!user) return null;

  const displayName = user.nome || user.email.split('@')[0];
  const isCreatingAdmin = selectedRole === 'admin' && user.role !== 'admin';
  const isDemotion = user.role === 'admin' && selectedRole !== 'admin';

  const handleConfirm = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    await onConfirm(user.id, selectedRole, reason || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alterar Permissão de {displayName}</DialogTitle>
          <DialogDescription>
            Role atual: <span className="font-semibold">{user.role}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning for sensitive operations */}
          {isCreatingAdmin && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Você está prestes a criar um novo administrador.
                Administradores têm acesso total ao sistema.
              </AlertDescription>
            </Alert>
          )}

          {isDemotion && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Você está removendo privilégios de administrador.
                Esta ação será registrada no histórico de auditoria.
              </AlertDescription>
            </Alert>
          )}

          {/* Role selection */}
          <div className="space-y-3">
            <Label>Selecione a nova role:</Label>
            <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedRole(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className={`font-semibold cursor-pointer ${option.color}`}
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da mudança (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Promovido para gestor de tráfego"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Esta informação será registrada no histórico de auditoria
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedRole === user.role}
          >
            {isLoading ? 'Salvando...' : 'Confirmar Alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
