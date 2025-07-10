
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from './LoginPage';
import PainelGestor from '@/pages/PainelGestor';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Redirect Gestores to their specific dashboard
  if (currentUser?.funcao === 'Gestor') {
    return <PainelGestor />;
  }

  // Gerentes and Supervisores use the existing creative system
  return <>{children}</>;
};

export default ProtectedRoute;
