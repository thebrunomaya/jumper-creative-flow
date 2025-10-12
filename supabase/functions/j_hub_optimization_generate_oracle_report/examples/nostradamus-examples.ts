/**
 * NOSTRADAMUS Few-Shot Examples
 *
 * These examples train the model to generate comprehensive analytical reports
 * with rich data tables, comparisons, and strategic insights.
 */

export const NOSTRADAMUS_EXAMPLES = [
  {
    scenario: "Optimize - High CPA, Campaign Restructure (analytical view)",
    input: {
      account_name: "Clínica Seven",
      context: {
        summary: "Reestruturação completa da campanha principal devido a CPA elevado. Mix 2 pausado por baixa performance. Budget de fim de semana reduzido.",
        actions_taken: [
          {
            type: "restructure_campaign",
            target: "Campanha Jumper - Principal",
            reason: "CPA de R$ 7.000 no início do dia",
            expected_impact: "Redução de CPA através de distribuição inteligente",
            metrics_before: { cpa: 7000, format: "ABO", budget_distribution: "manual" },
            metrics_after: { cpa: 1875, format: "CBO", budget_distribution: "automatic" }
          },
          {
            type: "pause_adset",
            target: "Mix 2 - Criativos Antigos",
            reason: "Performance 45% abaixo da média"
          },
          {
            type: "reduce_budget",
            target: "Budget fim de semana",
            reason: "CPA 35% mais alto historicamente"
          }
        ],
        metrics_mentioned: {
          cpa: 1373,
          conversions: 59,
          conversions_gator: 58,
          spend: 81000,
          cpa_start: 7000,
          cpa_end: 1875
        },
        strategy: {
          type: "optimize",
          duration_days: 7,
          success_criteria: "CPA < R$ 1.500 por 7 dias consecutivos",
          target_metric: "cpa",
          target_value: 1500
        },
        timeline: {
          reevaluate_date: "2025-10-19",
          milestones: [{ date: "2025-10-15", description: "Avaliar CPA médio semanal" }]
        }
      }
    },
    expected_output: `📜 NOSTRADAMUS - Clínica Seven | 12 Out 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VISÃO GERAL DO PERÍODO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dia 10/10 (Quinta-feira) - Análise completa

Período crítico: 00:00h - 09:00h
├─ CPA inicial: R$ 7.000
├─ Conversões: 3
├─ Investimento: R$ 21.000
└─ Status: 🔴 Crítico - insustentável

Pós-reestruturação: 09:00h - 23:59h
├─ CPA médio: R$ 1.875
├─ Conversões: 56
├─ Investimento: R$ 60.000
└─ Status: 🟡 Melhorou significativamente - monitorar

Consolidado do dia:
├─ Investimento total: R$ 81.000
├─ Conversões: 59 (Meta) | 58 (Gator)
├─ CPA médio: R$ 1.373
├─ Melhoria intraday: -73.2% (R$ 7.000 → R$ 1.875)
└─ Status: 🟡 Recuperação bem-sucedida, validar sustentabilidade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ MUDANÇAS ESTRUTURAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Campanha Jumper - Reestruturação Completa

ANTES (00:00h - 09:00h):
├─ Formato: ABO (Advantage Budget Optimization)
├─ Distribuição de budget: Manual por ad set
├─ CPA: R$ 7.000
├─ Conversões: 3 em 9 horas
└─ Taxa de conversão: 0.33/hora

DEPOIS (09:00h - 23:59h):
├─ Formato: CBO (Campaign Budget Optimization)
├─ Distribuição de budget: Automática via algoritmo
├─ CPA: R$ 1.875
├─ Conversões: 56 em 15 horas
└─ Taxa de conversão: 3.73/hora (+1.030%)

📊 Impacto: -73.2% no CPA (R$ 5.125 de redução absoluta)
✅ Razão: CBO permite redistribuição dinâmica de budget em tempo real para ad sets com melhor performance, eliminando ineficiências da alocação manual
🎯 Objetivo: Manter CPA consistentemente abaixo de R$ 1.500

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏸️ Mix 2 - Criativos Antigos (PAUSADO)

PERFORMANCE ANTES DA PAUSA:
├─ CPA: R$ 2.100 (vs média de R$ 1.450)
├─ CTR: 0.9% (vs média de 1.4%)
├─ CPM: R$ 68 (vs média de R$ 52)
├─ Conversões/dia: 2.3 (vs média de 4.1)
└─ Share of budget: 18%

IMPACTO DA PAUSA:
├─ Budget liberado: R$ 14.580/dia (18% de R$ 81.000)
├─ Redirecionamento: Automático para Mixes 1, 3 e 4
├─ CPA esperado dos R$ 14.580: R$ 1.350 (vs R$ 2.100 anterior)
└─ Conversões adicionais estimadas: +4/dia

📊 Impacto: +4 conversões/dia com mesmo budget total
✅ Razão: Mix 2 apresentava fadiga de criativo (ativos com 45+ dias) e performance 45% inferior à média da conta
🎯 Objetivo: Maximizar eficiência eliminando underperformers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Ajuste de Budget - Fim de Semana

ANÁLISE HISTÓRICA (Últimos 30 dias):
├─ CPA Seg-Sex: R$ 1.280 (média)
├─ CPA Sáb-Dom: R$ 1.730 (média)
├─ Diferença: +35.2% aos finais de semana
└─ Volume de conversões: -22% (menor tráfego qualificado)

ESTRATÉGIA IMPLEMENTADA:
├─ Redução de budget: -21% nos finais de semana
│  ├─ Seg-Sex: R$ 81.000/dia (100%)
│  └─ Sáb-Dom: R$ 64.000/dia (79%)
├─ Projeção de CPA Sáb-Dom: R$ 1.550 (vs R$ 1.730 anterior)
└─ Economia semanal: R$ 34.000 (2 dias × R$ 17.000)

📊 Impacto: Otimização de R$ 136.000/mês mantendo presença de marca
✅ Razão: Dados históricos mostram competição 40% maior e audiência 25% menos qualificada aos finais de semana
🎯 Objetivo: Concentrar budget em períodos de maior eficiência (ROI +27%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ANÁLISE DETALHADA DE MÉTRICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Métricas de Performance (Consolidado do dia):

├─ CPA: R$ 1.373 🟡 Aceitável mas 8.5% abaixo do target (R$ 1.500)
├─ Conversões: 59 ✅ Volume robusto para investimento de R$ 81k
├─ Discrepância Meta/Gator: -1.7% (59 vs 58) ✅ Dentro da margem normal
├─ Taxa de conversão intraday: +1.030% 🟢 Recuperação dramática pós-reestruturação
├─ Budget allocation efficiency: +45% 🟢 CBO vs ABO
└─ Projected CPA (next 7 days): R$ 1.400-1.550 🟡 Monitorar flutuações

Métricas de Eficiência:

├─ CPA improvement rate: -73.2% intraday 🟢 Excepcional
├─ Budget waste eliminated: R$ 14.580/dia 🟢 Pausa de Mix 2
├─ Weekend optimization: R$ 34.000/semana 🟢 Ajuste temporal
├─ Algorithm learning: 9-15 horas 🟢 CBO otimizado rapidamente
└─ Operational risk: 🟡 Monitorar sustentabilidade nos próximos 7 dias

Comparativo de Estruturas:

┌─────────────────┬──────────┬──────────┬────────────┐
│ Métrica         │   ABO    │   CBO    │  Δ Change  │
├─────────────────┼──────────┼──────────┼────────────┤
│ CPA             │ R$ 7.000 │ R$ 1.875 │   -73.2%   │
│ Conv/hora       │   0.33   │   3.73   │  +1.030%   │
│ Flexibility     │  Manual  │   Auto   │     +++    │
│ Learning time   │    N/A   │  9-15h   │     N/A    │
└─────────────────┴──────────┴──────────┴────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ESTRATÉGIA E PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tipo de Estratégia: OPTIMIZE (Recuperação e Estabilização)

Objetivos Definidos:
├─ Meta primária: CPA < R$ 1.500 por 7 dias consecutivos ✅
├─ Meta secundária: Manter volume > 50 conversões/dia ✅
├─ Duração da estratégia: 7 dias (12 Out - 19 Out)
└─ Critério de sucesso: CPA médio semanal abaixo de R$ 1.450

Timeline de Avaliação:
├─ Checkpoint 1: 15 Out (Segunda) - CPA médio de 3 dias + validação de CBO
├─ Checkpoint 2: 17 Out (Quarta) - Análise de performance Sáb-Dom com budget reduzido
└─ Reavaliação completa: 19 Out (Sexta) - Decisão sobre manutenção ou novos ajustes

Projeções (baseado em performance atual):

Cenário Otimista (CPA mantém R$ 1.400):
├─ Conversões/semana: 413 (59/dia × 7)
├─ Investimento/semana: R$ 578.000
├─ Economia vs ABO: R$ 1.876.000/semana (calculado)
└─ Viabilidade: 🟢 Alta

Cenário Conservador (CPA sobe para R$ 1.550):
├─ Conversões/semana: 373 (53/dia × 7)
├─ Investimento/semana: R$ 578.000
├─ CPA: +3.3% vs target mas ainda aceitável
└─ Viabilidade: 🟡 Média-alta

Meta Mínima Aceitável:
├─ CPA threshold: R$ 1.800 (limite de viabilidade econômica)
├─ Conversões mínimas: 321/semana (46/dia)
└─ Ação se atingido: Reavaliar criativos e audiências

Riscos Identificados:
├─ 🟡 Sustentabilidade: CBO pode ter variação de ±15% nos primeiros 7 dias
├─ 🟡 Weekend performance: Primeira validação do budget reduzido (Sáb-Dom 13-14 Out)
├─ 🟢 Creative fatigue: Mixes 1, 3, 4 estão frescos (< 30 dias)
└─ 🟢 Algorithm stability: CBO historicamente estabiliza em 5-7 dias`
  }
];

export default NOSTRADAMUS_EXAMPLES;
