import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMyNotionAccounts = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use new complete function that works with synchronized tables
        const { data, error } = await supabase.functions.invoke('j_ads_user_accounts');

        if (error) throw error;
        if (!data || data.success !== true) {
          throw new Error(data?.error || 'Resposta inválida do servidor');
        }

        // Extract account IDs for backward compatibility
        const ids = Array.isArray(data.account_ids) ? data.account_ids : [];
        setAccountIds(ids);

        // Store complete account data (includes name, objectives, etc.)
        const completeAccounts = Array.isArray(data.accounts) ? data.accounts : [];
        setAccounts(completeAccounts);

        // Store admin flag from edge function
        setIsAdmin(data.is_admin || false);

        console.log('✅ useMyNotionAccounts - Complete data loaded:', {
          accountIds: ids.length,
          accounts: completeAccounts.length,
          isAdmin: data.is_admin,
          source: data.source
        });

      } catch (err: any) {
        console.error('useMyNotionAccounts error:', err);
        setError(err?.message || 'Falha ao carregar contas do Notion');
        setAccountIds([]);
        setAccounts([]);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return {
    accountIds,
    accounts, // NEW: return complete account data
    isAdmin, // NEW: return admin flag from edge function
    loading,
    error
  };
};
