import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { JumperLogo } from '@/components/ui/jumper-logo';
import gradientImage from '@/assets/gradients-optimized/organic-02.png';
import { checkEmailWhitelist, type WhitelistCheckResult } from '@/utils/checkWhitelist';
import { setupTestManagers } from '@/utils/setupTestManagers';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'email' | 'password' | 'magic-link-sent' | 'first-access' | 'reset-password' | 'link-expired';

const LoginPageNew: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isNotionLoading, setIsNotionLoading] = useState(false);
  const [managerName, setManagerName] = useState('');
  const { toast } = useToast();
  const { login, loginWithMagicLink, loginWithNotion, resetPassword } = useAuth();

  // Verificar se é um fluxo de recovery ou erro ao carregar
  React.useEffect(() => {
    const hash = window.location.hash;
    
    // Verificar erros primeiro
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get('error');
      const errorCode = params.get('error_code');
      
      if (errorCode === 'otp_expired' || error === 'access_denied') {
        setAuthStep('link-expired');
        return;
      }
    }
    
    // Verificar recovery
    if (hash && hash.includes('type=recovery')) {
      setAuthStep('reset-password');
      // Extrair o access_token do hash para garantir autenticação
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        // O Supabase já deve ter processado o token
        console.log('Recovery mode activated with valid token');
      }
    }
  }, []);


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
            title: "Bem-vindo(a) ao Jumper Hub!",
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

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
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
        toast({
          title: "Senha definida com sucesso!",
          description: "Redirecionando para o sistema...",
        });
        
        // Limpar hash da URL e redirecionar
        window.location.href = window.location.origin;
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
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-screen bg-black text-white relative">
        {/* Header - Logo */}
        <div className="p-6 lg:p-8">
          {/* Mobile e Desktop: logo pequeno no canto superior esquerdo */}
          <JumperLogo
            size="sm"
            theme="dark"
            showText={true}
          />
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-white/40">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/30 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={async () => {
                    setIsNotionLoading(true);
                    const { error } = await loginWithNotion();
                    if (error) {
                      toast({
                        title: "Erro no login",
                        description: error.message || "Não foi possível conectar com Notion",
                        variant: "destructive"
                      });
                      setIsNotionLoading(false);
                    }
                    // Se sucesso, será redirecionado automaticamente
                  }}
                  disabled={isNotionLoading || isLoading}
                >
                  {isNotionLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                      </svg>
                      Entrar com Notion
                    </>
                  )}
                </Button>

                <p className="text-xs text-white/40 text-center">
                  Acesso via Notion para Staff Jumper
                </p>

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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Sua senha
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs text-white/60 hover:text-white"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { error } = await resetPassword(email);
                          if (!error) {
                            toast({
                              title: "E-mail enviado",
                              description: "Verifique sua caixa de entrada para criar ou redefinir sua senha.",
                            });
                          } else {
                            toast({
                              title: "Não foi possível enviar",
                              description: "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                    >
                      Criar/Redefinir senha
                    </Button>
                  </div>
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

            {/* Step: Reset Password */}
            {authStep === 'reset-password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-white">
                    Criar Nova Senha
                  </h2>
                  <p className="text-white/60 text-sm">
                    Defina uma senha segura para sua conta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Nova senha
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#FA4721] transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white font-medium">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite novamente sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#FA4721] transition-all"
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
            )}

            {/* Step: Link Expired */}
            {authStep === 'link-expired' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="bg-red-500/10 p-4 rounded-full">
                      <Lock className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white">
                    Link Expirado
                  </h2>
                  <p className="text-white/60 text-sm">
                    Este link de redefinição de senha expirou ou é inválido.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expired-email" className="text-white font-medium">
                    Digite seu e-mail para receber um novo link
                  </Label>
                  <Input
                    id="expired-email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#FA4721] transition-all"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!email.trim()) {
                      toast({
                        title: "Digite seu e-mail",
                        description: "O e-mail é obrigatório para enviar um novo link",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setIsLoading(true);
                    try {
                      const { error } = await resetPassword(email);
                      if (!error) {
                        toast({
                          title: "Novo link enviado!",
                          description: "Verifique seu e-mail para criar ou redefinir sua senha.",
                        });
                        setAuthStep('email');
                        // Limpar hash da URL
                        window.location.hash = '';
                      } else {
                        toast({
                          title: "Erro ao enviar link",
                          description: "Verifique o e-mail e tente novamente.",
                          variant: "destructive",
                        });
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full h-12 bg-[#FA4721] hover:bg-[#FA4721]/90 text-white font-semibold transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando novo link...
                    </>
                  ) : (
                    'Enviar novo link'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-white/60 hover:text-white"
                    onClick={() => {
                      setAuthStep('email');
                      window.location.hash = '';
                    }}
                  >
                    Voltar ao login
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