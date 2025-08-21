
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPageNew from './LoginPageNew';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPageNew />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
