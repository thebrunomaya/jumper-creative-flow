
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPageNew from './LoginPageNew';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isRecovery, setIsRecovery] = React.useState(false);

  React.useEffect(() => {
    // Verificar se é um fluxo de recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
  }, []);

  // Se for recovery, sempre mostrar LoginPageNew (mesmo se autenticado)
  if (isRecovery || !isAuthenticated) {
    return <LoginPageNew />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
