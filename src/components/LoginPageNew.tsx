import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import gradientImage from '@/assets/gradients/organic-02.png';
import { checkEmailWhitelist, type WhitelistCheckResult } from '@/utils/checkWhitelist';
import { setupTestManagers } from '@/utils/setupTestManagers';

type AuthStep = 'email' | 'password' | 'magic-link-sent' | 'first-access';

const LoginPageNew: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [managerName, setManagerName] = useState('');
  const { toast } = useToast();
  const { login, loginWithMagicLink } = useAuth();


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Digite seu email",
        description: "O email é obrigatório para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se email está autorizado e se já tem conta
      const whitelistData = await checkEmailWhitelist(email);

      if (!whitelistData.authorized) {
        toast({
          title: "Acesso não autorizado",
          description: "Seu email não está autorizado. Entre em contato com seu gestor.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setManagerName(whitelistData.managerName || '');

      if (whitelistData.isFirstAccess) {
        // Primeiro acesso - enviar link mágico automaticamente
        setAuthStep('first-access');
        
        const { error } = await loginWithMagicLink(email);
        
        if (!error) {
          setAuthStep('magic-link-sent');
          toast({
            title: "Bem-vindo(a) ao Ad Uploader!",
            description: "Enviamos um link de acesso para seu email. É seu primeiro acesso!",
          });
        } else {
          toast({
            title: "Erro ao enviar link",
            description: "Não foi possível enviar o link. Tente novamente.",
            variant: "destructive",
          });
          setAuthStep('email');
        }
      } else {
        // Já tem conta - pedir senha
        setAuthStep('password');
        toast({
          title: `Olá, ${whitelistData.managerName}!`,
          description: "Digite sua senha para continuar",
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Digite sua senha",
        description: "A senha é obrigatória para entrar",
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
          description: `Bem-vindo(a) de volta, ${managerName}!`,
        });
      } else {
        const msg = error?.message?.toLowerCase() || '';
        const message = msg.includes('invalid') || msg.includes('password')
          ? "Senha incorreta"
          : "Não foi possível fazer login. Tente novamente.";
        toast({
          title: "Erro no login",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
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
    setIsLoading(true);
    try {
      const { error } = await loginWithMagicLink(email);
      if (!error) {
        setAuthStep('magic-link-sent');
        toast({
          title: "Link enviado!",
          description: "Verifique seu email para entrar.",
        });
      } else {
        toast({
          title: "Erro ao enviar link",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setAuthStep('email');
    setPassword('');
    setManagerName('');
  };

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
        {/* Header - Logo */}
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
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <JumperLogo 
                size="lg" 
                theme="dark" 
                showText={true}
                className="mx-auto mb-4"
              />
            </div>

            {/* Título */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Ad Uploader
              </h1>
              <p className="text-white/60 text-sm">
                Plataforma exclusiva para gerentes autorizados
              </p>
            </div>

            {/* Step: Email */}
            {authStep === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Seu email corporativo
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.nome@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#FA4721] transition-all"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#FA4721] hover:bg-[#FA4721]/90 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-white/40 text-center">
                  Apenas emails autorizados no sistema Notion têm acesso
                </p>

                {/* Botão temporário para adicionar managers de teste */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-white/40 hover:text-white/60 text-xs"
                      onClick={async () => {
                        const success = await setupTestManagers();
                        toast({
                          title: success ? "Managers de teste adicionados" : "Erro ao adicionar managers",
                          description: success ? "Use: gerente.teste@empresa.com" : "Verifique o console",
                          variant: success ? "default" : "destructive"
                        });
                      }}
                    >
                      [DEV] Adicionar managers de teste
                    </Button>
                  </div>
                )}
              </form>
            )}

            {/* Step: Password */}
            {authStep === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-white/60 text-sm">Bem-vindo(a) de volta</p>
                  <p className="text-white font-medium">{email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sua senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#FA4721] transition-all"
                    autoFocus
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
                    'Entrar'
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-white/60 hover:text-white text-sm"
                    onClick={resetFlow}
                  >
                    Usar outro email
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-white/60 hover:text-white text-sm"
                    onClick={handleMagicLink}
                    disabled={isLoading}
                  >
                    Entrar sem senha
                  </Button>
                </div>
              </form>
            )}

            {/* Step: First Access */}
            {authStep === 'first-access' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="bg-[#FA4721]/10 p-4 rounded-full">
                    <Sparkles className="h-8 w-8 text-[#FA4721]" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">
                    Primeiro acesso detectado!
                  </h2>
                  <p className="text-white/60">
                    Enviando link de acesso para:
                  </p>
                  <p className="text-white font-medium">{email}</p>
                </div>

                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FA4721]" />
                </div>
              </div>
            )}

            {/* Step: Magic Link Sent */}
            {authStep === 'magic-link-sent' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="bg-green-500/10 p-4 rounded-full">
                    <Mail className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">
                    Verifique seu email!
                  </h2>
                  <p className="text-white/60">
                    Enviamos um link de acesso para:
                  </p>
                  <p className="text-white font-medium">{email}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-white/40">
                    Clique no link no email para entrar automaticamente
                  </p>
                  
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={resetFlow}
                  >
                    Tentar com outro email
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-6 lg:p-8 text-center">
          <p className="text-white/60 text-sm">
            A sua agência de tráfego digital
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPageNew;