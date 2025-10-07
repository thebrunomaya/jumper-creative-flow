import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

console.log('🔍 Testando novas chaves do Supabase...\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('📋 Verificando chaves:');
console.log('URL:', supabaseUrl);
console.log('Publishable Key:', publishableKey?.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, publishableKey);

async function testConnection() {
  try {
    console.log('🧪 Teste: Buscar dados da tabela j_rep_metaads_bronze');
    console.log('Account ID: 1131403665194299\n');
    
    const { data, error, count } = await supabase
      .from('j_rep_metaads_bronze')
      .select('*', { count: 'exact' })
      .eq('account_id', '1131403665194299')
      .limit(3);
    
    if (error) {
      console.log('❌ Erro:', error.message);
      console.log('Código:', error.code);
      console.log('Detalhes:', error.details);
      console.log('Hint:', error.hint);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('Total de registros encontrados:', count);
    console.log('Primeiros 3 registros:', data?.length);
    
    if (data && data.length > 0) {
      console.log('\n📊 Campos disponíveis:');
      console.log(Object.keys(data[0]).join(', '));
      
      console.log('\n📅 Primeira data:', data[0].date);
      console.log('💰 Primeiro spend:', data[0].spend);
      console.log('👁️  Primeiras impressões:', data[0].impressions);
    }
    
  } catch (err) {
    console.log('❌ Erro na execução:', err.message);
  }
}

testConnection();
