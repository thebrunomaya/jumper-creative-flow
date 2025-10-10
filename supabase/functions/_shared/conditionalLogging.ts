import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Checks if the current user should see debug logs (admin or manager/gestor)
 */
export async function shouldLogForUser(supabase: SupabaseClient, userId: string, userEmail?: string): Promise<boolean> {
  try {
    // Check for admin role first
    const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', { 
      _user_id: userId, 
      _role: 'admin' 
    });
    
    if (!adminError && isAdmin) {
      return true;
    }

    // Check for manager role (gestor)
    const { data: isManager, error: managerError } = await supabase.rpc('has_role', { 
      _user_id: userId, 
      _role: 'manager' 
    });
    
    if (!managerError && isManager) {
      return true;
    }

    // Check in j_ads_notion_db_managers table for gestor role
    if (userEmail) {
      const { data: notionRole, error: notionError } = await supabase
        .from('j_ads_notion_db_managers')
        .select('role')
        .eq('email', userEmail)
        .single();

      if (!notionError && notionRole && notionRole.role === 'gestor') {
        return true;
      }
    }

    return false;
  } catch {
    return false; // Default to no logging on error
  }
}

/**
 * Conditional logger for Edge Functions
 */
export function createEdgeLogger(shouldLog: boolean) {
  return {
    log: (message: string, ...args: any[]) => {
      if (shouldLog) console.log(message, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog) console.warn(message, ...args);
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog) console.error(message, ...args);
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog) console.info(message, ...args);
    },
    shouldLog
  };
}