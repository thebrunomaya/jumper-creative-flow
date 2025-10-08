import { supabase } from '@/integrations/supabase/client';

// Função desabilitada - tabela j_ads_notion_managers não existe mais
export async function setupTestManagers() {
  console.warn('setupTestManagers is disabled - use j_ads_notion_db_managers table instead');
  return false;
}

// Função para listar managers existentes
export async function listManagers() {
  const { data, error } = await supabase
    .from('j_ads_notion_db_managers')
    .select('*');

  if (error) {
    console.error('Erro ao listar managers:', error);
    return [];
  }

  console.log('Managers existentes:', data);
  return data;
}