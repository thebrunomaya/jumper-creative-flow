import React, { useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface SyncStatus {
  isRunning: boolean;
  lastSync?: {
    started_at: string;
    status: 'success' | 'failed' | 'partial';
    records_processed: number;
    execution_time_ms: number;
  };
}

export const NotionSyncControl: React.FC = () => {
  const { currentUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false });
  const [logs, setLogs] = useState<any[]>([]);

  const handleAccountsSync = async () => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSyncStatus({ ...syncStatus, isRunning: true });
    toast.info('Iniciando sincronização de contas...');

    try {
      const { data, error } = await supabase.functions.invoke('j_ads_notion_sync_accounts');

      if (error) {
        throw error;
      }

      if (data.ok) {
        toast.success(`Sincronização concluída! ${data.synced.accounts} contas sincronizadas.`);
        setSyncStatus({
          isRunning: false,
          lastSync: {
            started_at: new Date().toISOString(),
            status: 'success',
            records_processed: data.synced.accounts,
            execution_time_ms: 0
          }
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
      
      // Recarregar logs após sincronização
      await loadSyncLogs();
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      toast.error(`Erro na sincronização: ${err.message}`);
      setSyncStatus({
        isRunning: false,
        lastSync: {
          started_at: new Date().toISOString(),
          status: 'failed',
          records_processed: 0,
          execution_time_ms: 0
        }
      });
    }
  };

  const handleManagersSync = async () => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSyncStatus({ ...syncStatus, isRunning: true });
    toast.info('Iniciando sincronização de gerentes...');

    try {
      const { data, error } = await supabase.functions.invoke('j_ads_notion_sync_managers');

      if (error) {
        throw error;
      }

      if (data.ok) {
        toast.success(`Sincronização concluída! ${data.synced.managers} gerentes sincronizados.`);
        setSyncStatus({
          isRunning: false,
          lastSync: {
            started_at: new Date().toISOString(),
            status: 'success',
            records_processed: data.synced.managers,
            execution_time_ms: 0
          }
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
      
      // Recarregar logs após sincronização
      await loadSyncLogs();
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      toast.error(`Erro na sincronização de gerentes: ${err.message}`);
      setSyncStatus({
        isRunning: false,
        lastSync: {
          started_at: new Date().toISOString(),
          status: 'failed',
          records_processed: 0,
          execution_time_ms: 0
        }
      });
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('j_ads_notion_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao carregar logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  };

  React.useEffect(() => {
    loadSyncLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Controle Manual */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Sincronização Notion ↔ Supabase</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sincronizar dados completos das tabelas Notion
          </p>
        </div>

        {/* Botões de Sincronização */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Sincronizar DB_Contas */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">DB_Contas → j_ads_notion_db_accounts</h4>
            <Button
              onClick={handleAccountsSync}
              disabled={syncStatus.isRunning}
              variant="default"
              className="w-full flex items-center gap-2"
            >
              {syncStatus.isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncStatus.isRunning ? 'Sincronizando...' : 'Sincronizar Contas'}
            </Button>
            <p className="text-xs text-gray-500">75 campos • Canal SoWork, IDs Meta/Google, Briefing</p>
          </div>

          {/* Sincronizar DB_Gerentes */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">DB_Gerentes → j_ads_notion_db_managers</h4>
            <Button
              onClick={handleManagersSync}
              disabled={syncStatus.isRunning}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              {syncStatus.isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncStatus.isRunning ? 'Sincronizando...' : 'Sincronizar Gerentes'}
            </Button>
            <p className="text-xs text-gray-500">10 campos • Nome, Email, Telefone, Função, Organizações</p>
          </div>
        </div>

        {/* Status da Última Sincronização */}
        {syncStatus.lastSync && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(syncStatus.lastSync.status)}
              <span className="text-sm font-medium">
                Última sincronização: {formatDate(syncStatus.lastSync.started_at)}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {syncStatus.lastSync.records_processed} registros processados
              {syncStatus.lastSync.execution_time_ms > 0 && (
                <span> em {formatDuration(syncStatus.lastSync.execution_time_ms)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Sincronizações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h4 className="font-semibold mb-4">Histórico de Sincronizações</h4>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma sincronização registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <div className="text-sm font-medium">
                      {formatDate(log.started_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tipo: {log.sync_type} • {log.records_processed || 0} registros
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {log.execution_time_ms ? formatDuration(log.execution_time_ms) : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações Técnicas */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Informações da Sincronização
        </h5>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p><strong>DB_Contas:</strong> 75 colunas • Canal SoWork, Meta Ads IDs, Briefing Estratégico</p>
          <p><strong>DB_Gerentes:</strong> 10 colunas • Nome, Email, Telefone, Função, Contas, Organização</p>
          <p>• Upsert baseado em notion_id (evita duplicatas)</p>
          <p>• Suporte completo a tipos: people, relation, unique_id, multi_select</p>
          <p>• Logs detalhados para auditoria e debug</p>
        </div>
      </div>
    </div>
  );
};