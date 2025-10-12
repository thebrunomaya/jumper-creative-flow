# 🎙️ OPTIMIZER Branch - Contrato de Integração

## 📋 Visão Geral

Este documento define o **contrato** entre os branches **OPTIMIZER** (desenvolvido no Lovable) e **REPORTS** (desenvolvido com Claude Code).

**Objetivo:** Garantir que quando ambos os branches forem mergeados, a integração funcione perfeitamente.

---

## 🗄️ Schemas de Banco de Dados

### **Tabela 1: j_hub_optimization_recordings**

Armazena metadados das gravações de áudio.

```sql
CREATE TABLE j_hub_optimization_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  recorded_by TEXT NOT NULL,           -- Email do gestor que gravou
  recorded_at TIMESTAMP DEFAULT NOW(),

  -- Audio metadata
  audio_file_path TEXT,                -- Path no Supabase Storage
  duration_seconds INT,

  -- Processing status
  transcription_status TEXT DEFAULT 'pending',  -- pending | processing | completed | failed
  analysis_status TEXT DEFAULT 'pending',       -- pending | processing | completed | failed

  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (account_id) REFERENCES j_ads_notion_db_accounts(notion_id)
);

-- Indexes para performance
CREATE INDEX idx_recordings_account ON j_hub_optimization_recordings(account_id);
CREATE INDEX idx_recordings_date ON j_hub_optimization_recordings(recorded_at DESC);
```

---

### **Tabela 2: j_hub_optimization_transcripts**

Armazena transcrições do Whisper.

```sql
CREATE TABLE j_hub_optimization_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,

  -- Transcription data
  full_text TEXT NOT NULL,             -- Texto completo transcrito
  language TEXT DEFAULT 'pt-BR',
  confidence_score FLOAT,              -- 0.0 a 1.0 (confiança do Whisper)

  -- Optional: timestamped segments
  segments JSONB,                      -- [{start: 0, end: 5.2, text: "Hoje pausei..."}]

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcripts_recording ON j_hub_optimization_transcripts(recording_id);
```

---

### **Tabela 3: j_hub_optimization_context** ⭐ **MAIS IMPORTANTE**

**Esta é a tabela que o REPORTS vai consumir!**

```sql
CREATE TABLE j_hub_optimization_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,

  -- Extracted structured data
  summary TEXT NOT NULL,               -- Resumo executivo (200 palavras)

  -- JSONB fields (structured data from AI analysis)
  actions_taken JSONB NOT NULL,        -- Array de OptimizationAction[]
  metrics_mentioned JSONB NOT NULL,    -- Object {cpa: 200, roas: 2.5, ...}
  strategy JSONB NOT NULL,             -- OptimizationStrategy
  timeline JSONB NOT NULL,             -- OptimizationTimeline

  -- Metadata
  confidence_level TEXT,               -- 'high' | 'medium' | 'low'

  -- Client reporting
  client_report_generated BOOLEAN DEFAULT FALSE,
  client_report_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (account_id) REFERENCES j_ads_notion_db_accounts(notion_id)
);

CREATE INDEX idx_context_account ON j_hub_optimization_context(account_id);
CREATE INDEX idx_context_date ON j_hub_optimization_context(created_at DESC);
```

---

## 📊 Estrutura JSONB Esperada

### **actions_taken** (Array)

```typescript
// Exemplo do que deve ser salvo no campo JSONB
[
  {
    "type": "pause_campaign",
    "target": "Campanha Retargeting Frio",
    "reason": "CPA estava em R$200, muito acima do target de R$80",
    "expected_impact": "Economia de R$2.500 por semana",
    "metrics_before": {
      "cpa": 200,
      "spend_daily": 500
    }
  },
  {
    "type": "increase_budget",
    "target": "Campanha Black Friday",
    "reason": "ROAS de 4.2x, muito acima do target de 2.5x",
    "expected_impact": "+30 vendas por semana"
  }
]
```

