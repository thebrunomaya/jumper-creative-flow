
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import gradientImage from '@/assets/gradients-optimized/organic-02.png';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  
  const { login, signup, loginWithMagicLink, resetPassword } = useAuth();

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
      const { error } = mode === 'login'
        ? await login(email, password)
        : await signup(email, password);
      
      if (!error) {
        toast({
          title: mode === 'login' ? "Login realizado com sucesso" : "Conta criada com sucesso",
          description: mode === 'login' ? `Bem-vindo(a)!` : 'Verifique seu e-mail para confirmar o cadastro.',
        });
      } else {
        const msg = error?.message?.toLowerCase() || '';
        const message = msg.includes('invalid') || msg.includes('password')
          ? "E-mail ou senha incorretos"
          : "Não foi possível processar. Tente novamente.";
        toast({
          title: "Ops!",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro na autenticação",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast({ title: "Informe seu e-mail", description: "Digite seu e-mail para receber o link mágico.", variant: "destructive" });
      return;
    }
    setIsMagicLoading(true);
    try {
      const { error } = await loginWithMagicLink(email);
      if (!error) {
        toast({ title: "Link enviado", description: "Verifique seu e-mail para entrar com 1 clique." });
      } else {
        toast({ title: "Não foi possível enviar o link", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsMagicLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast({ title: "Informe seu e-mail", description: "Digite seu e-mail para resetar a senha.", variant: "destructive" });
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await resetPassword(email);
      if (!error) {
        toast({ title: "E-mail enviado", description: "Confira sua caixa de entrada para redefinir a senha." });
      } else {
        toast({ title: "Não foi possível enviar", description: "Tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsResetting(false);
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
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-black text-white relative">
        {/* Header - Logo */}
        <div className="p-6 lg:p-8">
          {/* Mobile: logo pequeno no canto superior direito */}
          <div className="lg:hidden flex justify-end">
            <JumperLogo
              size="sm"
              theme="dark"
              showText={true}
            />
          </div>

          {/* Desktop: logo padrão no canto superior esquerdo */}
          <div className="hidden lg:block">
            <JumperLogo
              size="sm"
              theme="dark"
              showText={true}
            />
          </div>
        </div>

        {/* Centro - Formulário */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Título */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                <span className="lg:hidden">Hub</span>
                <span className="hidden lg:inline">Jumper Hub</span>
              </h1>
              <p className="text-xs text-white/40">v2.0</p>
            </div>

            {/* Formulário sem card */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} className={`h-10 ${mode !== 'login' ? 'dark-bg-button-outline' : ''}`} onClick={() => setMode('login')}>Entrar</Button>
                <Button type="button" variant={mode === 'signup' ? 'default' : 'outline'} className={`h-10 ${mode !== 'signup' ? 'dark-bg-button-outline' : ''}`} onClick={() => setMode('signup')}>Criar conta</Button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
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
                    {mode === 'login' ? 'Entrando...' : 'Criando...'}
                  </>
                ) : (
                  mode === 'login' ? 'Entrar' : 'Criar conta'
                )}
              </Button>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-white/80 hover:text-white"
                  onClick={handleMagicLink}
                  disabled={isMagicLoading}
                >
                  {isMagicLoading ? 'Enviando link...' : 'Entrar com link mágico'}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-white/60 hover:text-white"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? 'Enviando...' : 'Esqueci minha senha'}
                </Button>
              </div>

              <p className="text-xs text-white/50">
                Aviso: senhas do Notion não funcionam aqui. Use sua senha do Jumper Hub.
              </p>
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
