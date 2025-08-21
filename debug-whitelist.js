import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function debugWhitelist() {
  const testEmail = 'gabriel@koko.ag';
  
  console.log(`🔍 Testando whitelist para: ${testEmail}\n`);
  
  // 1. Normalizar email
  const normalizedEmail = testEmail.toLowerCase().trim();
  console.log(`📧 Email normalizado: ${normalizedEmail}`);
  
  // 2. Buscar na tabela
  const { data: managers, error: managerError } = await supabase
    .from('j_ads_notion_managers')
    .select('email, name, role')
    .eq('email', normalizedEmail)
    .maybeSingle();
    
  console.log('\n📊 Resultado da consulta:');
  console.log('- Data:', managers);
  console.log('- Error:', managerError);
  
  if (!managers) {
    console.log('\n❌ Email não encontrado na whitelist');
    return;
  }
  
  console.log('\n✅ Email encontrado:');
  console.table([{
    email: managers.email,
    name: managers.name,
    role: managers.role
  }]);
  
  // 3. Testar se usuário já existe
  console.log('\n🔍 Verificando se usuário já existe...');
  
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: 'CHECK_USER_EXISTS_DUMMY_PASSWORD_THAT_WILL_NEVER_WORK'
  });
  
  console.log('- Sign in error:', signInError?.message);
  
  const userExists = signInError?.message?.includes('Invalid login credentials') || false;
  console.log(`- Usuário existe: ${userExists}`);
  
  const result = {
    authorized: true,
    hasAccount: userExists,
    managerName: managers.name || '',
    isFirstAccess: !userExists,
    status: 'active'
  };
  
  console.log('\n🎯 Resultado final:');
  console.table([result]);
}

debugWhitelist().catch(console.error);