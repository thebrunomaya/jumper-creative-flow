# REPORTS Branch - Roadmap de Desenvolvimento

> 🚀 Plano de implementação do sistema de insights contextualizados

---

## 🎯 Objetivo

Transformar dashboards de "métricas brutas" em "insights acionáveis" através da integração com contexto de otimizações gravadas por gestores.

**Impacto Esperado:**
- NPS Comunicação: 6/10 → **8-9/10**
- Tempo interpretação: 15min → **3min**
- Ações tomadas: 30% → **70%+**
- Rework: Alto → **Mínimo**

---

## 📋 Status Atual

### ✅ OPTIMIZER Branch (Lovable)
**Status:** 100% Completo e funcional

**Tabelas disponíveis:**
- `j_ads_optimization_recordings` - Gravações de áudio
- `j_ads_optimization_transcripts` - Transcrições Whisper
- `j_ads_optimization_context` - **Contexto estruturado (pronto para consumo)**

**Dados disponíveis em `j_ads_optimization_context`:**
```typescript
interface OptimizationContext {
  id: string;
  account_id: string;
  recorded_at: Date;
  summary: string; // Resumo executivo

  actions_taken: OptimizationAction[]; // [{type, target, reason, impact}]
  metrics_mentioned: Record<string, number>; // {cpa: 200, target_cpa: 80}
  strategy: {
    type: 'test' | 'scale' | 'optimize' | 'maintain';
    duration_days: number;
    success_criteria: string;
  };
  timeline: {
    next_reevaluation_date: Date;
    milestones: Array<{date: Date, description: string}>;
  };

  confidence: number; // 0-100
  platform: string; // 'meta_ads', 'google_ads'
  created_at: Date;
}
```

### ⏳ REPORTS Branch (Claude Code)
**Status:** A implementar

**Branch atual:** `reports` (já criada, aguardando desenvolvimento)

---

## 🚀 Fases de Implementação

### **FASE 1: Insights Comparativos** ⚡ (Semana 1-2)
**Objetivo:** Entregar valor imediato sem depender do OPTIMIZER

**Componentes a criar:**
```
src/components/reports/insights/
├── InsightPanel.tsx            # Container principal de insights
├── ComparativeMetricsCard.tsx  # Comparação período atual vs anterior
├── TrendIndicator.tsx          # Indicador visual de tendência (↑↓)
└── NarrativeGenerator.tsx      # Geração de narrativas automáticas
```

**Hooks:**
```typescript
// src/hooks/useComparativeMetrics.ts
export function useComparativeMetrics(accountId: string, period: number) {
  // Compara período atual vs período anterior
  // Retorna: {metric, current, previous, change_percent, trend}
}

// src/hooks/useInsightNarratives.ts
export function useInsightNarratives(metrics: ComparativeMetrics[]) {
  // Gera narrativas automáticas baseadas em mudanças
  // Ex: "ROAS subiu 28% - Melhor semana do mês!"
}
```

**Entregas:**
```
📊 Destaques da Semana
✅ ROAS subiu 28% (2.1x → 2.7x) - Melhor semana do mês!
⚠️ CPC aumentou 15% (R$1.20 → R$1.38) - Acima do benchmark
🔵 Impressões cresceram 45% - Alcance em expansão
```

**Impacto:** Relatórios ficam 3x mais úteis de imediato

---

### **FASE 2: Detecção de Anomalias** 🚨 (Semana 2-3)
**Objetivo:** Identificar problemas automaticamente

**Componentes a criar:**
```
src/components/reports/alerts/
├── AlertPanel.tsx              # Container de alertas críticos
├── AnomalyCard.tsx            # Card de anomalia individual
└── ActionRecommendation.tsx    # Recomendação de ação

src/utils/anomalyDetection.ts   # Algoritmos de detecção
src/utils/metricCorrelation.ts  # Análise de correlações
```

**Algoritmos:**
```typescript
// src/utils/anomalyDetection.ts
export function detectAnomalies(metrics: MetricHistory[]) {
  // 1. Z-score para outliers (±2 desvios padrão)
  // 2. Moving average para tendências
  // 3. Seasonal decomposition para padrões

  return anomalies; // [{metric, severity, deviation}]
}

// src/utils/metricCorrelation.ts
export function correlateMetrics(metrics: MetricSnapshot) {
  // Detecta correlações suspeitas:
  // - CTR alto + conversão baixa = problema LP
  // - Impressões altas + cliques baixos = problema criativo
  // - CPC normal + CPA alto = problema funil

  return correlations; // [{pattern, likely_cause, recommendation}]
}
```

