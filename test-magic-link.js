import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testMagicLink() {
  const testEmail = 'gabriel@koko.ag';
  const correctRedirectUrl = 'https://ads.jumper.studio/';
  
  console.log(`🔗 Testando magic link para: ${testEmail}`);
  console.log(`📍 Redirect URL: ${correctRedirectUrl}\n`);
  
  const { error } = await supabase.auth.signInWithOtp({
    email: testEmail,
    options: { 
      emailRedirectTo: correctRedirectUrl 
    },
  });
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ Magic link enviado com sucesso!');
    console.log('📧 Verifique o email para o novo link com redirect correto');
  }
}

testMagicLink().catch(console.error);