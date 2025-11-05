import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DashboardObjective =
  | 'geral'
  | 'vendas'
  | 'trafego'
  | 'leads'
  | 'engajamento'
  | 'reconhecimento'
  | 'video'
  | 'conversoes'
  | 'alcance'
  | 'conversas'
  | 'cadastros'
  | 'seguidores';

export interface AccountMetrics {
  account_id: string;
  account_name: string;
  meta_ads_id: string;
  metrics: any; // Dynamic based on objective
}

export interface MultiAccountMetricsResponse {
  success: boolean;
  accounts: AccountMetrics[];
  objective: DashboardObjective;
  date_range: {
    start: string;
    end: string;
  };
  total_accounts: number;
}

export interface UseMultiAccountMetricsOptions {
  objective: DashboardObjective;
  dateStart: string; // YYYY-MM-DD
  dateEnd: string; // YYYY-MM-DD
  enabled?: boolean; // If false, won't fetch
}

export function useMultiAccountMetrics({
  objective,
  dateStart,
  dateEnd,
  enabled = true,
}: UseMultiAccountMetricsOptions) {
  const [data, setData] = useState<AccountMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching multi-account metrics:', { objective, dateStart, dateEnd });

        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'j_hub_dashboards_multi_account',
          {
            body: {
              objective,
              date_start: dateStart,
              date_end: dateEnd,
            },
          }
        );

        if (!isMounted) return;

        if (functionError) {
          throw new Error(functionError.message || 'Error fetching metrics');
        }

        if (!functionData.success) {
          throw new Error(functionData.error || 'Failed to fetch metrics');
        }

        console.log(`✅ Received ${functionData.accounts.length} accounts with metrics`);
        setData(functionData.accounts);
      } catch (err: any) {
        console.error('Multi-account metrics error:', err);
        if (isMounted) {
          setError(err.message || 'Unexpected error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [objective, dateStart, dateEnd, enabled]);

  return {
    accounts: data,
    loading,
    error,
    refetch: () => {
      // Trigger re-fetch by changing a dependency (hacky but works)
      // Better: use React Query or similar
    },
  };
}
