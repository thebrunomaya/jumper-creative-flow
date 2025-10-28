/**
 * PrioritizedAccountSelect Component
 *
 * Standardized account selector with priority-based ordering and visual separators.
 * Used across the app for consistent account selection UX.
 *
 * Features:
 * - Priority-based ordering: GESTOR → SUPERVISOR → ADMIN
 * - Visual separators between priority groups
 * - "Show Inactive" toggle (admin only)
 * - Loading and empty states
 * - Customizable styling
 *
 * @example
 * ```tsx
 * const { accounts, loading } = useMyNotionAccounts();
 * const { userRole } = useUserRole();
 * const { currentUser } = useAuth();
 *
 * <PrioritizedAccountSelect
 *   accounts={accounts}
 *   loading={loading}
 *   value={selectedAccountId}
 *   onChange={setSelectedAccountId}
 *   userEmail={currentUser?.email}
 *   userRole={userRole}
 * />
 * ```
 */

import React, { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { NotionAccount } from '@/hooks/useMyNotionAccounts';
import {
  groupAccountsByPriority,
  getAccessReasonLabel,
  getAccessReasonIcon,
  AccessReason,
  UserRole,
} from '@/utils/accountPriority';
import { cn } from '@/lib/utils';

export interface PrioritizedAccountSelectProps {
  /** List of accounts to display */
  accounts: NotionAccount[];

  /** Currently selected account ID (null = all accounts) */
  value?: string | null;

  /** Callback when selection changes */
  onChange: (accountId: string) => void;

  /** User email for priority calculation */
  userEmail?: string;

  /** User role (admin/staff/client) */
  userRole?: UserRole;

  /** Placeholder text */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Show "Mostrar Inativas" toggle (only appears for admin) */
  showInactiveToggle?: boolean;

  /** Show "Todas as contas" option at the top */
  showAllOption?: boolean;

  /** Custom className for styling */
  className?: string;
}

export function PrioritizedAccountSelect({
  accounts,
  value,
  onChange,
  userEmail = '',
  userRole = 'client',
  placeholder = 'Selecione uma conta',
  disabled = false,
  loading = false,
  showInactiveToggle = true,
  showAllOption = false,
  className,
}: PrioritizedAccountSelectProps) {
  const [showInactive, setShowInactive] = useState(false);
  const isAdmin = userRole === 'admin';

  // Filter inactive accounts based on toggle state
  const filteredAccounts = useMemo(() => {
    if (showInactive || !isAdmin) {
      return accounts; // Show all if toggle enabled or not admin
    }
    return accounts.filter((acc) => acc.status?.toLowerCase() !== 'inativo');
  }, [accounts, showInactive, isAdmin]);

  // Group accounts by priority
  const groupedAccounts = useMemo(() => {
    return groupAccountsByPriority(filteredAccounts, userEmail, userRole);
  }, [filteredAccounts, userEmail, userRole]);

  // Priority order for rendering
  const priorityOrder: AccessReason[] = ['GESTOR', 'SUPERVISOR', 'GERENTE', 'ADMIN'];

  // Get total count of active groups
  const activeGroups = priorityOrder.filter(
    (reason) => groupedAccounts[reason].length > 0
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Select disabled>
          <SelectTrigger className={className}>
            <SelectValue>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando contas...</span>
              </div>
            </SelectValue>
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            className="max-h-[400px]"
            position="popper"
            side="bottom"
            align="start"
            sideOffset={5}
            avoidCollisions={false}
          >
            {/* "Todas as contas" option */}
            {showAllOption && (
              <>
                <SelectItem value="all">Todas as contas</SelectItem>
                <SelectSeparator />
              </>
            )}

            {filteredAccounts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {showInactive
                  ? 'Nenhuma conta disponível'
                  : 'Nenhuma conta ativa disponível'}
              </div>
            ) : (
              <>
                {priorityOrder.map((reason, groupIndex) => {
                  const groupAccounts = groupedAccounts[reason];
                  if (groupAccounts.length === 0) return null;

                  return (
                    <React.Fragment key={reason}>
                      {/* Separator between groups (not before first group) */}
                      {groupIndex > 0 && activeGroups.indexOf(reason) > 0 && (
                        <SelectSeparator />
                      )}

                      {/* Group Header */}
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                          <span>{getAccessReasonIcon(reason)}</span>
                          <span>{getAccessReasonLabel(reason)}</span>
                          <span className="ml-auto text-[10px] font-normal">
                            ({groupAccounts.length})
                          </span>
                        </SelectLabel>

                        {/* Accounts in this group */}
                        {groupAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <span>{account.name}</span>
                              {account.status?.toLowerCase() === 'inativo' && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4"
                                >
                                  Inativa
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Show Inactive Toggle (Admin only) */}
        {isAdmin && showInactiveToggle && (
          <Badge
            variant={showInactive ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-all select-none whitespace-nowrap',
              showInactive
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'hover:bg-muted'
            )}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? '✓ Mostrar Inativas' : 'Mostrar Inativas'}
          </Badge>
        )}
      </div>
    </div>
  );
}
