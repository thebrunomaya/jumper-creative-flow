import React, { useEffect, useState } from 'react';
import LoginPage from './LoginPage';
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

  if (!isAuthenticated) return <LoginPage />;
  if (isAdmin === null) return null; // keep blank while checking role
  if (!isAdmin) return null; // optionally render 404 or nothing to avoid leaking admin UI

  return <>{children}</>;
};

export default AdminRoute;