**Entregas:**
```
🚨 Alertas Críticos
❌ Campanha X: CPA 3x acima do normal (R$ 240 vs R$ 80 médio)
💡 Sugestão: Revisar ou pausar esta campanha
🔍 Análise: CTR está bom (2.1%) mas conversão baixa (0.8%)
   Possível causa: Problema na landing page ou público errado

⚠️ Padrão Detectado
Impressões subiram 200% mas cliques caíram 40%
Possível causa: Expansão de público sem otimização de criativos
Recomendação: Revisar targeting ou criar novos criativos
```

**Impacto:** Gestores identificam problemas 5x mais rápido

---

### **FASE 3: Contexto Automático Básico** 📝 (Semana 3)
**Objetivo:** Capturar contexto antes do OPTIMIZER ficar pronto

**Schema a criar:**
```sql
-- Notas rápidas do gestor (fallback enquanto OPTIMIZER não está disponível)
CREATE TABLE j_ads_quick_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  change_detected TEXT, -- 'budget_increase_150%', 'new_creative_added'
  note TEXT, -- Campo livre do gestor
  tags TEXT[], -- ['teste', 'escala', 'otimização']

  related_metrics JSONB, -- {cpa_before: 80, cpa_after: 200}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detecção automática de mudanças
CREATE TABLE j_ads_detected_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  change_type TEXT, -- 'budget', 'creative', 'targeting', 'bid_strategy'
  change_magnitude NUMERIC, -- Percentual de mudança
  detected_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);
```

**Componentes:**
```
src/components/reports/context/
├── QuickNoteModal.tsx          # Modal para gestor anotar
├── ChangeDetectionBanner.tsx   # Banner de mudança detectada
└── ContextTimeline.tsx         # Timeline de mudanças e notas
```

**Hook:**
```typescript
// src/hooks/useChangeDetection.ts
export function useChangeDetection(accountId: string) {
  // Compara snapshots semanais
  // Detecta mudanças significativas (>30%)
  // Sugere ao gestor anotar o contexto
}
```

**Entregas:**
```
🔔 Mudança Detectada (há 3 dias)
Budget da Campanha Y aumentou 150% (R$ 1.000 → R$ 2.500)

Nota do gestor: "Teste de escala - performance excellent nas últimas 2 semanas"
Tags: #teste #escala

📊 Métricas relacionadas:
- CPA antes: R$ 80 (excellent)
- ROAS antes: 3.2x (excellent)
- Objetivo: Validar escalabilidade mantendo performance
```

**Impacto:** Já captura contexto mínimo sem OPTIMIZER

---

### **FASE 4: Integração com OPTIMIZER** 🎯 (Semana 4-5)
**Objetivo:** Insights 10x mais ricos com contexto de áudio

**Componentes a criar:**
```
src/components/reports/optimizer/
├── OptimizationContextPanel.tsx    # Exibe contexto completo
├── StrategyProgressCard.tsx        # Progresso da estratégia
├── TimelineVisualizer.tsx          # Visualização de timeline
└── ContextualizedInsight.tsx       # Insight com contexto

src/hooks/useOptimizationContext.ts # Hook para consumir contexto
```

**Hook principal:**
```typescript
// src/hooks/useOptimizationContext.ts
export function useOptimizationContext(accountId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['optimization-context', accountId, dateRange],
    queryFn: async () => {
      // Query conforme contrato OPTIMIZER
      const { data } = await supabase
        .from('j_ads_optimization_context')
        .select('*')
        .eq('account_id', accountId)
        .gte('created_at', dateRange?.start)
        .lte('created_at', dateRange?.end)
        .order('created_at', { ascending: false });

      return data;
    }
  });
}
```

**Insights Engine v2:**
```typescript
// src/utils/contextualInsights.ts
export function generateContextualInsights(
  metrics: MetricSnapshot,
  anomalies: Anomaly[],
  context: OptimizationContext[]
) {
  // 1. Detecta anomalias
  const criticalAnomaly = anomalies.find(a => a.severity === 'critical');

  // 2. Busca contexto relacionado
  const relevantContext = context.find(c =>
    isRelatedToAnomaly(c, criticalAnomaly)
  );

  // 3. Gera insight contextualizado
  if (relevantContext) {
    return {
      insight: buildContextualizedInsight(criticalAnomaly, relevantContext),
      recommendation: buildRecommendation(relevantContext.strategy),
      confidence: 'high'
    };
  }

  // 4. Fallback para insight básico
  return buildBasicInsight(criticalAnomaly);
}
```