**Tipos válidos de ação:**
- `pause_campaign` | `activate_campaign`
- `increase_budget` | `decrease_budget`
- `new_creative` | `pause_creative`
- `audience_change` | `bidding_change`
- `other`

---

### **metrics_mentioned** (Object)

```typescript
// Exemplo: métricas extraídas da transcrição
{
  "cpa": 200,
  "target_cpa": 80,
  "roas": 4.2,
  "target_roas": 2.5,
  "ctr": 2.1,
  "conversions": 18,
  "spend_daily": 500
}
```

**Importante:** Normalizar os nomes das métricas:
- `cpa` (não CPA ou cpa_value)
- `roas` (não ROAS ou return_on_ad_spend)
- `ctr` (não CTR ou click_through_rate)
- `cpc` | `cpm` | `conversions` | `spend_daily` | `revenue`

---

### **strategy** (Object)

```typescript
{
  "type": "test",                    // 'test' | 'scale' | 'optimize' | 'maintain' | 'pivot'
  "duration_days": 7,
  "success_criteria": "CPA abaixo de R$150 após learning phase",
  "hypothesis": "Audiência fria 25-34 anos converte melhor que 18-24",  // Opcional
  "target_metric": "cpa",            // Opcional
  "target_value": 150                // Opcional
}
```

---

### **timeline** (Object)

```typescript
{
  "reevaluate_date": "2025-10-14",   // ISO date string
  "milestones": [                     // Opcional
    {
      "date": "2025-10-10",
      "description": "Esperado 30 conversões coletadas",
      "expected_metrics": {
        "conversions": 30,
        "cpa": 180
      }
    }
  ]
}
```

---

## 🤖 Prompt Sugerido para IA (Claude/GPT)

Quando processar a transcrição, use este prompt:

```
Você é um analista especialista em tráfego pago do Meta Ads.

Analise a seguinte transcrição de uma gravação de otimização feita por um gestor de tráfego:

"""
{transcrição completa aqui}
"""

Extraia as seguintes informações e retorne em formato JSON válido:

1. **summary** (string): Resumo executivo em 150-200 palavras, explicando:
   - O que foi feito
   - Por que foi feito
   - Resultados esperados

2. **actions_taken** (array): Lista de ações tomadas. Para cada ação:
   - type: tipo da ação (pause_campaign, increase_budget, new_creative, etc)
   - target: nome da campanha/ad afetado
   - reason: motivo da ação
   - expected_impact: impacto esperado (opcional)
   - metrics_before: métricas antes da ação (opcional)

3. **metrics_mentioned** (object): Todas as métricas mencionadas com seus valores.
   Use nomes normalizados: cpa, roas, ctr, cpc, conversions, etc.

4. **strategy** (object):
   - type: teste | escala | otimização | manutenção | pivot
   - duration_days: quantos dias até reavaliar
   - success_criteria: como definir sucesso
   - hypothesis: hipótese sendo testada (se for teste)

5. **timeline** (object):
   - reevaluate_date: data para reavaliar (formato ISO: YYYY-MM-DD)
   - milestones: marcos intermediários (opcional)

6. **confidence_level** (string): 'high' | 'medium' | 'low'
   - high: informações claras e completas
   - medium: algumas lacunas mas utilizável
   - low: muita informação faltando

Retorne APENAS o JSON, sem texto adicional.
```

---

## 📤 API Expected by REPORTS Branch

O branch REPORTS vai **consultar** os dados assim:

```typescript
// Query example
const { data: optimizations, error } = await supabase
  .from('j_hub_optimization_context')
  .select('*')
  .eq('account_id', accountId)
  .order('created_at', { ascending: false })
  .limit(5);

// Convert to typed object
const contexts = optimizations.map(rowToOptimizationContext);
```

**Importante:** Garanta que:
1. ✅ Todos os campos JSONB sejam válidos JSON
2. ✅ Datas estejam em formato ISO string
3. ✅ Arrays não sejam vazios (pelo menos 1 ação)
4. ✅ `summary` tenha conteúdo legível em português

