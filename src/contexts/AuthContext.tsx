import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Temporary compatibility type to avoid breaking existing components
interface ManagerCompat {
  id: string;
  name: string;
  email?: string;
  password?: string; // will be undefined; kept only for legacy code paths
  accounts?: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  signup: (email: string, password: string) => Promise<{ error?: any }>;
  loginWithMagicLink: (email: string) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  // Legacy field for backward compatibility
  currentUser: ManagerCompat | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Ensure the user has at least a default role after auth
  const ensureUserRole = async () => {
    try {
      await supabase.functions.invoke('j_ads_auth_roles', { body: {} });
    } catch (e) {
      console.error('ensure-role invocation failed', e);
    }
  };
  useEffect(() => {
    // Subscribe to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setTimeout(() => { ensureUserRole(); }, 0);
    }
    return { error };
  };

  const signup = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (!error) {
      setTimeout(() => { ensureUserRole(); }, 0);
    }
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const loginWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (!error) {
      setTimeout(() => { ensureUserRole(); }, 0);
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  // Build a backward-compat currentUser object so existing UI keeps working
  const currentUser: ManagerCompat | null = useMemo(() => {
    if (!user) return null;
    const email = user.email || '';
    const name = email ? email.split('@')[0] : 'Usuário';
    return {
      id: user.id,
      name,
      email,
      password: undefined,
      accounts: [],
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithMagicLink,
    resetPassword,
    logout,
    currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
