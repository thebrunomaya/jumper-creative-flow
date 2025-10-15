import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se um email está autorizado a acessar o sistema
 * usando múltiplas fontes de autorização (whitelist composta)
 */
export async function isAuthorizedEmail(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Verificando autorização para:', normalizedEmail);

    // 1. Domínio @jumper.studio sempre autorizado (staff interno)
    if (normalizedEmail.endsWith('@jumper.studio')) {
      console.log('✅ @jumper.studio domain → authorized');
      return true;
    }

    // 2. Verificar se já tem entry em j_hub_users (aprovado previamente)
    const { data: existingUser, error: userError } = await supabase
      .from('j_hub_users')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error('❌ Erro ao verificar j_hub_users:', userError);
    } else if (existingUser) {
      console.log('✅ Found in j_hub_users → authorized');
      return true;
    }

    // 3. Verificar se está em DB_Gerentes (managers externos)
    const { data: manager, error: managerError } = await supabase
      .from('j_hub_notion_db_managers')
      .select('id')
      .ilike('"E-Mail"', normalizedEmail)
      .maybeSingle();

    if (managerError) {
      console.error('❌ Erro ao verificar DB_Gerentes:', managerError);
    } else if (manager) {
      console.log('✅ Found in DB_Gerentes → authorized');
      return true;
    }

    // 4. Verificar se é Gestor ou Supervisor em alguma conta Notion
    const { data: accountRoles, error: accountError } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('notion_id')
      .or(`"Gestor".ilike.%${normalizedEmail}%,"Supervisor".ilike.%${normalizedEmail}%`)
      .limit(1);

    if (accountError) {
      console.error('❌ Erro ao verificar Notion Accounts:', accountError);
    } else if (accountRoles && accountRoles.length > 0) {
      console.log('✅ Found as Gestor/Supervisor in Notion Accounts → authorized');
      return true;
    }

    // 5. Não encontrado em nenhuma fonte
    console.log('❌ Email not found in any authorization source');
    return false;

  } catch (error) {
    console.error('❌ Erro inesperado ao verificar autorização:', error);
    return false;
  }
}

/**
 * Verifica se usuário existe no sistema (tem conta criada)
 *
 * Strategy:
 * 1. Tenta consultar j_hub_users diretamente (mais confiável)
 * 2. Se RLS bloquear, usa fallback de tentar login com senha fake
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Checking if user exists:', normalizedEmail);

    // STRATEGY 1: Try to query j_hub_users directly
    // This is the most reliable method if RLS allows it
    try {
      const { data, error } = await supabase
        .from('j_hub_users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!error) {
        const exists = !!data;
        console.log(`✅ Strategy 1 (j_hub_users query): ${exists ? 'User EXISTS' : 'User NOT FOUND'}`);
        return exists;
      }

      // If RLS blocks or other error, log and try fallback
      console.warn('⚠️ Strategy 1 failed (RLS?), trying fallback...', error.message);
    } catch (e) {
      console.warn('⚠️ Strategy 1 exception, trying fallback...', e);
    }

    // STRATEGY 2: Fallback - Try login with impossible password
    // This works even with RLS because it uses auth.users directly
    console.log('🔄 Using Strategy 2 (login fake)...');
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: 'CHECK_USER_EXISTS_DUMMY_PASSWORD_THAT_WILL_NEVER_WORK'
    });

    // If error is "Invalid login credentials", user exists
    // If error is "Email not confirmed", user also exists
    // If error is "User not found" or similar, user doesn't exist
    const exists = error?.message?.includes('Invalid login') ||
                   error?.message?.includes('Email not confirmed') ||
                   false;

    console.log(`✅ Strategy 2 (login fake): ${exists ? 'User EXISTS' : 'User NOT FOUND'}`);
    console.log(`   Error message: "${error?.message}"`);

    return exists;

  } catch (error) {
    console.error('❌ userExists() unexpected error:', error);
    return false;
  }
}
