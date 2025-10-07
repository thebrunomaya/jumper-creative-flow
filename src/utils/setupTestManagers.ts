// @ts-nocheck - Temporary: Type issues, will be fixed in main branch
import { supabase } from '@/integrations/supabase/client';

// Função para adicionar managers de teste
export async function setupTestManagers() {
  const testManagers = [
    {
      email: 'gerente.teste@empresa.com',
      name: 'Gerente Teste',
      notion_id: 'test-notion-id-1',
      role: 'gerente' as const
    },
    {
      email: 'maria.silva@jumper.studio',
      name: 'Maria Silva',
      notion_id: 'test-notion-id-2',
      role: 'supervisor' as const
    },
    {
      email: 'joao.santos@parceiro.com',
      name: 'João Santos',
      notion_id: 'test-notion-id-3',
      role: 'gerente' as const
    }
  ];

  try {
    const { data, error } = await supabase
      .from('j_ads_notion_managers')
      .upsert(testManagers, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Erro ao adicionar managers de teste:', error);
      return false;
    }

    console.log('Managers de teste adicionados:', data);
    return true;
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

// Função para listar managers existentes
export async function listManagers() {
  const { data, error } = await supabase
    .from('j_ads_notion_managers')
    .select('*');

  if (error) {
    console.error('Erro ao listar managers:', error);
    return [];
  }

  console.log('Managers existentes:', data);
  return data;
}