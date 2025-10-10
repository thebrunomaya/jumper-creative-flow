/**
 * SharedOptimization Page
 * Public page for viewing shared optimization recordings
 * Requires password authentication
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { JumperButton } from '@/components/ui/jumper-button';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OptimizationContextCard } from '@/components/OptimizationContextCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Lock,
  Loader2,
  Calendar,
  User,
  FileText,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface OptimizationData {
  recording: {
    id: string;
    account_name: string;
    recorded_at: string;
    recorded_by: string;
    objectives: string[];
    platforms: string[];
  };
  context: {
    summary: string;
    actions_taken: any[];
    metrics_mentioned: Record<string, any>;
    strategy: any;
    timeline: any;
    confidence_level: string;
  } | null;
}

export default function SharedOptimization() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<OptimizationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Digite a senha');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Use Supabase client to invoke function (correct URL handling)
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'j_ads_view_shared_optimization',
        {
          body: {
            slug: slug,
            password: password.trim(),
          },
        }
      );

      // Handle errors from Edge Function
      if (invokeError) {
        const errorMsg = invokeError.message || '';

        if (errorMsg.includes('Invalid password') || errorMsg.includes('401')) {
          setError('Senha incorreta');
          toast.error('Senha incorreta');
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          setError('Link não encontrado ou desativado');
          toast.error('Link não encontrado');
        } else if (errorMsg.includes('expired') || errorMsg.includes('403')) {
          setError('Este link expirou');
          toast.error('Link expirado');
        } else {
          throw new Error(errorMsg || 'Erro ao validar senha');
        }
        return;
      }

      // Check if result has error property (from Edge Function response)
      if (result?.error) {
        const errorMsg = result.error;

        if (errorMsg.includes('Invalid password')) {
          setError('Senha incorreta');
          toast.error('Senha incorreta');
        } else if (errorMsg.includes('not found')) {
          setError('Link não encontrado ou desativado');
          toast.error('Link não encontrado');
        } else if (errorMsg.includes('expired')) {
          setError('Este link expirou');
          toast.error('Link expirado');
        } else {
          setError(errorMsg);
          toast.error(errorMsg);
        }
        return;
      }

      // Authentication successful
      setData(result);
      setIsAuthenticated(true);
      toast.success('Acesso autorizado!');
    } catch (error: any) {
      console.error('Error validating password:', error);
      setError(error.message || 'Erro ao acessar análise');
      toast.error('Erro ao validar senha');
    } finally {
      setIsValidating(false);
    }
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O link de compartilhamento está incompleto ou inválido.
            </p>
            <JumperButton onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar ao Início
            </JumperButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <JumperBackground>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <JumperLogo variant="full" className="h-12" />
            </div>

            {/* Password Form */}
            <Card className="border-2">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-orange-hero/10 p-4">
                    <Lock className="h-8 w-8 text-orange-hero" />
                  </div>
                </div>
                <CardTitle className="text-center text-2xl">
                  Análise Protegida
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground">
                  Digite a senha para acessar esta otimização
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha de Acesso</Label>
                    <Input
                      id="password"
                      type="text"
                      placeholder="Digite a senha fornecida"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isValidating}
                      className="text-center font-mono text-lg tracking-wider"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <JumperButton
                    type="submit"
                    disabled={isValidating}
                    className="w-full"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Acessar Análise
                      </>
                    )}
                  </JumperButton>
                </form>

                <Separator className="my-6" />

                <div className="text-center text-xs text-muted-foreground">
                  Powered by{' '}
                  <span className="font-semibold text-orange-hero">Jumper Studio</span>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Essa é uma análise de otimização de tráfego pago</p>
              <p>Caso não tenha a senha, entre em contato com seu gestor</p>
            </div>
          </div>
        </div>
      </JumperBackground>
    );
  }

  // Authenticated - Show optimization data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-hero" />
      </div>
    );
  }

  return (
    <JumperBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <JumperLogo variant="full" className="h-8" />
            <Badge variant="outline" className="gap-2">
              <Lock className="h-3 w-3" />
              Análise Compartilhada
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Account Info Card */}
          <Card className="mb-8 border-l-4 border-l-orange-hero">
            <CardHeader>
              <CardTitle className="text-2xl">{data.recording.account_name}</CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(data.recording.recorded_at), "PPP 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Gestor: {data.recording.recorded_by}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Objectives */}
              {data.recording.objectives && data.recording.objectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.recording.objectives.map((obj, idx) => (
                    <Badge key={idx} variant="secondary">
                      {obj}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {data.context && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-hero" />
                Análise de IA
              </h2>
              <OptimizationContextCard
                context={data.context}
                accountName={data.recording.account_name}
                recordedBy={data.recording.recorded_by}
                recordedAt={new Date(data.recording.recorded_at)}
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
            <p>
              Gerado em {format(new Date(), "PPP 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="mt-2">
              Powered by{' '}
              <span className="font-semibold text-orange-hero">Jumper Studio</span>
            </p>
          </div>
        </div>
      </div>
    </JumperBackground>
  );
}
