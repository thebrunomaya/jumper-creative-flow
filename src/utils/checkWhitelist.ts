import { supabase } from '@/integrations/supabase/client';

export interface WhitelistCheckResult {
  authorized: boolean;
  hasAccount: boolean;
  managerName?: string;
  isFirstAccess: boolean;
  status?: string;
  message?: string;
}

export async function checkEmailWhitelist(email: string): Promise<WhitelistCheckResult> {
  try {
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Verificando email:', normalizedEmail);

    // Verificar se o email está na tabela de managers do Notion
    const { data: managers, error: managerError } = await supabase
      .from('j_hub_notion_db_managers')
      .select('*')
      .ilike('E-Mail', normalizedEmail)
      .maybeSingle();

    console.log('Resultado da busca:', { managers, error: managerError });

    if (managerError) {
      console.error('Erro ao buscar manager:', managerError);
      throw managerError;
    }

    if (!managers) {
      // Email não está na whitelist
      console.log('Email não encontrado na whitelist:', normalizedEmail);
      return {
        authorized: false,
        hasAccount: false,
        isFirstAccess: false,
        message: 'Email não autorizado. Entre em contato com seu gestor.'
      };
    }

    // Verificar se já tem conta no Supabase Auth
    // Tentamos fazer login com senha vazia para verificar se o usuário existe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: 'CHECK_USER_EXISTS_DUMMY_PASSWORD_THAT_WILL_NEVER_WORK'
    });

    // Se o erro for "Invalid login credentials", o usuário existe
    // Se for outro erro, o usuário não existe
    const userExists = signInError?.message?.includes('Invalid login credentials') || false;

    return {
      authorized: true,
      hasAccount: userExists,
      managerName: managers.Nome || '',
      isFirstAccess: !userExists,
      status: 'active'
    };

  } catch (error) {
    console.error('Erro ao verificar whitelist:', error);
    return {
      authorized: false,
      hasAccount: false,
      isFirstAccess: false,
      message: 'Erro ao verificar autorização. Tente novamente.'
    };
  }
}