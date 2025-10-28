/**
 * Account Priority Utilities
 *
 * Centralized logic for prioritizing user accounts based on access level.
 * Used across the application for consistent account ordering in dropdowns and lists.
 *
 * Priority Order:
 * 1. GESTOR - Accounts where user is the traffic manager
 * 2. SUPERVISOR - Accounts where user is the supervisor/atendimento
 * 3. ADMIN - Accounts accessible via admin role (no direct assignment)
 * 4. OUTROS - Other accounts (fallback)
 */

import { NotionAccount } from '@/hooks/useMyNotionAccounts';

/**
 * Access reason types representing user's relationship with an account
 */
export type AccessReason = 'GESTOR' | 'SUPERVISOR' | 'ADMIN' | 'GERENTE';

/**
 * User role from j_hub_users table
 */
export type UserRole = 'admin' | 'staff' | 'client';

/**
 * Get all access reasons for a user on a specific account.
 * Returns ACCUMULATED badges (not replaced) - user can have multiple roles.
 *
 * @example
 * // User is both GESTOR and ADMIN
 * getAccessReasons(account, 'user@jumper.studio', 'admin')
 * // Returns: ['GESTOR', 'ADMIN']
 */
export function getAccessReasons(
  account: NotionAccount,
  userEmail: string,
  userRole: UserRole
): AccessReason[] {
  const reasons: AccessReason[] = [];
  const email = userEmail.toLowerCase();
  const gestorEmail = account.gestor_email?.toLowerCase() || '';
  const atendimentoEmail = account.atendimento_email?.toLowerCase() || '';

  // Accumulate ALL relationships (not replace)
  if (gestorEmail.includes(email)) {
    reasons.push('GESTOR');
  }
  if (atendimentoEmail.includes(email)) {
    reasons.push('SUPERVISOR');
  }

  // Admin always appears if user has admin role
  if (userRole === 'admin') {
    reasons.push('ADMIN');
  }

  // Fallback if no relationship found
  if (reasons.length === 0) {
    reasons.push('GERENTE');
  }

  // Sort by priority: GESTOR → SUPERVISOR → GERENTE → ADMIN
  return reasons.sort((a, b) => getAccessPriority(a) - getAccessPriority(b));
}

/**
 * Get numeric priority for an access reason.
 * Lower number = higher priority in sorting.
 *
 * @example
 * getAccessPriority('GESTOR')     // Returns: 1 (highest)
 * getAccessPriority('SUPERVISOR') // Returns: 2
 * getAccessPriority('GERENTE')    // Returns: 3
 * getAccessPriority('ADMIN')      // Returns: 4 (lowest)
 */
export function getAccessPriority(reason: AccessReason): number {
  switch (reason) {
    case 'GESTOR': return 1;
    case 'SUPERVISOR': return 2;
    case 'GERENTE': return 3;
    case 'ADMIN': return 4; // Admin access (no direct assignment) goes last
    default: return 999;
  }
}

/**
 * Get PRIMARY access reason (first badge) for sorting purposes.
 * Uses the highest priority reason when user has multiple roles.
 *
 * @example
 * // User is both GESTOR and ADMIN
 * getPrimaryAccessReason(account, 'user@jumper.studio', 'admin')
 * // Returns: 'GESTOR' (priority 1 beats priority 4)
 */
export function getPrimaryAccessReason(
  account: NotionAccount,
  userEmail: string,
  userRole: UserRole
): AccessReason {
  const reasons = getAccessReasons(account, userEmail, userRole);
  return reasons[0] || 'GERENTE';
}

/**
 * Sort accounts by access priority, then by name alphabetically.
 *
 * Sorting logic:
 * 1. Primary sort: Access priority (GESTOR → SUPERVISOR → GERENTE → ADMIN)
 * 2. Secondary sort: Account name (A-Z)
 *
 * @example
 * const sorted = sortAccountsByPriority(accounts, 'user@jumper.studio', 'staff');
 * // Returns accounts grouped by: GESTOR accounts first, then SUPERVISOR, etc.
 */
export function sortAccountsByPriority(
  accounts: NotionAccount[],
  userEmail: string,
  userRole: UserRole
): NotionAccount[] {
  return [...accounts].sort((a, b) => {
    // Primary sort: Access priority
    const reasonA = getPrimaryAccessReason(a, userEmail, userRole);
    const reasonB = getPrimaryAccessReason(b, userEmail, userRole);
    const priorityA = getAccessPriority(reasonA);
    const priorityB = getAccessPriority(reasonB);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort: Alphabetical by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Group accounts by their primary access reason.
 * Returns a Record with accounts organized by priority group.
 *
 * @example
 * const grouped = groupAccountsByPriority(accounts, 'user@jumper.studio', 'staff');
 * // Returns:
 * // {
 * //   GESTOR: [account1, account2],
 * //   SUPERVISOR: [account3],
 * //   GERENTE: [],
 * //   ADMIN: []
 * // }
 */
export function groupAccountsByPriority(
  accounts: NotionAccount[],
  userEmail: string,
  userRole: UserRole
): Record<AccessReason, NotionAccount[]> {
  const groups: Record<AccessReason, NotionAccount[]> = {
    GESTOR: [],
    SUPERVISOR: [],
    GERENTE: [],
    ADMIN: [],
  };

  accounts.forEach((account) => {
    const primaryReason = getPrimaryAccessReason(account, userEmail, userRole);
    groups[primaryReason].push(account);
  });

  // Sort accounts within each group alphabetically
  Object.keys(groups).forEach((key) => {
    const reason = key as AccessReason;
    groups[reason].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });

  return groups;
}

/**
 * Get human-readable label for access reason.
 * Used for UI display (badges, separators).
 */
export function getAccessReasonLabel(reason: AccessReason): string {
  switch (reason) {
    case 'GESTOR': return 'Gestor';
    case 'SUPERVISOR': return 'Supervisor';
    case 'GERENTE': return 'Gerente';
    case 'ADMIN': return 'Admin';
  }
}

/**
 * Get emoji icon for access reason (for visual separation in dropdowns).
 */
export function getAccessReasonIcon(reason: AccessReason): string {
  switch (reason) {
    case 'GESTOR': return '📊';
    case 'SUPERVISOR': return '👁️';
    case 'GERENTE': return '📝';
    case 'ADMIN': return '👑';
  }
}
