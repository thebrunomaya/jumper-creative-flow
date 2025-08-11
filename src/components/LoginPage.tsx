
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import gradientImage from '@/assets/gradients/organic-02.png';

const LoginPage: React.FC = () => {
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
      const { error } = await login(email, password);
      
      if (!error) {
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a)!`,
        });
      } else {
        const message = error?.message?.toLowerCase().includes('invalid') 
          ? "E-mail ou senha incorretos"
          : "Não foi possível entrar. Tente novamente.";
        toast({
          title: "Credenciais inválidas",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Gradiente Puro */}
      <div 
        className="hidden lg:flex lg:w-1/2"
        style={{
          backgroundImage: `url(${gradientImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-black text-white">
        {/* Header - Logo no topo */}
        <div className="p-6 lg:p-8">
          <JumperLogo 
            size="sm" 
            theme="dark" 
            showText={true}
          />
        </div>

        {/* Centro - Formulário */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Logo para mobile */}
            <div className="lg:hidden text-center mb-8">
              <JumperLogo 
                size="lg" 
                theme="dark" 
                showText={true}
                className="mx-auto mb-4"
              />
            </div>

            {/* Título Ad Uploader */}
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Ad Uploader
              </h1>
            </div>

            {/* Formulário sem card */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Login
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-12 bg-card/10 border-border/20 text-white placeholder:text-white/60 focus:border-[#FA4721] transition-colors"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
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
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Rodapé - Tagline */}
        <div className="p-6 lg:p-8 text-center">
          <p className="text-white/60 text-sm">
            A sua agência de tráfego digital
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
