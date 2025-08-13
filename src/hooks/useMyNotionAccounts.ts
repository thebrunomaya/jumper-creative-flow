import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMyNotionAccounts = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.functions.invoke('j_ads_notion_my_accounts');
        if (error) throw error;
        if (!data || data.success !== true) {
          throw new Error(data?.error || 'Resposta inválida do servidor');
        }
        setAccountIds(Array.isArray(data.accounts) ? data.accounts : []);
      } catch (err: any) {
        console.error('useMyNotionAccounts error:', err);
        setError(err?.message || 'Falha ao carregar contas do Notion');
        setAccountIds([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { accountIds, loading, error };
};
