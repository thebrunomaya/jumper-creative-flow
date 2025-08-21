import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usando service role key
);

async function checkManagers() {
  console.log('🔍 Verificando managers na tabela...\n');
  
  const { data: managers, error } = await supabase
    .from('j_ads_notion_managers')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.log('❌ Erro ao listar managers:', error);
    return;
  }
  
  console.log(`📋 Total de managers: ${managers.length}\n`);
  
  if (managers.length > 0) {
    console.table(managers.map(m => ({
      email: m.email,
      name: m.name || 'Sem nome',
      role: m.role,
      created_at: new Date(m.created_at).toLocaleString('pt-BR')
    })));
  }
  
  return managers;
}

checkManagers().catch(console.error);