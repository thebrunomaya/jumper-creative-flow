
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useManagers } from '@/hooks/useManagers';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import gradientImage from '@/assets/gradients/organic-02.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { managers, loading: managersLoading, validateLogin } = useManagers();
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
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authenticatedUser = validateLogin(email, password);
      
      if (authenticatedUser) {
        login(authenticatedUser);
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a), ${authenticatedUser.name}!`,
        });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "E-mail ou senha incorretos",
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

  if (managersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2 text-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Seção Visual com Logo */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-black">
        {/* Gradiente como overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${gradientImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Conteúdo centrado */}
        <div className="relative flex flex-col items-center justify-center w-full px-12">
          <JumperLogo 
            size="lg" 
            theme="dark" 
            showText={true}
            className="mb-8"
          />
          <p className="text-white/80 text-xl font-light text-center max-w-md">
            A sua agência de tráfego digital
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo para mobile */}
          <div className="lg:hidden text-center mb-8">
            <JumperLogo 
              size="lg" 
              theme="auto" 
              showText={true}
              className="mx-auto mb-4"
            />
          </div>

          {/* Header do Formulário */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Sistema de Criativos
            </h1>
            <p className="text-muted-foreground">
              Faça login para acessar o sistema
            </p>
          </div>

          {/* Formulário */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 border-border/50 focus:border-primary transition-colors"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
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
                    className="h-12 border-border/50 focus:border-primary transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#FA4721] hover:bg-[#FA4721]/90 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Entrar no Sistema
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