---

## 🧪 Dados de Teste

Para testar a integração, use este exemplo:

```sql
-- Insert test recording
INSERT INTO j_hub_optimization_recordings (account_id, recorded_by, audio_file_path, duration_seconds)
VALUES ('notion_account_id_here', 'gestor@jumper.studio', 'optimizations/test-2025-10-07.mp3', 180);

-- Insert test transcript
INSERT INTO j_hub_optimization_transcripts (recording_id, full_text, confidence_score)
VALUES (
  (SELECT id FROM j_hub_optimization_recordings ORDER BY created_at DESC LIMIT 1),
  'Hoje pausei a campanha de retargeting porque o CPA estava em R$200...',
  0.95
);

-- Insert test context
INSERT INTO j_hub_optimization_context (
  recording_id,
  account_id,
  summary,
  actions_taken,
  metrics_mentioned,
  strategy,
  timeline,
  confidence_level
)
VALUES (
  (SELECT id FROM j_hub_optimization_recordings ORDER BY created_at DESC LIMIT 1),
  'notion_account_id_here',
  'Pausei campanha com CPA alto (R$200) e aumentei budget da campanha de alta performance (ROAS 4.2x). Esperado economia de R$2.5k/semana e +30 vendas.',
  '[
    {
      "type": "pause_campaign",
      "target": "Retargeting Frio",
      "reason": "CPA R$200 vs target R$80",
      "expected_impact": "Economia R$2.5k/semana"
    },
    {
      "type": "increase_budget",
      "target": "Black Friday",
      "reason": "ROAS 4.2x acima de target 2.5x",
      "expected_impact": "+30 vendas/semana"
    }
  ]'::jsonb,
  '{
    "cpa": 200,
    "target_cpa": 80,
    "roas": 4.2
  }'::jsonb,
  '{
    "type": "optimize",
    "duration_days": 7,
    "success_criteria": "Manter ROAS acima de 3.5x"
  }'::jsonb,
  '{
    "reevaluate_date": "2025-10-14"
  }'::jsonb,
  'high'
);
```

---

## ✅ Checklist de Implementação OPTIMIZER

### Semana 1: MVP
- [ ] Criar interface de gravação de áudio
- [ ] Upload para Supabase Storage (`/optimizations/{account_id}/{timestamp}.mp3`)
- [ ] Inserir row em `j_hub_optimization_recordings`
- [ ] Mostrar lista de gravações por conta

### Semana 2: Transcrição
- [ ] Integrar Whisper API
- [ ] Processar áudio automaticamente (via trigger ou edge function)
- [ ] Inserir transcrição em `j_hub_optimization_transcripts`
- [ ] Atualizar `transcription_status` para 'completed'

### Semana 3: Análise IA
- [ ] Integrar Claude/GPT API
- [ ] Processar transcrição com prompt estruturado
- [ ] Validar JSON retornado pela IA
- [ ] Inserir contexto em `j_hub_optimization_context`
- [ ] Atualizar `analysis_status` para 'completed'

### Semana 4: Validação
- [ ] Testar com 3 gestores reais
- [ ] Coletar feedback sobre usabilidade
- [ ] Validar qualidade das extrações da IA
- [ ] Ajustar prompt se necessário

---

## 🔗 Referências

- **TypeScript Types:** `src/types/optimization.ts`
- **Documentação Completa:** `CLAUDE.md` (Sessão 2025-10-07)
- **Branch REPORTS:** Em desenvolvimento paralelo

---

## 📞 Dúvidas?

Se tiver dúvidas sobre os contratos ou estrutura de dados, consulte:
1. `src/types/optimization.ts` - Types completos comentados
2. `CLAUDE.md` - Plano estratégico completo
3. Este documento - Guia de implementação

**Última atualização:** 2025-10-07
