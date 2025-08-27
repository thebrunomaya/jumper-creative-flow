import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import gradientImage from '@/assets/gradients-optimized/organic-02.png';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há um hash de reset na URL
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a senha e confirmação",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (!error) {
        setIsSuccess(true);
        toast({
          title: "Senha definida com sucesso!",
          description: "Você será redirecionado para o sistema",
        });
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast({
          title: "Erro ao definir senha",
          description: "Tente novamente ou use o Magic Link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        {/* Lado Esquerdo - Gradiente */}
        <div 
          className="hidden lg:flex lg:w-1/2"
          style={{
            backgroundImage: `url(${gradientImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Lado Direito - Sucesso */}
        <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-black text-white">
          <div className="p-6 lg:p-8">
            <JumperLogo 
              size="sm" 
              theme="dark" 
              showText={true}
            />
          </div>

          <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
            <div className="w-full max-w-sm space-y-8 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Senha definida com sucesso!
                </h1>
                <p className="text-white/60">
                  Você será redirecionado automaticamente
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 text-center">
            <p className="text-white/60 text-sm">
              A sua agência de tráfego digital
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Gradiente */}
      <div 
        className="hidden lg:flex lg:w-1/2"
        style={{
          backgroundImage: `url(${gradientImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Lado Direito - Formulário */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-black text-white">
        <div className="p-6 lg:p-8">
          <JumperLogo 
            size="sm" 
            theme="dark" 
            showText={true}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="lg:hidden text-center mb-8">
              <JumperLogo 
                size="lg" 
                theme="dark" 
                showText={true}
                className="mx-auto mb-4"
              />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Criar Nova Senha
              </h1>
              <p className="text-white/60 text-sm">
                Defina uma senha segura para sua conta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Nova senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-12 bg-card/10 border-border/20 text-white placeholder:text-white/60 focus:border-[#FA4721] transition-colors"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite novamente sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-12 bg-card/10 border-border/20 text-white placeholder:text-white/60 focus:border-[#FA4721] transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#FA4721] hover:bg-[#FA4721]/90 text-white font-semibold transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Definindo senha...
                  </>
                ) : (
                  'Definir senha'
                )}
              </Button>

              <p className="text-xs text-white/50 text-center">
                Mínimo de 6 caracteres. Use uma senha forte e única.
              </p>
            </form>
          </div>
        </div>

        <div className="p-6 lg:p-8 text-center">
          <p className="text-white/60 text-sm">
            A sua agência de tráfego digital
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;