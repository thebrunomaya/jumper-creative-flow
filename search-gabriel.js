import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function searchGabriel() {
  console.log('🔍 Buscando todos os emails que contêm "gabriel"...\n');
  
  const { data: managers, error } = await supabase
    .from('j_ads_notion_managers')
    .select('email, name, role')
    .ilike('email', '%gabriel%');
    
  if (error) {
    console.log('❌ Erro:', error);
    return;
  }
  
  console.log(`📊 Encontrados ${managers.length} resultado(s):`);
  if (managers.length > 0) {
    console.table(managers);
  }
  
  // Também buscar por "koko"
  console.log('\n🔍 Buscando emails que contêm "koko"...\n');
  
  const { data: kokoManagers, error: kokoError } = await supabase
    .from('j_ads_notion_managers')
    .select('email, name, role')
    .ilike('email', '%koko%');
    
  if (kokoError) {
    console.log('❌ Erro:', kokoError);
    return;
  }
  
  console.log(`📊 Encontrados ${kokoManagers.length} resultado(s):`);
  if (kokoManagers.length > 0) {
    console.table(kokoManagers);
  }
  
  // Listar todos os emails para comparar
  console.log('\n📋 Todos os emails na tabela:');
  const { data: allManagers, error: allError } = await supabase
    .from('j_ads_notion_managers')
    .select('email, name')
    .order('email');
    
  if (allError) {
    console.log('❌ Erro:', allError);
    return;
  }
  
  allManagers.forEach((manager, index) => {
    console.log(`${index + 1}. ${manager.email} (${manager.name})`);
  });
}

searchGabriel().catch(console.error);