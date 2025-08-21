import React, { useEffect, useState } from 'react';
import LoginPageNew from './LoginPageNew';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        return;
      }
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = currentUser?.id || authData?.user?.id || null;
        if (!userId) {
          setIsAdmin(false);
          return;
        }
        const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
        setIsAdmin(!error && !!data);
      } catch {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, [isAuthenticated, currentUser?.id]);

  if (!isAuthenticated) return <LoginPageNew />;
  if (isAdmin === null) return <div className="flex items-center justify-center min-h-screen">Verificando permissões...</div>; 
  if (!isAdmin) return <div className="flex items-center justify-center min-h-screen text-destructive">Acesso negado. Você precisa ser administrador para acessar esta página.</div>;

  return <>{children}</>;
};

export default AdminRoute;
