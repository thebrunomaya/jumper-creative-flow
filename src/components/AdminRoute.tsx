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
