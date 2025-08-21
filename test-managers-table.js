import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
config();

// Se as variáveis não estiverem disponíveis, tentar ler diretamente do .env
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let projectId = process.env.VITE_SUPABASE_PROJECT_ID;

// Construir URL se necessário
if (!supabaseUrl && projectId) {
  supabaseUrl = `https://${projectId}.supabase.co`;
}

if (!supabaseUrl || !supabaseKey) {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
      }
      if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
        supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
      }
      if (line.startsWith('VITE_SUPABASE_PROJECT_ID=') && !supabaseUrl) {
        const id = line.split('=')[1].trim().replace(/"/g, '');
        supabaseUrl = `https://${id}.supabase.co`;
      }
    });
  } catch (e) {
    console.error('Erro ao ler .env:', e);
  }
}

console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  console.log('🔍 Verificando tabela j_ads_notion_managers...\n');
  
  // 1. Verificar se a tabela existe
  const { data: checkData, error: checkError } = await supabase
    .from('j_ads_notion_managers')
    .select('*')
    .limit(1);
    
  if (checkError) {
    console.log('❌ Erro ao acessar tabela:', checkError.message);
    console.log('Detalhes:', checkError);
    return;
  }
  
  console.log('✅ Tabela existe e está acessível');
  
  // 2. Listar managers existentes
  const { data: managers, error: listError } = await supabase
    .from('j_ads_notion_managers')
    .select('*');
    
  if (listError) {
    console.log('❌ Erro ao listar managers:', listError);
  } else {
    console.log(`\n📋 Managers existentes: ${managers.length}`);
    if (managers.length > 0) {
      console.table(managers.map(m => ({
        email: m.email,
        name: m.name,
        role: m.role,
        notion_id: m.notion_id
      })));
    }
  }
  
  // 3. Tentar inserir um manager de teste
  console.log('\n🧪 Tentando inserir manager de teste...');
  
  const testManager = {
    email: 'teste.debug@empresa.com',
    name: 'Debug Test',
    notion_id: 'debug-notion-id',
    role: 'gerente'
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('j_ads_notion_managers')
    .insert([testManager])
    .select();
    
  if (insertError) {
    console.log('❌ Erro ao inserir:', insertError.message);
    console.log('Detalhes do erro:', insertError);
    
    // Se for erro de duplicata, tentar upsert
    if (insertError.code === '23505') {
      console.log('\n🔄 Tentando upsert...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('j_ads_notion_managers')
        .upsert([testManager], { onConflict: 'email' })
        .select();
        
      if (upsertError) {
        console.log('❌ Erro no upsert:', upsertError);
      } else {
        console.log('✅ Upsert bem-sucedido:', upsertData);
      }
    }
  } else {
    console.log('✅ Inserção bem-sucedida:', insertData);
  }
  
  // 4. Verificar estrutura da tabela
  console.log('\n🔍 Verificando estrutura esperada...');
  const { data: sampleData } = await supabase
    .from('j_ads_notion_managers')
    .select('*')
    .limit(1)
    .single();
    
  if (sampleData) {
    console.log('Campos disponíveis:', Object.keys(sampleData));
  }
}

testTable().catch(console.error);