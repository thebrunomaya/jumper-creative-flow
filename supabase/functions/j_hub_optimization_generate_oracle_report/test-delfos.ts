/**
 * DELFOS Prompt Test Script
 *
 * Run this manually to test the DELFOS prompt with real context data.
 *
 * Usage:
 * 1. Set your ANTHROPIC_API_KEY environment variable
 * 2. Run: deno run --allow-net --allow-env test-delfos.ts
 */

import { buildDelfosPrompt } from './prompts/builder.ts';

// Test context (Clínica Seven example from documentation)
const TEST_CONTEXT = {
  summary: "Reestruturação completa da campanha principal devido a CPA elevado. Mix 2 pausado por baixa performance. Budget de fim de semana reduzido para otimizar custo por conversão.",
  actions_taken: [
    {
      type: "restructure_campaign",
      target: "Campanha Jumper - Principal",
      reason: "CPA de R$ 7.000 no início do dia, muito acima do target de R$ 1.500",
      expected_impact: "Redução de CPA através de distribuição inteligente de budget via CBO",
      metrics_before: { cpa: 7000, format: "ABO" },
      metrics_after: { cpa: 1875, format: "CBO" }
    },
    {
      type: "pause_adset",
      target: "Mix 2 - Criativos Antigos",
      reason: "Performance consistentemente abaixo das outras combinações de criativos",
      expected_impact: "Redirecionar budget para mixes com melhor ROAS e CPA"
    },
    {
      type: "reduce_budget",
      target: "Budget fim de semana (Sábado e Domingo)",
      reason: "Análise histórica mostra CPA 35% mais alto nos finais de semana",
      expected_impact: "Otimizar ROI semanal concentrando investimento em dias úteis"
    }
  ],
  metrics_mentioned: {
    cpa: 1373,
    conversions: 59,
    conversions_gator: 58,
    spend: 81000,
    cpa_start_of_day: 7000,
    cpa_after_restructure: 1875,
    improvement_percentage: 73
  },
  strategy: {
    type: "optimize",
    duration_days: 7,
    success_criteria: "Manter CPA abaixo de R$ 1.500 por 7 dias consecutivos",
    target_metric: "cpa",
    target_value: 1500
  },
  timeline: {
    reevaluate_date: "2025-10-19",
    milestones: [
      {
        date: "2025-10-15",
        description: "Avaliar impacto da reestruturação no CPA médio da semana",
        expected_metrics: { cpa: 1400 }
      }
    ]
  },
  confidence_level: "high"
};

async function testDelfosPrompt() {
  console.log('🏛️ Testing DELFOS Prompt\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Build prompt
  const prompt = buildDelfosPrompt('Clínica Seven', TEST_CONTEXT);

  console.log('📋 Prompt built successfully!');
  console.log(`📊 Prompt length: ${prompt.length} characters\n`);

  // Check if API key is available
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.log('⚠️  ANTHROPIC_API_KEY not set - showing prompt only\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('GENERATED PROMPT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(prompt);
    return;
  }

  // Call Claude API
  console.log('🤖 Calling Claude API...\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedReport = data.content[0].text;

    console.log('✅ Claude API call successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('GENERATED DELFOS REPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(generatedReport);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Validate output
    console.log('📊 VALIDATION CHECKS:\n');

    const wordCount = generatedReport.split(/\s+/).length;
    console.log(`  Word count: ${wordCount} ${wordCount >= 300 && wordCount <= 400 ? '✅' : '❌'} (target: 300-400)`);

    const hasEmoji = generatedReport.includes('🏛️');
    console.log(`  Has 🏛️ emoji: ${hasEmoji ? '✅' : '❌'}`);

    const hasSections = [
      'SITUAÇÃO',
      'AÇÕES REALIZADAS',
      'MÉTRICAS PRINCIPAIS',
      'PRÓXIMO CHECKPOINT'
    ];
    const missingSections = hasSections.filter(section => !generatedReport.includes(section));
    console.log(`  All sections present: ${missingSections.length === 0 ? '✅' : '❌'}`);
    if (missingSections.length > 0) {
      console.log(`    Missing: ${missingSections.join(', ')}`);
    }

    const hasStatusEmojis = /[✅⚠️❌]/.test(generatedReport);
    console.log(`  Has status emojis: ${hasStatusEmojis ? '✅' : '❌'}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Calculate cost
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const estimatedCost = (inputTokens * 0.003 / 1000) + (outputTokens * 0.015 / 1000);

    console.log('💰 COST ANALYSIS:\n');
    console.log(`  Input tokens: ${inputTokens}`);
    console.log(`  Output tokens: ${outputTokens}`);
    console.log(`  Estimated cost: $${estimatedCost.toFixed(4)}\n`);

  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
  }
}

// Run test
if (import.meta.main) {
  testDelfosPrompt();
}
