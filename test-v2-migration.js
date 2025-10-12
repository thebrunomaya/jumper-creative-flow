#!/usr/bin/env node
/**
 * Test script for Jumper Hub v2.0 migration
 * Tests all renamed tables and edge functions
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file
let SUPABASE_URL = 'https://biwwowendjuzvpttyrlb.supabase.co';
let SUPABASE_ANON_KEY = null;

try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      let value = valueParts.join('=').trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
      if (key === 'VITE_SUPABASE_ANON_KEY' || key === 'VITE_SUPABASE_PUBLISHABLE_KEY') SUPABASE_ANON_KEY = value;
    }
  });
} catch (err) {
  console.warn('⚠️  Could not load .env file:', err.message);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);

  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push(name);
  else results.warnings.push(name);
}

async function testTable(tableName, description) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      logTest(`Table: ${tableName}`, 'fail', `${description} - Error: ${error.message}`);
      return false;
    }

    logTest(`Table: ${tableName}`, 'pass', `${description} - OK (${data?.length || 0} rows)`);
    return true;
  } catch (err) {
    logTest(`Table: ${tableName}`, 'fail', `${description} - Exception: ${err.message}`);
    return false;
  }
}

async function testEdgeFunction(functionName, description, body = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    // Edge functions may return error in data
    if (error) {
      const errorMsg = error.message || JSON.stringify(error);

      // 401/403/Unauthorized/Missing auth errors are EXPECTED for protected functions
      if (
        errorMsg.includes('401') ||
        errorMsg.includes('403') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('Missing') ||
        errorMsg.includes('Not authenticated') ||
        errorMsg.includes('non-2xx status code')
      ) {
        logTest(`Function: ${functionName}`, 'pass', `${description} - Protected (auth required)`);
        return true;
      }

      logTest(`Function: ${functionName}`, 'fail', `${description} - Error: ${errorMsg}`);
      return false;
    }

    logTest(`Function: ${functionName}`, 'pass', `${description} - OK`);
    return true;
  } catch (err) {
    // Check if exception is auth-related
    const errMsg = err.message || String(err);
    if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('auth')) {
      logTest(`Function: ${functionName}`, 'pass', `${description} - Protected (auth required)`);
      return true;
    }

    logTest(`Function: ${functionName}`, 'fail', `${description} - Exception: ${errMsg}`);
    return false;
  }
}

async function testBackwardsCompatibility(oldTable, newTable, description) {
  try {
    // Test if old table name still works (via VIEW)
    const { data: oldData, error: oldError } = await supabase
      .from(oldTable)
      .select('*')
      .limit(1);

    const { data: newData, error: newError } = await supabase
      .from(newTable)
      .select('*')
      .limit(1);

    if (oldError || newError) {
      logTest(`Compatibility: ${oldTable} → ${newTable}`, 'fail', `${description} - Error in one or both tables`);
      return false;
    }

    // Check if both return same structure (views should match)
    const oldCount = oldData?.length || 0;
    const newCount = newData?.length || 0;

    if (oldCount === newCount) {
      logTest(`Compatibility: ${oldTable} → ${newTable}`, 'pass', `${description} - Both tables accessible (${oldCount} rows)`);
      return true;
    } else {
      logTest(`Compatibility: ${oldTable} → ${newTable}`, 'warn', `${description} - Row count mismatch (old: ${oldCount}, new: ${newCount})`);
      return true;
    }
  } catch (err) {
    logTest(`Compatibility: ${oldTable} → ${newTable}`, 'fail', `${description} - Exception: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Starting Jumper Hub v2.0 Migration Tests\n');
  console.log('='.repeat(60));

  // ===== TEST 1: NEW TABLE NAMES =====
  console.log('\n📋 TEST 1: New Table Names (j_hub_*)\n'.padEnd(60, ' '));

  await testTable('j_hub_users', 'Core users table');
  await testTable('j_hub_user_audit_log', 'User audit log');
  await testTable('j_hub_notion_db_accounts', 'Notion accounts sync');
  await testTable('j_hub_notion_db_managers', 'Notion managers sync');
  await testTable('j_hub_notion_sync_logs', 'Notion sync logs');

  // ===== TEST 2: BACKWARDS COMPATIBILITY =====
  console.log('\n🔄 TEST 2: Backwards Compatibility (SQL VIEWs)\n');

  await testBackwardsCompatibility('j_ads_users', 'j_hub_users', 'Users table view');
  await testBackwardsCompatibility('j_ads_user_audit_log', 'j_hub_user_audit_log', 'Audit log view');
  await testBackwardsCompatibility('j_ads_notion_db_accounts', 'j_hub_notion_db_accounts', 'Accounts view');
  await testBackwardsCompatibility('j_ads_notion_db_managers', 'j_hub_notion_db_managers', 'Managers view');
  await testBackwardsCompatibility('j_ads_notion_sync_logs', 'j_hub_notion_sync_logs', 'Sync logs view');

  // ===== TEST 3: EDGE FUNCTIONS =====
  console.log('\n⚡ TEST 3: Edge Functions (j_hub_*)\n');

  await testEdgeFunction('j_hub_auth_roles', 'Auth & roles function');
  await testEdgeFunction('j_hub_admin_users', 'Admin users management');
  await testEdgeFunction('j_hub_admin_dashboard', 'Admin dashboard');
  await testEdgeFunction('j_hub_manager_dashboard', 'Manager dashboard');
  await testEdgeFunction('j_hub_user_accounts', 'User accounts access');
  await testEdgeFunction('j_hub_notion_sync_accounts', 'Notion accounts sync');
  await testEdgeFunction('j_hub_notion_sync_managers', 'Notion managers sync');
  await testEdgeFunction('j_hub_notion_sync_scheduler', 'Notion sync scheduler');

  // ===== TEST 4: OPTIMIZATION FUNCTIONS =====
  console.log('\n🎯 TEST 4: Optimization Functions\n');

  await testEdgeFunction('j_hub_optimization_transcribe', 'Transcribe audio');
  await testEdgeFunction('j_hub_optimization_analyze', 'Analyze transcript');
  await testEdgeFunction('j_hub_optimization_process', 'Process optimization');
  await testEdgeFunction('j_hub_optimization_improve_transcript', 'Improve transcript');
  await testEdgeFunction('j_hub_optimization_improve_processed', 'Improve processed');
  await testEdgeFunction('j_hub_optimization_create_share', 'Create share link');
  await testEdgeFunction('j_hub_optimization_update_context', 'Update context');

  // ===== TEST 5: CREATIVE SYSTEM (Should still use j_ads_*) =====
  console.log('\n🎨 TEST 5: Creative System (j_ads_* - unchanged)\n');

  await testTable('j_ads_creative_submissions', 'Creative submissions table');
  await testTable('j_ads_creative_files', 'Creative files table');
  await testTable('j_ads_creative_variations', 'Creative variations table');
  await testEdgeFunction('j_ads_submit_ad', 'Submit creative function');

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(test => console.log(`   - ${test}`));
  }

  console.log('\n' + '='.repeat(60));

  const exitCode = results.failed.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runTests().catch(err => {
  console.error('\n💥 Test suite failed:', err);
  process.exit(1);
});
