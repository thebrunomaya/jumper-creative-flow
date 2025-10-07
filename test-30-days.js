import { createClient } from '@supabase/supabase-js';
import { startOfDay, subDays, format } from 'date-fns';

const supabase = createClient(
  'https://biwwowendjuzvpttyrlb.supabase.co',
  'sb_publishable_5CJI2QQt8Crz60Mh1TTcrw_w4sL2TpL'
);

async function test30Days() {
  const selectedPeriod = 30;
  const queryEndDate = startOfDay(subDays(new Date(), 1));
  const queryStartDate = startOfDay(subDays(queryEndDate, selectedPeriod - 1));
  
  console.log('📅 Testando com 30 dias:');
  console.log('Start:', format(queryStartDate, 'yyyy-MM-dd'));
  console.log('End:', format(queryEndDate, 'yyyy-MM-dd'));
  console.log('');
  
  const { data, error } = await supabase
    .from('j_rep_metaads_bronze')
    .select('*')
    .eq('account_id', '1131403665194299')
    .gte('date', format(queryStartDate, 'yyyy-MM-dd'))
    .lte('date', format(queryEndDate, 'yyyy-MM-dd'));
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ Registros encontrados:', data.length);
  }
}

test30Days();
