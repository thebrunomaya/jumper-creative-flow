import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'gerente' | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isAuthenticated || !currentUser?.id) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Check for admin role first (highest priority)
        const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', { 
          _user_id: currentUser.id, 
          _role: 'admin' 
        });
        
        if (!adminError && isAdmin) {
          setUserRole('admin');
          setIsLoading(false);
          return;
        }

        // Check for manager role (gestor)
        const { data: isManager, error: managerError } = await supabase.rpc('has_role', { 
          _user_id: currentUser.id, 
          _role: 'manager' 
        });
        
        if (!managerError && isManager) {
          setUserRole('manager');
          setIsLoading(false);
          return;
        }

        // Check in notion_managers table for supervisor/gerente roles
        const { data: notionRole, error: notionError } = await supabase
          .from('j_ads_notion_managers')
          .select('role')
          .eq('email', currentUser.email)
          .single();

        if (!notionError && notionRole) {
          if (notionRole.role === 'gestor') {
            setUserRole('manager'); // Map 'gestor' to 'manager'
          } else if (notionRole.role === 'supervisor') {
            setUserRole('supervisor');
          } else if (notionRole.role === 'gerente') {
            setUserRole('gerente');
          } else {
            setUserRole('gerente'); // Default fallback
          }
        } else {
          setUserRole('gerente'); // Default fallback
        }
        
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('gerente'); // Default fallback on error
      }
      
      setIsLoading(false);
    };

    checkUserRole();
  }, [isAuthenticated, currentUser?.id, currentUser?.email]);

  // Helper function to check if user should see debug logs
  const shouldShowDebugLogs = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // Helper function to check if user is privileged (admin/gestor)
  const isPrivilegedUser = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  return {
    userRole,
    isLoading,
    shouldShowDebugLogs,
    isPrivilegedUser,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager',
    isSupervisor: userRole === 'supervisor',
    isGerente: userRole === 'gerente'
  };
};