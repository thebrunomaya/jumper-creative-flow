import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ManagerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManagerLoginModal: React.FC<ManagerLoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha e-mail e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('notion-login', {
        body: { email, password }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        toast({
          title: "Erro no login",
          description: data.error || "Credenciais inválidas",
          variant: "destructive",
        });
        return;
      }

      // Login successful
      login(data.manager);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${data.manager.name}!`,
      });
      
      // Clear form and close modal
      setEmail('');
      setPassword('');
      onClose();

    } catch (error) {
      console.error('Manager login error:', error);
      toast({
        title: "Erro no login",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-jumper rounded-full flex items-center justify-center">
            <UserCog className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">Login de Gestor</DialogTitle>
          <DialogDescription className="text-center">
            Acesse o sistema com suas credenciais do Notion
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager-email">E-mail</Label>
            <Input
              id="manager-email"
              type="email"
              placeholder="Digite seu e-mail do Notion"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manager-password">Senha</Label>
            <Input
              id="manager-password"
              type="password"
              placeholder="Digite sua senha do Notion"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-jumper hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerLoginModal;