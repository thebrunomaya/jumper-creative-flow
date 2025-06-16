
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useManagers } from '@/hooks/useManagers';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { managers, loading: managersLoading, validateLogin } = useManagers();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha usuário e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authenticatedUser = validateLogin(username, password);
      
      if (authenticatedUser) {
        login(authenticatedUser);
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a), ${authenticatedUser.name}!`,
        });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos",
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
      <div className="min-h-screen bg-jumper-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jumper-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-jumper rounded-full flex items-center justify-center">
            <LogIn className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Criativos</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário ou email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-jumper hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Credenciais de teste:</p>
            <p className="font-mono">Usuário: teste | Senha: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
