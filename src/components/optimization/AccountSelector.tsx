/**
 * AccountSelector - Global account selector for Optimization page
 * Unified component to prevent duplication across Recorder and List
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Account {
  notion_id: string;
  Conta: string | null;
}

interface AccountSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function AccountSelector({ value, onValueChange }: AccountSelectorProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  async function fetchAccounts() {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("j_ads_notion_db_accounts")
      .select("notion_id, Conta")
      .order("Conta", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      return;
    }

    setAccounts(data || []);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        Conta de Anúncios
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a conta para otimização..." />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.notion_id} value={account.notion_id}>
              {account.Conta || account.notion_id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
