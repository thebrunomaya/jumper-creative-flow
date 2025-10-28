import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Account data returned by the hook
 */
export interface NotionAccount {
  /** Notion page ID (unique identifier) */
  id: string;
  /** Account name (from "Conta" field) */
  name: string;
  /** List of objectives (e.g., ["Vendas", "Tráfego"]) */
  objectives?: string[];
  /** Account status */
  status?: string;
  /** Account tier */
  tier?: string;
  /** Gestor names (resolved from emails) */
  gestor?: string;
  /** Atendimento names (resolved from emails) */
  atendimento?: string;
  /** Gerente names (resolved from notion_ids) */
  gerente?: string;
  /** Meta Ads account ID */
  meta_ads_id?: string;
  /** Google Ads account ID */
  id_google_ads?: string;
  /** Gestor emails (for matching/filtering) */
  gestor_email?: string;
  /** Atendimento emails (for matching/filtering) - renamed from supervisor_email */
  atendimento_email?: string;
}

/**
 * Standard hook for fetching user's accessible Notion accounts with permission-based filtering.
 *
 * **Architecture Pattern:**
 * - **Backend Centralized:** Calls Edge Function `j_hub_user_accounts` for all permission logic
 * - **Alphabetical Sorting:** Accounts returned pre-sorted by name from database
 * - **Permission-Based:** Automatically filters accounts based on user role:
 *   - Admin: ALL accounts
 *   - Staff: Accounts where user is Gestor or Atendimento
 *   - Client: Accounts linked via notion_manager_id in Gerente field
 *
 * **Usage:**
 * Use this hook on ANY page that needs to display/filter user accounts.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { accounts, loading, error, isAdmin } = useMyNotionAccounts();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <Select>
 *       {accounts.map(account => (
 *         <SelectItem key={account.id} value={account.id}>
 *           {account.name}
 *         </SelectItem>
 *       ))}
 *     </Select>
 *   );
 * }
 * ```
 *
 * **Custom Frontend Sorting:**
 * If you need custom sorting (like MyAccounts page with priority tiers),
 * apply frontend sorting on top of alphabetical base:
 *
 * @example
 * ```tsx
 * const sortedAccounts = useMemo(() => {
 *   return [...accounts].sort((a, b) => {
 *     // Custom logic here (priority, tier, etc.)
 *     return a.name.localeCompare(b.name);
 *   });
 * }, [accounts]);
 * ```
 *
 * @returns Hook state with account data, loading status, and error handling
 */
export const useMyNotionAccounts = () => {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<NotionAccount[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use new complete function that works with synchronized tables
        const { data, error } = await supabase.functions.invoke('j_hub_user_accounts');

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
