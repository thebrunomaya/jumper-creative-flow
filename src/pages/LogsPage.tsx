import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, Settings, Database } from 'lucide-react';

const LogsPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você precisa estar autenticado para visualizar os logs do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sistema de Logs de Erro</h1>
          <p className="text-muted-foreground">Jumper Studio - Monitoramento e Análise</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database
            </CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Tabela error_logs criada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Edge Function
            </CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Ativo</div>
            <p className="text-xs text-muted-foreground">
              log-error implementada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Boundary
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Captura automática ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sistema Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Logs Implementado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O sistema de logs de erro está completamente configurado e funcional com os seguintes componentes:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Tabela error_logs</h4>
                <p className="text-sm text-muted-foreground">
                  Estrutura completa com RLS policies para segurança
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Edge Function log-error</h4>
                <p className="text-sm text-muted-foreground">
                  Endpoint para receber e armazenar logs de erro com validação
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Hook useErrorLogger</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema para capturar erros de API, validação, upload e componentes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-medium text-foreground">Error Boundary Global</h4>
                <p className="text-sm text-muted-foreground">
                  Captura crashes de componentes React automaticamente
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Como usar:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Erros são capturados automaticamente pelo Error Boundary</p>
              <p>• Use useErrorLogger() nos componentes para logging manual</p>
              <p>• Logs são armazenados no Supabase com contexto do usuário</p>
              <p>• Interface de visualização será implementada em próxima versão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;