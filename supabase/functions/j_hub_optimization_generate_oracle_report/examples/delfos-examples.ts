/**
 * DELFOS Few-Shot Examples
 *
 * These examples train the model to generate consistent DELFOS reports.
 * Each example represents a different optimization scenario.
 */

export const DELFOS_EXAMPLES = [
  {
    scenario: "Optimize - High CPA, Campaign Restructure",
    input: {
      account_name: "Clínica Seven",
      context: {
        summary: "Reestruturação completa da campanha principal devido a CPA elevado. Mix 2 pausado por baixa performance. Budget de fim de semana reduzido.",
        actions_taken: [
          {
            type: "restructure_campaign",
            target: "Campanha Jumper - Principal",
            reason: "CPA de R$ 7.000 no início do dia, muito acima do target",
            expected_impact: "Redução de CPA através de distribuição inteligente de budget",
            metrics_before: { cpa: 7000 },
            metrics_after: { cpa: 1875 }
          },
          {
            type: "pause_adset",
            target: "Mix 2 - Criativos Antigos",
            reason: "Performance consistentemente abaixo das outras combinações",
            expected_impact: "Redirecionar budget para mixes com melhor ROAS"
          },
          {
            type: "reduce_budget",
            target: "Budget fim de semana",
            reason: "Historicamente, conversões são mais caras nos finais de semana",
            expected_impact: "Otimizar investimento para dias com melhor CPA"
          }
        ],
        metrics_mentioned: {
          cpa: 1373,
          conversions: 59,
          spend: 81000,
          cpa_previous: 7000,
          cpa_after_restructure: 1875
        },
        strategy: {
          type: "optimize",
          duration_days: 7,
          success_criteria: "Manter CPA abaixo de R$ 1.500",
          target_metric: "cpa",
          target_value: 1500
        },
        timeline: {
          reevaluate_date: "2025-10-19",
          milestones: [
            {
              date: "2025-10-15",
              description: "Avaliar impacto da reestruturação no CPA médio da semana"
            }
          ]
        }
      }
    },
    expected_output: `🏛️ DELFOS - Clínica Seven | 12 Out 2025

SITUAÇÃO:
CPA iniciou em R$ 7.000, exigindo reestruturação urgente da campanha principal para viabilizar operação.

AÇÕES REALIZADAS:
• Reestruturou Campanha Jumper (ABO → CBO) → CPA insustentável de R$ 7.000 → Redução para R$ 1.875 (73% de melhoria)
• Pausou Mix 2 (Criativos Antigos) → Performance consistentemente inferior aos outros mixes → Redirecionar budget para mixes eficientes
• Reduziu budget fim de semana em 21% → Conversões historicamente mais caras em Sáb/Dom → Otimizar ROI semanal

MÉTRICAS PRINCIPAIS:
• CPA: R$ 1.373 ⚠️ Dentro do aceitável mas precisa manter abaixo de R$ 1.500
• Conversões: 59 ✅ Volume saudável para o investimento
• Investimento: R$ 81.000 ✅ Distribuição otimizada pós-reestruturação
• CPA Campanha Principal: R$ 1.875 ⚠️ Melhorou 73% mas ainda monitora

PRÓXIMO CHECKPOINT: 15 Out 2025 - Avaliar CPA médio semanal pós-reestruturação`
  },

  {
    scenario: "Scale - Good Performance, Budget Increase",
    input: {
      account_name: "Loja Integrada",
      context: {
        summary: "Performance excelente com ROAS de 4.2x. Aumentando budget em 40% para escalar resultados mantendo eficiência.",
        actions_taken: [
          {
            type: "increase_budget",
            target: "Campanha - Vendas Q4",
            reason: "ROAS de 4.2x consistente nos últimos 7 dias",
            expected_impact: "Aumentar volume de vendas mantendo ROAS acima de 3.5x",
            metrics_before: { budget: 15000, roas: 4.2 },
            metrics_after: { budget: 21000 }
          },
          {
            type: "new_creative",
            target: "3 novos vídeos - Ofertas Black Friday",
            reason: "Preparar campanha para pico de demanda",
            expected_impact: "Manter CTR acima de 2% durante período de alta competição"
          }
        ],
        metrics_mentioned: {
          roas: 4.2,
          revenue: 315000,
          spend: 75000,
          ctr: 2.3,
          conversions: 187
        },
        strategy: {
          type: "scale",
          duration_days: 14,
          success_criteria: "Manter ROAS acima de 3.5x com budget aumentado",
          target_metric: "roas",
          target_value: 3.5
        },
        timeline: {
          reevaluate_date: "2025-10-26",
          milestones: []
        }
      }
    },
    expected_output: `🏛️ DELFOS - Loja Integrada | 12 Out 2025

SITUAÇÃO:
Performance excepcional com ROAS de 4.2x consistente, viabilizando escala de budget para Q4.

AÇÕES REALIZADAS:
• Aumentou budget Campanha Vendas Q4 em 40% (+R$ 6.000/dia) → ROAS de 4.2x nos últimos 7 dias → Escalar volume mantendo eficiência acima de 3.5x
• Publicou 3 novos vídeos para Black Friday → Preparação para pico de demanda → Manter CTR competitivo no período de alta concorrência

MÉTRICAS PRINCIPAIS:
• ROAS: 4.2x ✅ 20% acima do target, performance excelente
• Receita: R$ 315.000 ✅ Crescimento sustentável
• CTR: 2.3% ✅ Acima do benchmark de 1.5%
• Conversões: 187 ✅ Volume saudável para escala

PRÓXIMO CHECKPOINT: 26 Out 2025 - Validar manutenção de ROAS acima de 3.5x com budget escalado`
  },

  {
    scenario: "Test - Creative Fatigue, New Variations",
    input: {
      account_name: "Academia Fitness Pro",
      context: {
        summary: "CTR caindo de 2.1% para 1.3% em 10 dias. Publicando 5 novos criativos para combater fadiga e testar novas abordagens.",
        actions_taken: [
          {
            type: "new_creative",
            target: "5 vídeos - Abordagens diferentes (transformação, depoimentos, oferta)",
            reason: "CTR caiu 38% indicando fadiga de criativo",
            expected_impact: "Recuperar CTR para próximo de 2%"
          },
          {
            type: "pause_creative",
            target: "3 criativos com CTR < 0.8%",
            reason: "Performance muito abaixo da média (1.3%)",
            expected_impact: "Otimizar budget para criativos performáticos"
          },
          {
            type: "adjust_audience",
            target: "Ampliação de 1% para 3% de público similar",
            reason: "Frequência de 4.2 indica saturação da audiência atual",
            expected_impact: "Reduzir frequência para abaixo de 3.5"
          }
        ],
        metrics_mentioned: {
          ctr: 1.3,
          ctr_previous: 2.1,
          frequency: 4.2,
          cpm: 45,
          cpc: 3.46
        },
        strategy: {
          type: "test",
          duration_days: 5,
          success_criteria: "CTR acima de 1.8% com novos criativos",
          target_metric: "ctr",
          target_value: 1.8
        },
        timeline: {
          reevaluate_date: "2025-10-17",
          milestones: [
            {
              date: "2025-10-14",
              description: "Primeira análise de performance dos novos criativos (48h)"
            }
          ]
        }
      }
    },
    expected_output: `🏛️ DELFOS - Academia Fitness Pro | 12 Out 2025

SITUAÇÃO:
CTR caiu 38% (2.1% → 1.3%) em 10 dias, indicando fadiga de criativo e necessidade de testes.

AÇÕES REALIZADAS:
• Publicou 5 novos vídeos (transformação, depoimentos, oferta) → CTR caiu 38% nos últimos 10 dias → Recuperar CTR para próximo de 2%
• Pausou 3 criativos com CTR < 0.8% → Performance muito abaixo da média (1.3%) → Redirecionar budget para criativos eficientes
• Ampliou público similar de 1% para 3% → Frequência de 4.2 indica saturação → Reduzir frequência para < 3.5

MÉTRICAS PRINCIPAIS:
• CTR: 1.3% ❌ 38% abaixo do baseline de 2.1%
• Frequência: 4.2 ⚠️ Acima do ideal (< 3.5), indica saturação
• CPM: R$ 45 ⚠️ Elevado devido à frequência alta
• CPC: R$ 3.46 ⚠️ Impactado negativamente pelo CTR baixo

PRÓXIMO CHECKPOINT: 14 Out 2025 - Primeira análise de CTR dos novos criativos (48h de dados)`
  }
];

export default DELFOS_EXAMPLES;
