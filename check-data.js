import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('🔍 Verificando dados na tabela j_rep_metaads_bronze...\n');
  
  // 1. Verificar se a tabela existe e quantos registros tem
  const { data: allData, error: allError, count } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*', { count: 'exact', head: true });
  
  if (allError) {
    console.log('❌ Erro ao acessar tabela:', allError.message);
    return;
  }
  
  console.log(`✅ Tabela existe com ${count} registros totais\n`);
  
  // 2. Verificar account_ids únicos disponíveis
  const { data: accounts, error: accountsError } = await supabase
    .from('j_rep_metaads_bronze')
    .select('account_id')
    .limit(1000);
  
  if (accounts) {
    const uniqueAccounts = [...new Set(accounts.map(a => a.account_id))];
    console.log(`📊 Account IDs únicos encontrados (${uniqueAccounts.length}):`);
    uniqueAccounts.forEach(id => console.log(`  - ${id}`));
    console.log('');
  }
  
  // 3. Verificar dados específicos para o ID 1131403665194299
  const targetAccountId = '1131403665194299';
  const { data: targetData, error: targetError } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*')
    .eq('account_id', targetAccountId)
    .limit(5);
  
  console.log(`🎯 Dados para account_id ${targetAccountId}:`);
  if (targetError) {
    console.log('❌ Erro:', targetError.message);
  } else if (!targetData || targetData.length === 0) {
    console.log('⚠️  Nenhum registro encontrado para este account_id');
  } else {
    console.log(`✅ ${targetData.length} registros encontrados (mostrando primeiros 5)`);
    console.log(JSON.stringify(targetData[0], null, 2));
  }
  
  // 4. Verificar estrutura da tabela (primeiros campos)
  const { data: sampleRow } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*')
    .limit(1)
    .single();
  
  if (sampleRow) {
    console.log('\n📋 Estrutura da tabela (campos disponíveis):');
    console.log(Object.keys(sampleRow).join(', '));
  }
}

checkData().catch(console.error);
