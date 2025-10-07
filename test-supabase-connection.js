import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

console.log('🔍 Testando conexão com Supabase...\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Variáveis de ambiente:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não encontrada');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Definida' : '❌ Não encontrada');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🧪 Teste 1: Conexão básica com tabela j_rep_metaads_bronze');
    const { data: testData, error: testError, count } = await supabase
      .from('j_rep_metaads_bronze')
      .select('account_id', { count: 'exact' })
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro:', testError.message);
      console.log('Detalhes:', testError);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida! Total de registros:', count);
    console.log('');
    
    console.log('🧪 Teste 2: Buscar dados para account_id = 1131403665194299');
    const { data: accountData, error: accountError } = await supabase
      .from('j_rep_metaads_bronze')
      .select('*')
      .eq('account_id', '1131403665194299')
      .limit(5);
    
    if (accountError) {
      console.log('❌ Erro:', accountError.message);
      return;
    }
    
    console.log('✅ Encontrados', accountData?.length || 0, 'registros');
    
    if (accountData && accountData.length > 0) {
      console.log('\n📊 Primeiro registro (campos disponíveis):');
      console.log(Object.keys(accountData[0]).join(', '));
      console.log('\n📅 Valor do campo date (se existir):');
      console.log('date:', accountData[0].date);
    }
    
    console.log('\n🧪 Teste 3: Verificar datas disponíveis');
    const { data: dateData, error: dateError } = await supabase
      .from('j_rep_metaads_bronze')
      .select('date')
      .eq('account_id', '1131403665194299')
      .order('date', { ascending: false })
      .limit(5);
    
    if (dateData && dateData.length > 0) {
      console.log('✅ Últimas 5 datas disponíveis:');
      dateData.forEach(row => console.log('  -', row.date));
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testConnection();