**Entregas:**
```
💡 CPA subiu 45% esta semana (R$ 80 → R$ 116)

🎯 Contexto (Otimização 07/Out/2024):
Gestor iniciou teste de cold audience há 3 dias para validar novo público.

📋 Estratégia:
- Tipo: Teste de audiência
- Duração esperada: 7 dias (dia 3/7)
- Critério de sucesso: 50 conversões + CPA < R$ 150

✅ Progresso:
- 18/50 conversões coletadas
- CPA atual: R$ 116 (dentro do esperado)
- CTR: 2.1% (excellent) - criativo funcionando bem

🎯 Próxima reavaliação: 14/Out/2024

💡 Recomendação:
Manter estratégia conforme planejado. Aumento de CPA é esperado
durante learning phase. Avaliar resultados no dia 7.

⚠️ Pontos de atenção:
- Se CPA ultrapassar R$ 150, considerar pausar teste
- Monitorar taxa de conversão diária
```

**Impacto:** Sistema transforma dados em decisões acionáveis

---

## 🔐 CRITICAL: Fixes de Segurança (ANTES de iniciar FASE 1)

### **Problema Identificado:**

**❌ Dados de métricas (`j_rep_metaads_bronze`) acessíveis por qualquer usuário autenticado**

**Risco:**
- Gerente da Conta A pode ver dados da Conta B
- Falta de isolamento entre clientes/agências

### **Solução Requerida:**

**1. Criar tabela de mapeamento user → accounts:**
```sql
CREATE TABLE j_ads_user_account_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id TEXT NOT NULL, -- Notion ID da conta
  access_level TEXT NOT NULL, -- 'read', 'write', 'admin'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, account_id)
);

-- Popular com dados existentes
INSERT INTO j_ads_user_account_access (user_id, account_id, access_level)
SELECT
  u.id as user_id,
  unnest(string_to_array(m.contas, ',')) as account_id,
  'read' as access_level
FROM auth.users u
JOIN j_hub_notion_db_managers m ON m.email = u.email
WHERE m.ativo = true;
```

**2. Implementar RLS em `j_rep_metaads_bronze`:**
```sql
-- Enable RLS
ALTER TABLE j_rep_metaads_bronze ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem dados de suas contas
CREATE POLICY "Users can only see their accounts' data"
ON j_rep_metaads_bronze
FOR SELECT
USING (
  account_id IN (
    SELECT account_id
    FROM j_ads_user_account_access
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins veem tudo
CREATE POLICY "Admins see all data"
ON j_rep_metaads_bronze
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_notion_db_managers
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND tipo = 'admin'
    AND ativo = true
  )
);
```

**3. Aplicar RLS em `j_ads_optimization_context`:**
```sql
ALTER TABLE j_ads_optimization_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see optimization context for their accounts"
ON j_ads_optimization_context
FOR SELECT
USING (
  account_id IN (
    SELECT account_id
    FROM j_ads_user_account_access
    WHERE user_id = auth.uid()
  )
);
```

**4. Testar isolamento:**
```sql
-- Test: Usuário X não vê dados de contas que não tem acesso
-- Login como usuário X
SELECT * FROM j_rep_metaads_bronze; -- Deve retornar apenas suas contas

-- Login como admin
SELECT * FROM j_rep_metaads_bronze; -- Deve retornar todas as contas
```

---

## 📅 Timeline de Execução

```
Semana 0 (ANTES de começar):
└─ 🔐 CRITICAL: Implementar fixes de segurança
   ├─ Criar j_ads_user_account_access
   ├─ Popular com dados existentes
   ├─ Aplicar RLS em j_rep_metaads_bronze
   ├─ Aplicar RLS em j_ads_optimization_context
   └─ Testar isolamento

Semana 1-2: FASE 1 - Insights Comparativos
├─ InsightPanel + ComparativeMetricsCard
├─ useComparativeMetrics hook
├─ TrendIndicator + NarrativeGenerator
└─ Integração com dashboards existentes

Semana 2-3: FASE 2 - Detecção de Anomalias
├─ AlertPanel + AnomalyCard
├─ anomalyDetection.ts + metricCorrelation.ts
├─ ActionRecommendation component
└─ Testes com dados reais

Semana 3: FASE 3 - Contexto Automático Básico
├─ Schema j_ads_quick_notes + j_ads_detected_changes
├─ QuickNoteModal + ChangeDetectionBanner
├─ useChangeDetection hook
└─ ContextTimeline component

Semana 4-5: FASE 4 - Integração OPTIMIZER
├─ OptimizationContextPanel + StrategyProgressCard
├─ useOptimizationContext hook
├─ contextualInsights.ts engine v2
├─ TimelineVisualizer + ContextualizedInsight
└─ Testes end-to-end

Semana 6: Validação + Ajustes Finais
├─ Testes com gestores reais (3 usuários)
├─ Ajustes baseados em feedback
├─ Documentação completa
└─ Deploy para produção
```

---

## 🎯 Critérios de Sucesso

### **Métricas Técnicas:**
- ✅ 100% das queries respeitam RLS (isolamento de dados)
- ✅ Latência <500ms para geração de insights
- ✅ Cobertura de 90%+ dos padrões de anomalias
- ✅ 0 erros críticos em 1 semana de produção

