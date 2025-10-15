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
  loginWithNotion: () => Promise<{ error?: any }>;
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
  const [managerName, setManagerName] = useState<string | null>(null);

  // Ensure the user has at least a default role after auth
  const ensureUserRole = async () => {
    try {
      // Get current session to ensure JWT is included
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('⚠️ ensure-role: No session/token available yet');
        return;
      }

      console.log('🔧 Calling j_hub_auth_roles edge function...');

      // Explicitly pass Authorization header with JWT
      const { data, error } = await supabase.functions.invoke('j_hub_auth_roles', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('❌ ensure-role invocation failed:', error);
        // Don't throw - allow login to proceed even if edge function fails
        return;
      }

      console.log('✅ Edge function j_hub_auth_roles succeeded:', data);

      // After role is ensured, verify if user is active
      console.log('🔍 Checking if user is active...');
      const { data: userData, error: userError } = await supabase
        .from('j_hub_users')
        .select('is_active, role, nome')
        .eq('id', session.user.id)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      if (userError) {
        console.error('❌ Error checking user status (RLS?):', userError.message);
        // Don't logout on query error - might be RLS or timing issue
        // User was just authenticated, let them in
        console.warn('⚠️ Skipping is_active check due to query error');
        return;
      }

      if (!userData) {
        console.warn('⚠️ User not found in j_hub_users yet (timing issue?)');
        // Edge function just ran, entry might not be visible yet due to RLS or timing
        // Don't logout, allow login to proceed
        return;
      }

      if (!userData.is_active) {
        // User explicitly marked as inactive - force logout
        console.warn('⚠️ User is inactive - logging out');
        await supabase.auth.signOut();
        throw new Error('Conta desativada. Entre em contato com o administrador.');
      }

      console.log('✅ User is active:', {
        email: session.user.email,
        role: userData.role,
        nome: userData.nome
      });

    } catch (e) {
      console.error('❌ ensure-role unexpected error:', e);
      // Only re-throw if it's the "inactive account" error
      if (e instanceof Error && e.message.includes('desativada')) {
        throw e;
      }
      // For other errors, log but don't prevent login
      console.warn('⚠️ Allowing login despite ensure-role error');
    }
  };
  useEffect(() => {
    // Subscribe to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔐 Auth state changed:', event, newSession?.user?.email);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Clean OAuth hash from URL after successful login
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        console.log('🧹 Cleaning OAuth hash from URL');
        // Remove hash without triggering navigation
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
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

  // Fetch manager name from database when user changes
  useEffect(() => {
    const fetchManagerName = async () => {
      if (!user?.email) {
        setManagerName(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('j_hub_notion_db_managers')
          .select('"Nome"')  // Campo com letra maiúscula e aspas
          .ilike('"E-Mail"', user.email)  // Campo "E-Mail" com hífen
          .limit(1)
          .maybeSingle();  // Aceita 0 ou 1 resultado (evita erro 406)

        if (!error && data?.Nome) {
          console.log('✅ Nome encontrado no banco:', data.Nome);
          setManagerName(data.Nome);
        } else if (error) {
          console.log('⚠️ Erro ao buscar nome:', error.message);
        }
      } catch (e) {
        // Silently fail - will use metadata fallback
        console.debug('Could not fetch manager name from database:', e);
      }
    };

    fetchManagerName();
  }, [user?.email]);

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

  const loginWithNotion = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'notion',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'email', // Request email scope to get user info
      }
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

    // Debug: Log what we have
    console.log('👤 User metadata:', {
      full_name: user.user_metadata?.full_name,
      name: user.user_metadata?.name,
      display_name: user.user_metadata?.display_name,
      identity_name: user.identities?.[0]?.identity_data?.name,
      managerName: managerName,
    });

    // Try to get name from various sources in order of preference:
    // 1. user_metadata.full_name (OAuth - Notion has this as "Bruno Maya") ⭐
    // 2. user_metadata.name (OAuth - Notion also has this)
    // 3. managerName (from j_hub_notion_db_managers table - only for Gerentes)
    // 4. user_metadata.display_name (other providers)
    // 5. identities[0].identity_data.name (raw OAuth data)
    // 6. email split as fallback
    const rawName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || managerName
      || user.user_metadata?.display_name
      || user.identities?.[0]?.identity_data?.name
      || user.email?.split('@')[0]
      || 'Usuário';

    // Capitalize first letter only if it's from email split
    const needsCapitalization = rawName === user.email?.split('@')[0];
    const name = needsCapitalization
      ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
      : rawName;

    console.log('✅ Nome final usado:', name);

    return {
      id: user.id,
      name,
      email,
      password: undefined,
      accounts: [],
    };
  }, [user, managerName]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithMagicLink,
    loginWithNotion,
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
