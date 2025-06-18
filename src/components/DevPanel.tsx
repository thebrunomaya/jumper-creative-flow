
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Database, Code, GitBranch, Settings, Zap } from 'lucide-react';

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DevPanel: React.FC<DevPanelProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === 'Boiler123$') {
      setIsAuthenticated(true);
      setShowError(false);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword('');
    setShowError(false);
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Acesso ao Painel de Desenvolvimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dev-password" className="text-sm font-medium">
                Senha de Acesso:
              </label>
              <Input
                id="dev-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Digite a senha..."
              />
            </div>
            {showError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Senha incorreta. Tente novamente.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={handlePasswordSubmit} className="w-full">
              Acessar Painel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Informações de Desenvolvimento - Sistema de Criativos
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="backend">Backend</TabsTrigger>
            <TabsTrigger value="frontend">Frontend</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Arquitetura do Sistema
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Frontend:</strong> React 18 + TypeScript + Vite</p>
                  <p><strong>Styling:</strong> Tailwind CSS + Shadcn/UI</p>
                  <p><strong>Backend:</strong> Supabase (PostgreSQL + Edge Functions)</p>
                  <p><strong>Integração:</strong> Notion API para dados externos</p>
                  <p><strong>Upload:</strong> Sistema local + Supabase Storage</p>
                  <p><strong>Autenticação:</strong> Supabase Auth</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Funcionalidades Principais
                </h3>
                <div className="space-y-2">
                  <Badge variant="outline">Sistema Multi-step</Badge>
                  <Badge variant="outline">Upload de Arquivos</Badge>
                  <Badge variant="outline">Carrossel 1:1 e 4:5</Badge>
                  <Badge variant="outline">Zonas de Proteção Meta</Badge>
                  <Badge variant="outline">Preview com Lightbox</Badge>
                  <Badge variant="outline">Validação de Arquivos</Badge>
                  <Badge variant="outline">Integração Notion</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backend" className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estrutura do Backend
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Tabelas Supabase:</h4>
                <div className="space-y-2 text-sm">
                  <div className="border rounded p-2">
                    <strong>creatives</strong>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• id, created_at, updated_at</li>
                      <li>• client_name, campaign_name</li>
                      <li>• creative_type, platform, objective</li>
                      <li>• files (JSON), form_data (JSON)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Edge Functions:</h4>
                <div className="space-y-2 text-sm">
                  <div className="border rounded p-2">
                    <strong>submit-creative</strong>
                    <p className="text-xs mt-1">Processa submissão de criativos</p>
                  </div>
                  <div className="border rounded p-2">
                    <strong>notion-clients</strong>
                    <p className="text-xs mt-1">Busca dados de clientes</p>
                  </div>
                  <div className="border rounded p-2">
                    <strong>notion-managers</strong>
                    <p className="text-xs mt-1">Busca dados de gerentes</p>
                  </div>
                  <div className="border rounded p-2">
                    <strong>notion-partners</strong>
                    <p className="text-xs mt-1">Busca dados de parceiros</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="frontend" className="space-y-4">
            <h3 className="text-lg font-semibold">Componentes Frontend</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Componentes Principais:</h4>
                <ul className="space-y-1">
                  <li>• CreativeSystem (orchestrador)</li>
                  <li>• Step1-4 (wizard multi-etapas)</li>
                  <li>• FileUpload (drag & drop)</li>
                  <li>• ThumbnailPreview</li>
                  <li>• MediaPreviewLightbox</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Carrossel:</h4>
                <ul className="space-y-1">
                  <li>• CarouselCardUpload</li>
                  <li>• CarouselAspectRatioToggle</li>
                  <li>• MetaZoneOverlay</li>
                  <li>• Suporte 1:1 e 4:5</li>
                  <li>• Zonas de proteção automáticas</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Utilitários:</h4>
                <ul className="space-y-1">
                  <li>• fileValidation.ts</li>
                  <li>• thumbnailUtils.ts</li>
                  <li>• mediaAnalysis.ts</li>
                  <li>• useNotionData.ts</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <h3 className="text-lg font-semibold">Integrações Notion</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Database Clientes</h4>
                  <p className="text-sm mb-2">ID: 162db609-4968-808b-bcbe-d40fef7370d1</p>
                  <p className="text-xs">35 registros encontrados</p>
                  <p className="text-xs mt-1">Campos: Conta, Gerente, Parceiro, Status, etc.</p>
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Database Gerentes</h4>
                  <p className="text-sm mb-2">ID: 213db60949688003bd2dec32494bb87c</p>
                  <p className="text-xs">10 registros encontrados</p>
                  <p className="text-xs mt-1">Campos: Nome, E-mail, Telefone, Contas, etc.</p>
                </div>
                
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2">Database Parceiros</h4>
                  <p className="text-sm mb-2">Configurado mas não utilizado ainda</p>
                  <p className="text-xs">Edge Function preparada</p>
                </div>
              </div>
              
              <Alert>
                <AlertDescription>
                  <strong>Configuração:</strong> As integrações usam NOTION_TOKEN armazenado no Supabase Secrets.
                  Todas as consultas são feitas via Edge Functions para manter a segurança.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="changelog" className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Changelog Detalhado
            </h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">v1.5.0 - Sistema de Carrossel</h4>
                <p className="text-sm text-gray-600 mb-2">Implementação completa do carrossel com zonas de proteção</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>CarouselCardUpload component</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Suporte a formatos 1:1 e 4:5</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>CarouselAspectRatioToggle para alternar proporções</li>
                  <li>• <Badge variant="outline" className="mr-2">ENHANCED</Badge>MetaZoneOverlay com detecção automática</li>
                  <li>• <Badge variant="outline" className="mr-2">FIX</Badge>Correção de thumbnails 4:5 (120x150px)</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">v1.4.0 - Zonas de Proteção Meta</h4>
                <p className="text-sm text-gray-600 mb-2">Sistema avançado de overlays para Meta Ads</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>MetaZoneOverlay component</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Overlays específicos por formato</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Stories: 14% superior, 20% inferior</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Reels: 22% superior, 20% inferior</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Feed 1:1: 10% em todos os lados</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Feed 4:5: 18.5% superior/inferior, 6% laterais</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">v1.3.0 - Sistema de Preview</h4>
                <p className="text-sm text-gray-600 mb-2">Preview avançado com lightbox e thumbnails</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>MediaPreviewLightbox component</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>ThumbnailPreview com canvas</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>thumbnailUtils.ts para geração</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Suporte a vídeos e imagens</li>
                  <li>• <Badge variant="outline" className="mr-2">ENHANCED</Badge>Preview responsivo</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium">v1.2.0 - Integração Notion</h4>
                <p className="text-sm text-gray-600 mb-2">Conexão completa com databases do Notion</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Edge Function notion-clients</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Edge Function notion-managers</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Edge Function notion-partners</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>useNotionData hook</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Dropdowns dinâmicos nos formulários</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-medium">v1.1.0 - Validação e Upload</h4>
                <p className="text-sm text-gray-600 mb-2">Sistema robusto de validação de arquivos</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>fileValidation.ts com regras específicas</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Validação por tipo de criativo</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>FileUploadZone drag & drop</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Suporte múltiplos formatos</li>
                  <li>• <Badge variant="outline" className="mr-2">ENHANCED</Badge>Feedback visual de erros</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-gray-500 pl-4">
                <h4 className="font-medium">v1.0.0 - Sistema Base</h4>
                <p className="text-sm text-gray-600 mb-2">Estrutura fundamental do sistema</p>
                <ul className="text-sm space-y-1">
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>CreativeSystem orchestrador</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Wizard multi-etapas (Step1-4)</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Autenticação Supabase</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Edge Function submit-creative</li>
                  <li>• <Badge variant="outline" className="mr-2">NEW</Badge>Database schema inicial</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DevPanel;
