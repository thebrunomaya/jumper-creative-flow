#!/usr/bin/env -S deno run --allow-net --allow-env

// Simulate the EXACT call that j_hub_deck_generate makes to j_hub_deck_analyze

const ANALYZE_URL = 'https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/j_hub_deck_analyze';

const testPayload = {
  markdown_source: `# Teste Report

## Executive Summary
This is a test report to validate the 3-stage architecture.

## Key Metrics
- CPA: R$ 2.50
- CTR: 3.2%
- Impressions: 50K

## Weekly Evolution
- Semana 1: CPA R$ 3.00
- Semana 2: CPA R$ 2.80
- Semana 3: CPA R$ 2.50
`,
  deck_type: 'report',
  template_id: 'koko-classic'
};

console.log('🧪 Testing j_hub_deck_analyze Edge Function (End-to-End)...\n');
console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));
console.log(`\n🌐 Calling: ${ANALYZE_URL}\n`);

try {
  const response = await fetch(ANALYZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
      'authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || 'missing-key'}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') || 'missing-key'
    },
    body: JSON.stringify(testPayload)
  });

  console.log(`📥 Response status: ${response.status} ${response.statusText}`);
  console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log(`\n📄 Response body (first 500 chars):`);
  console.log(responseText.substring(0, 500));

  if (!response.ok) {
    console.error(`\n❌ REQUEST FAILED: HTTP ${response.status}`);
    console.error('Full response:', responseText);
    Deno.exit(1);
  }

  const data = JSON.parse(responseText);
  console.log('\n✅ SUCCESS! Parsed response:', {
    success: data.success,
    total_slides: data.plan?.total_slides,
    diversity_score: data.plan?.pattern_diversity_score,
    patterns_count: data.pattern_metadata?.patterns?.length
  });

} catch (error) {
  console.error('\n❌ TEST FAILED:', error);
  console.error('\nError details:', {
    message: error.message,
    name: error.name
  });
  Deno.exit(1);
}
