/**
 * Utilities for account handling and organization
 */

export interface Client {
  id: string;
  name: string;
  objectives?: string[];
}

export interface SortedClients {
  sortedNormalAccounts: Client[];
  sortedAdminOnlyAccounts: Client[];
}

/**
 * Organizes and sorts client accounts based on user permissions
 * @param clients - Array of all clients
 * @param userAccessibleAccounts - Array of account IDs the user has direct access to
 * @returns Object with sorted normal and admin-only accounts
 */
export const organizeClientAccounts = (
  clients: Client[], 
  userAccessibleAccounts: string[]
): SortedClients => {
  // Separar contas em dois grupos
  const normalAccounts = clients.filter(client => 
    userAccessibleAccounts.includes(client.id)
  );
  
  const adminOnlyAccounts = clients.filter(client => 
    !userAccessibleAccounts.includes(client.id)
  );
  
  // Ordenar alfabeticamente
  const sortedNormalAccounts = normalAccounts.sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  const sortedAdminOnlyAccounts = adminOnlyAccounts.sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  return { sortedNormalAccounts, sortedAdminOnlyAccounts };
};

/**
 * Gets the permission level for a specific account
 * @param accountId - The account ID to check
 * @param userAccessibleAccounts - Array of account IDs the user has direct access to
 * @param isAdmin - Whether the user is an admin
 * @returns 'normal' | 'admin-only' | 'no-access'
 */
export const getAccountPermissionLevel = (
  accountId: string,
  userAccessibleAccounts: string[],
  isAdmin: boolean
): 'normal' | 'admin-only' | 'no-access' => {
  if (userAccessibleAccounts.includes(accountId)) {
    return 'normal';
  }
  
  if (isAdmin) {
    return 'admin-only';
  }
  
  return 'no-access';
};