### **Métricas de Negócio:**
- 🎯 NPS Comunicação: 6/10 → 8+/10
- ⚡ Tempo de interpretação: 15min → 5min
- 📈 Ações tomadas: 30% → 60%+ dos insights
- ✅ Rework por falta de contexto: -80%

### **Validação com Usuários:**
- ✅ 3 gestores testam por 1 semana
- ✅ Feedback positivo de 100% dos testadores
- ✅ Pelo menos 2 casos de "insight que evitou erro crítico"

---

## 📊 Dependências Externas

**Do OPTIMIZER Branch (Lovable):**
- ✅ `j_ads_optimization_context` table (pronta)
- ✅ TypeScript types em `src/types/optimization.ts` (pronto)
- ✅ Dados estruturados conforme contrato (validado)

**Do Main Branch:**
- ✅ Dashboards existentes (9 objetivos implementados)
- ✅ `j_rep_metaads_bronze` table (dados Meta Ads)
- ✅ `j_ads_notion_db_accounts` table (contas sincronizadas)
- ⚠️ Sistema de segurança (RLS) - **A IMPLEMENTAR**

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| RLS não implementado corretamente | Média | **CRÍTICO** | Testes automatizados de isolamento antes do deploy |
| Algoritmos de anomalia com falsos positivos | Alta | Médio | Threshold configurável + validação com dados históricos |
| Performance degradada com queries complexas | Baixa | Médio | Índices adequados + cache de insights |
| OPTIMIZER context incompleto/mal formatado | Baixa | Alto | Validação de schema + confidence score mínimo |
| Usuários não entendem insights gerados | Média | Alto | UX testing + tooltips explicativos + exemplos |

---

## 📝 Checklist de Execução

### **ANTES de começar (CRÍTICO):**
- [ ] 🔐 Implementar `j_ads_user_account_access` table
- [ ] 🔐 Popular tabela com dados existentes
- [ ] 🔐 Aplicar RLS em `j_rep_metaads_bronze`
- [ ] 🔐 Aplicar RLS em `j_ads_optimization_context`
- [ ] 🔐 Testar isolamento (usuário normal vs admin)
- [ ] 🔐 Validar que queries existentes continuam funcionando

### **FASE 1:**
- [ ] Criar `InsightPanel.tsx`
- [ ] Implementar `useComparativeMetrics` hook
- [ ] Criar `ComparativeMetricsCard.tsx` + `TrendIndicator.tsx`
- [ ] Implementar `useInsightNarratives` hook
- [ ] Integrar com `GeneralDashboard.tsx`
- [ ] Testes unitários dos algoritmos de comparação
- [ ] Deploy preview + validação visual

### **FASE 2:**
- [ ] Implementar `anomalyDetection.ts` (z-score + moving average)
- [ ] Implementar `metricCorrelation.ts`
- [ ] Criar `AlertPanel.tsx` + `AnomalyCard.tsx`
- [ ] Criar `ActionRecommendation.tsx`
- [ ] Validar algoritmos com dados históricos
- [ ] Ajustar thresholds baseado em falsos positivos
- [ ] Deploy preview + validação com gestor

### **FASE 3:**
- [ ] Criar schema `j_ads_quick_notes`
- [ ] Criar schema `j_ads_detected_changes`
- [ ] Implementar `useChangeDetection` hook
- [ ] Criar `QuickNoteModal.tsx`
- [ ] Criar `ChangeDetectionBanner.tsx`
- [ ] Criar `ContextTimeline.tsx`
- [ ] Testar detecção automática de mudanças
- [ ] Deploy preview + feedback interno

### **FASE 4:**
- [ ] Implementar `useOptimizationContext` hook
- [ ] Criar `OptimizationContextPanel.tsx`
- [ ] Criar `StrategyProgressCard.tsx`
- [ ] Implementar `contextualInsights.ts` engine v2
- [ ] Criar `TimelineVisualizer.tsx`
- [ ] Criar `ContextualizedInsight.tsx`
- [ ] Integrar com todos os dashboards
- [ ] Testes end-to-end completos
- [ ] Validação com 3 gestores reais
- [ ] Ajustes finais baseados em feedback

### **Deploy Final:**
- [ ] Code review completo
- [ ] Documentação atualizada
- [ ] `npm run lint` + `npm run typecheck` sem erros
- [ ] Testes de performance (<500ms insights)
- [ ] Testes de segurança (RLS validado)
- [ ] Merge `reports` → `main`
- [ ] Deploy produção
- [ ] Monitoramento por 48h

---

**Last Updated**: 2024-10-07
**Status**: Planejamento completo - Pronto para execução
**Next Step**: 🔐 Implementar fixes de segurança (CRITICAL)
