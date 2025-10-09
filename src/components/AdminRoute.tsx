import React, { useEffect, useState } from 'react';
import LoginPageNew from './LoginPageNew';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from './Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      console.log('🔍 [AdminRoute] Starting role check...');
      console.log('🔍 [AdminRoute] isAuthenticated:', isAuthenticated);
      console.log('🔍 [AdminRoute] currentUser:', currentUser);

      if (!isAuthenticated) {
        console.log('❌ [AdminRoute] Not authenticated');
        setIsAdmin(false);
        return;
      }

      try {
        const { data: authData } = await supabase.auth.getUser();
        console.log('🔍 [AdminRoute] authData:', authData);

        const userId = currentUser?.id || authData?.user?.id || null;
        console.log('🔍 [AdminRoute] userId:', userId);

        if (!userId) {
          console.log('❌ [AdminRoute] No userId found');
          setIsAdmin(false);
          return;
        }

        console.log('🔍 [AdminRoute] Calling has_role RPC with:', { _user_id: userId, _role: 'admin' });
        const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
        console.log('🔍 [AdminRoute] has_role result:', { data, error });

        const isAdminUser = !error && !!data;
        console.log(isAdminUser ? '✅ [AdminRoute] User IS admin' : '❌ [AdminRoute] User is NOT admin');
        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error('❌ [AdminRoute] Exception during role check:', err);
        setIsAdmin(false);
      }
    };
    checkRole();
  }, [isAuthenticated, currentUser?.id]);

  if (!isAuthenticated) return <LoginPageNew />;

  if (isAdmin === null) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jumper-orange" />
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4"
          role="main"
        >
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <ShieldX className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
              <p className="text-muted-foreground">
                Você precisa ser administrador para acessar esta página.
              </p>
            </div>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
