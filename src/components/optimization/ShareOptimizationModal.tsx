/**
 * ShareOptimizationModal
 * Modal for creating public shareable links for optimization recordings
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { JumperButton } from '@/components/ui/jumper-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Share2,
  Lock,
  Calendar,
  Loader2,
} from 'lucide-react';

interface ShareOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  accountName: string;
  recordedAt: string;
}

export function ShareOptimizationModal({
  open,
  onOpenChange,
  recordingId,
  accountName,
  recordedAt,
}: ShareOptimizationModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [shareData, setShareData] = useState<{
    url: string;
    password: string;
    expires_at: string | null;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('never');

  const handleCreateShare = async () => {
    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const requestBody: {
        recording_id: string;
        password?: string;
        expires_days?: number;
      } = {
        recording_id: recordingId,
      };

      // Add custom password if provided
      if (useCustomPassword && customPassword.trim()) {
        if (customPassword.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        requestBody.password = customPassword.trim();
      }

      // Add expiration if selected
      if (expirationDays !== 'never') {
        requestBody.expires_days = parseInt(expirationDays);
      }

      // Use Supabase client to invoke function (correct URL handling)
      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'j_ads_create_optimization_share',
        {
          body: requestBody,
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao criar link de compartilhamento');
      }

      setShareData({
        url: result.url,
        password: result.password,
        expires_at: result.expires_at,
      });

      toast.success('Link de compartilhamento criado!');
    } catch (error: any) {
      console.error('Error creating share:', error);
      toast.error(error.message || 'Erro ao criar link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'url' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
      toast.success(type === 'url' ? 'Link copiado!' : 'Senha copiada!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setShareData(null);
    setCustomPassword('');
    setUseCustomPassword(false);
    setExpirationDays('never');
    setCopiedUrl(false);
    setCopiedPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-hero" />
            Compartilhar Otimização
          </DialogTitle>
          <DialogDescription>
            Crie um link público protegido por senha para compartilhar esta análise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Account Info */}
          <div className="rounded-lg bg-muted/30 p-3 space-y-1">
            <div className="text-sm font-semibold">{accountName}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(recordedAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {!shareData ? (
            // Configuration form
            <>
              <Separator />

              {/* Password Configuration */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha de Acesso
                </Label>

                <div className="flex items-center gap-2">
                  <JumperButton
                    variant={useCustomPassword ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setUseCustomPassword(false)}
                    type="button"
                  >
                    Gerar automática
                  </JumperButton>
                  <JumperButton
                    variant={useCustomPassword ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseCustomPassword(true)}
                    type="button"
                  >
                    Senha personalizada
                  </JumperButton>
                </div>

                {useCustomPassword && (
                  <Input
                    type="text"
                    placeholder="Digite uma senha (mín. 6 caracteres)"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="font-mono"
                  />
                )}
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiração
                </Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Nunca expira</SelectItem>
                    <SelectItem value="7">Expira em 7 dias</SelectItem>
                    <SelectItem value="30">Expira em 30 dias</SelectItem>
                    <SelectItem value="90">Expira em 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <JumperButton
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Criar Link de Compartilhamento
                  </>
                )}
              </JumperButton>
            </>
          ) : (
            // Share created successfully
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <Separator />

              {/* URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  Link Público
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareData.url}
                    className="font-mono text-xs"
                  />
                  <JumperButton
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareData.url, 'url')}
                  >
                    {copiedUrl ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </JumperButton>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Senha de Acesso
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareData.password}
                    className="font-mono text-lg font-bold tracking-wider"
                  />
                  <JumperButton
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shareData.password, 'password')}
                  >
                    {copiedPassword ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </JumperButton>
                </div>
              </div>

              {/* Expiration Info */}
              {shareData.expires_at && (
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Expira em{' '}
                      {new Date(shareData.expires_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold">📋 Instruções para o cliente:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Envie o link e a senha separadamente (WhatsApp, email, etc.)</li>
                  <li>O cliente acessará o link e digitará a senha</li>
                  <li>A análise será exibida em uma página bonita com branding Jumper</li>
                </ol>
              </div>

              <JumperButton onClick={handleClose} variant="outline" className="w-full">
                Fechar
              </JumperButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
