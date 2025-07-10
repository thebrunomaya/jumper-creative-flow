import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Account {
  id: string;
  name: string;
  notion_id: string;
  ad_account_id: string;
  manager?: string;
  organizacao?: string;
  objectives?: string[];
  // Add other account properties as needed
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchAccounts = useCallback(async () => {
    if (!currentUser) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For Gestores, don't fetch accounts
      if (currentUser.funcao === 'Gestor') {
        setAccounts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('notion-clients');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Invalid response format from Notion');
      }

      if (!data.results || !Array.isArray(data.results)) {
        console.warn('No results found in Notion response');
        setAccounts([]);
        setError(null);
        return;
      }

      // Format accounts from Notion data
      const formattedAccounts: Account[] = data.results.map((item: any) => ({
        id: item.id,
        name: item.properties?.Nome?.title?.[0]?.plain_text || 'Sem nome',
        notion_id: item.id,
        ad_account_id: item.properties?.['ID da Conta de Anúncios']?.rich_text?.[0]?.plain_text || '',
        manager: item.properties?.Gerente?.people?.[0]?.id || '',
        organizacao: item.properties?.Organização?.rich_text?.[0]?.plain_text || '',
        objectives: item.properties?.Objetivos?.multi_select?.map((obj: any) => obj.name) || []
      }));

      // Filter accounts based on user role
      let filteredAccounts: Account[] = [];

      if (currentUser.funcao === 'Supervisor') {
        // Supervisors see all accounts from their organization
        filteredAccounts = formattedAccounts.filter(account => 
          account.organizacao === currentUser.organizacao
        );
      } else if (currentUser.funcao === 'Gerente') {
        // Gerentes see only their linked accounts
        filteredAccounts = formattedAccounts.filter(account => 
          currentUser.accounts?.includes(account.notion_id)
        );
      }

      console.log('Filtered accounts for user:', filteredAccounts);
      setAccounts(filteredAccounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Erro ao carregar contas do Notion');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
};