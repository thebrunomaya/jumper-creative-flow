import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  const targetAccountId = '965811332434181';
  
  console.log('🔍 Investigando dados da Clínica Seven...\n');
  
  // 1. Check all distinct account_ids in the table
  const { data: allAccounts } = await supabase
    .from('j_rep_metaads_bronze')
    .select('account_id')
    .limit(1000);
  
  const uniqueIds = [...new Set(allAccounts?.map(a => a.account_id))];
  console.log('📋 Account IDs únicos na tabela:', uniqueIds.length);
  console.log('Sample:', uniqueIds.slice(0, 10));
  
  // 2. Check if the target ID exists (exact match)
  const { data: exactMatch, count: exactCount } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', targetAccountId);
  
  console.log(`\n✅ Registros com account_id = "${targetAccountId}": ${exactCount || 0}`);
  
  // 3. Check partial matches or similar IDs
  const { data: partialMatch, count: partialCount } = await supabase
    .from('j_rep_metaads_bronze')
    .select('account_id', { count: 'exact' })
    .like('account_id', `%${targetAccountId.slice(-8)}%`);
  
  console.log(`\n🔍 IDs contendo "${targetAccountId.slice(-8)}": ${partialCount || 0}`);
  if (partialMatch && partialMatch.length > 0) {
    console.log('IDs encontrados:', [...new Set(partialMatch.map(m => m.account_id))]);
  }
  
  // 4. Check date range of all data
  const { data: dateRange } = await supabase
    .from('j_rep_metaads_bronze')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);
  
  if (dateRange && dateRange[0]) {
    console.log(`\n📅 Data mais recente na tabela: ${dateRange[0].date}`);
  }
  
  // 5. Check if there's data for Seven with date filter
  const { data: recentData, count: recentCount } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', targetAccountId)
    .gte('date', '2025-09-28'); // Last 7 days from Oct 5
  
  console.log(`\n📊 Registros recentes (desde 2025-09-28): ${recentCount || 0}`);
}

checkData().catch(console.error);
