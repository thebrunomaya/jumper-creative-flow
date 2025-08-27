#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPEZA SUPABASE
 * 
 * Remove edge functions e tabelas obsoletas do Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config(); // Load .env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Erro: Variáveis SUPABASE não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Edge functions obsoletas (que devem ser removidas do Supabase)
const OBSOLETE_FUNCTIONS = [
  'j_ads_notion_clients',
  'j_ads_notion_managers', 
  'j_ads_notion_my_accounts',
  'j_ads_notion_partners'
];

// Tabelas obsoletas (que podem ser removidas com cuidado)
const OBSOLETE_TABLES = [
  'j_ads_notion_managers',  // substituída por j_ads_notion_db_managers
  'j_ads_notion_accounts'   // substituída por dados sincronizados
];

/**
 * Lista todas as edge functions no projeto
 */
async function listEdgeFunctions() {
  console.log('📋 Listando Edge Functions no Supabase...\n');
  
  try {
    // Note: Supabase client não tem método direto para listar functions
    // Precisamos usar a API Management diretamente
    console.log('ℹ️  Para listar functions, acesse:');
    console.log('   Supabase Dashboard > Edge Functions');
    console.log('   Ou use: supabase functions list\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao listar functions:', error.message);
    return false;
  }
}

/**
 * Lista todas as tabelas no banco
 */
async function listTables() {
  console.log('📋 Verificando tabelas obsoletas no banco...\n');
  
  for (const table of OBSOLETE_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0); // Não retorna dados, só testa se existe
        
      if (error) {
        console.log(`✅ Tabela '${table}' não existe (já foi removida)`);
      } else {
        console.log(`⚠️  Tabela '${table}' ainda existe - PODE SER REMOVIDA`);
      }
    } catch (err) {
      console.log(`✅ Tabela '${table}' não existe (erro de acesso)`);
    }
  }
}

/**
 * Remove uma tabela específica
 */
async function dropTable(tableName) {
  console.log(`🗑️  Removendo tabela '${tableName}'...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
    });
    
    if (error) {
      console.error(`❌ Erro ao remover tabela '${tableName}':`, error.message);
      console.log('💡 Você pode removê-la manualmente via Supabase Dashboard > SQL Editor:');
      console.log(`   DROP TABLE IF EXISTS ${tableName} CASCADE;`);
    } else {
      console.log(`✅ Tabela '${tableName}' removida com sucesso`);
    }
  } catch (err) {
    console.error(`❌ Erro ao remover tabela '${tableName}':`, err.message);
    console.log('💡 Remova manualmente via SQL Editor no Supabase Dashboard');
  }
}

/**
 * Cria script SQL para remoção manual
 */
function generateCleanupSQL() {
  const sqlScript = `
-- 🧹 SCRIPT DE LIMPEZA SUPABASE
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Remove tabelas obsoletas
${OBSOLETE_TABLES.map(table => `DROP TABLE IF EXISTS ${table} CASCADE;`).join('\n')}

-- Verifica tabelas restantes relacionadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'j_ads%'
ORDER BY table_name;
`;

  return sqlScript;
}

/**
 * Salva script de limpeza
 */
function saveCleanupScript() {
  
  const script = generateCleanupSQL();
  const scriptPath = path.join(process.cwd(), 'temp', 'debug-files', 'supabase-cleanup.sql');
  
  // Ensure temp directory exists
  const tempDir = path.dirname(scriptPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(scriptPath, script);
  console.log(`💾 Script SQL salvo em: ${scriptPath}`);
  console.log('📋 Execute este script no Supabase Dashboard > SQL Editor');
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'list':
  case 'check':
    await listEdgeFunctions();
    await listTables();
    break;
    
  case 'tables':
    await listTables();
    break;
    
  case 'functions':
    await listEdgeFunctions();
    break;
    
  case 'sql':
  case 'script':
    saveCleanupScript();
    break;
    
  case 'drop':
    const tableName = process.argv[3];
    if (!tableName) {
      console.log('❌ Especifique o nome da tabela: npm run cleanup:supabase drop <table_name>');
      break;
    }
    await dropTable(tableName);
    break;
    
  default:
    console.log(`
🧹 SCRIPT DE LIMPEZA SUPABASE

Uso: node scripts/cleanup-supabase.js <comando>

Comandos disponíveis:
  list, check       - Lista functions e tabelas obsoletas
  tables            - Verifica apenas tabelas obsoletas  
  functions         - Lista edge functions
  sql, script       - Gera script SQL para limpeza manual
  drop <table>      - Remove tabela específica

Tabelas obsoletas identificadas:
${OBSOLETE_TABLES.map(t => `  - ${t}`).join('\n')}

Edge Functions obsoletas (remover via CLI/Dashboard):
${OBSOLETE_FUNCTIONS.map(f => `  - ${f}`).join('\n')}

Exemplos:
  node scripts/cleanup-supabase.js check
  node scripts/cleanup-supabase.js sql
  node scripts/cleanup-supabase.js drop j_ads_notion_managers
`);
}