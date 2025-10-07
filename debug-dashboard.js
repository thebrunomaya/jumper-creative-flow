import { createClient } from '@supabase/supabase-js';
import { startOfDay, subDays, format } from 'date-fns';

const supabase = createClient(
  'https://biwwowendjuzvpttyrlb.supabase.co',
  'sb_publishable_5CJI2QQt8Crz60Mh1TTcrw_w4sL2TpL'
);

async function debugDashboard() {
  const selectedPeriod = 7;
  const metaAdsAccountId = '1131403665194299';
  
  // Lógica atual do dashboard
  const queryEndDate = startOfDay(subDays(new Date(), 1));
  const queryStartDate = startOfDay(subDays(queryEndDate, selectedPeriod - 1));
  
  console.log('📅 Datas calculadas:');
  console.log('Start:', format(queryStartDate, 'yyyy-MM-dd'));
  console.log('End:', format(queryEndDate, 'yyyy-MM-dd'));
  console.log('');
  
  console.log('🔍 Query sendo executada:');
  console.log(`Account ID: ${metaAdsAccountId}`);
  console.log(`Period: ${selectedPeriod} days`);
  console.log('');
  
  const { data, error } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*')
    .eq('account_id', metaAdsAccountId)
    .gte('date', format(queryStartDate, 'yyyy-MM-dd'))
    .lte('date', format(queryEndDate, 'yyyy-MM-dd'))
    .order('date', { ascending: false });
  
  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('Código:', error.code);
    console.log('Detalhes:', error);
    return;
  }
  
  console.log('✅ Query executada com sucesso!');
  console.log('Registros encontrados:', data.length);
  
  if (data.length > 0) {
    console.log('\n📊 Primeiras 3 datas:');
    data.slice(0, 3).forEach(row => {
      console.log(`  - ${row.date}: ${row.spend} BRL, ${row.impressions} impressões`);
    });
  } else {
    console.log('\n⚠️  Nenhum registro no período especificado');
    console.log('Verificando todas as datas disponíveis...');
    
    const { data: allDates } = await supabase
      .from('j_rep_metaads_bronze')
      .select('date')
      .eq('account_id', metaAdsAccountId)
      .order('date', { ascending: false })
      .limit(10);
    
    if (allDates) {
      console.log('Últimas 10 datas disponíveis:');
      allDates.forEach(row => console.log(`  - ${row.date}`));
    }
  }
}

debugDashboard();
