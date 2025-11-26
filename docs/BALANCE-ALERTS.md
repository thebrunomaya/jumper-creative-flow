# Sistema de Alertas de Saldo Meta Ads

> **Versão:** 1.0.0
> **Data:** 2025-11-26
> **Status:** ✅ Produção

## Resumo

Sistema automatizado para monitorar saldo de contas Meta Ads, calcular dias restantes baseado no gasto médio de 7 dias, e alertar a equipe via webhook n8n quando o saldo estiver "em perigo".

---

## Arquitetura

```
Windsor.ai (sync diário automático)
    │
    │ Query: fields=account_currency,account_id,account_name,
    │        amount_spent,date,spend,spend_cap
    ▼
j_rep_metaads_account_balance (Supabase)
    │
    │ Colunas GENERATED calculam automaticamente:
    │ - current_balance = (spend_cap - amount_spent) / 100
    │ - avg_daily_spend = spend_last_7d / 7
    │ - days_remaining = current_balance / avg_daily_spend
    │
    │ JOIN com j_hub_notion_db_accounts
    │ (campo "Método de Pagamento")
    ▼
pg_cron (9:00 UTC / 6:00 BRT) → Edge Function
    │
    │ Verifica: days_remaining <= alert_threshold_days
    ▼
Webhook n8n (https://nilton.jumper.studio/webhook-test/flow-balance)
    │
    ▼
n8n processa e dispara Slack/Email/WhatsApp
```

---

## Componentes

### 1. Tabela `j_rep_metaads_account_balance`

Armazena dados de saldo das contas, sincronizados diariamente pelo Windsor.

**Colunas principais:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta Meta Ads |
| `account_name` | TEXT | Nome da conta |
| `spend_cap` | BIGINT | Limite de gasto (centavos) |
| `amount_spent` | BIGINT | Já gasto contra o limite (centavos) |
| `spend_last_7d` | NUMERIC | Gasto nos últimos 7 dias (reais) |
| `current_balance` | NUMERIC | **GENERATED** - Saldo em reais |
| `avg_daily_spend` | NUMERIC | **GENERATED** - Média diária |
| `days_remaining` | NUMERIC | **GENERATED** - Dias até acabar |
| `alert_threshold_days` | INTEGER | Threshold para alertar (default: 10) |
| `alert_enabled` | BOOLEAN | Se alertas estão ativos (default: true) |
| `date` | DATE | Data do snapshot |

**Fórmulas GENERATED:**

```sql
-- Saldo disponível em reais
current_balance = GREATEST(spend_cap - amount_spent, 0) / 100.0

-- Média de gasto diário
avg_daily_spend = spend_last_7d / 7.0

-- Dias restantes até o saldo acabar
days_remaining = current_balance / avg_daily_spend
-- (retorna 999 se não há gasto ou spend_cap)
```

### 2. Tabela `j_hub_balance_alerts`

Histórico de alertas enviados. Evita enviar alertas duplicados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta |
| `account_name` | TEXT | Nome da conta |
| `balance_at_alert` | NUMERIC | Saldo no momento do alerta |
| `days_remaining_at_alert` | NUMERIC | Dias restantes no momento |
| `status` | ENUM | `pending`, `notified`, `resolved` |
| `notified_at` | TIMESTAMPTZ | Quando o webhook foi enviado |

**Constraint:** Apenas um alerta ativo por conta (evita spam).

### 3. Edge Function `j_hub_balance_check_alerts`

Verifica contas em perigo e envia webhook para n8n.

**Localização:** `supabase/functions/j_hub_balance_check_alerts/index.ts`

**Fluxo:**
1. Busca contas onde `days_remaining <= alert_threshold_days`
2. Busca "Método de Pagamento" do Notion
3. Verifica se já existe alerta ativo (evita duplicados)
4. Envia webhook para n8n
5. Registra alerta no histórico

### 4. pg_cron Job

Executa a Edge Function diariamente às 6h BRT.

```sql
SELECT cron.schedule(
  'balance-alerts-check',
  '0 9 * * *',  -- 9:00 UTC = 6:00 BRT
  $$ SELECT net.http_post(...) $$
);
```

---

## Threshold de Alerta

### O que é?

O `alert_threshold_days` define **quantos dias antes** do saldo acabar o sistema deve alertar.

**Exemplo:**
- Conta com `current_balance = R$ 500`
- Gasto médio diário = R$ 100
- `days_remaining = 5 dias`
- Se `alert_threshold_days = 5` → **ALERTA!**
- Se `alert_threshold_days = 3` → Sem alerta (ainda tem 5 dias)

### Valores recomendados

| Threshold | Quando usar |
|-----------|-------------|
| **5 dias** | Contas com reposição rápida (cartão, pix) |
| **7 dias** | Contas com processo de aprovação rápido |
| **10 dias** | **Padrão** - tempo suficiente para boleto e aprovações |
| **14+ dias** | Contas corporativas com burocracia |

### Como configurar

**Por conta individual:**

```sql
-- Definir threshold de 7 dias para uma conta específica
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 7
WHERE account_id = '1097627115593816';
```

**Para todas as contas:**

```sql
-- Alterar default para 7 dias
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 7;
```

**Desabilitar alertas para uma conta:**

```sql
UPDATE j_rep_metaads_account_balance
SET alert_enabled = false
WHERE account_id = '1097627115593816';
```

### Considerações por Método de Pagamento

| Método | Threshold sugerido | Razão |
|--------|-------------------|-------|
| **Boleto** | 5-7 dias | Tempo para gerar, pagar e compensar |
| **Pix** | 3-5 dias | Compensação imediata, mas precisa aprovar |
| **Cartão** | 3 dias | Cobrança automática, só verificar limite |
| **Faturamento** | 7-10 dias | Processo de aprovação interno |

---

## Payload do Webhook

O n8n recebe um POST com este payload:

```json
{
  "account_id": "1097627115593816",
  "account_name": "Almanara Restaurantes 2025",
  "current_balance": 920.53,
  "days_remaining": 5,
  "avg_daily_spend": 184.10,
  "spend_cap": 7500.00,
  "amount_spent": 6579.47,
  "payment_method": "Boleto",
  "threshold_days": 5,
  "alert_date": "2025-11-26"
}
```

**Campos úteis para mensagens:**

- `account_name` - Nome da conta
- `current_balance` - Saldo atual em R$
- `days_remaining` - Dias até acabar
- `payment_method` - Tipo de pagamento (para personalizar mensagem)

---

## Query Windsor

**URL completa:**

```
https://connectors.windsor.ai/facebook?api_key=XXX&date_preset=last_7d&fields=account_currency,account_id,account_name,amount_spent,date,spend,spend_cap&filter=[["account_currency","notnull",null]]
```

**Mapeamento de campos:**

| Campo Windsor | Coluna Supabase |
|---------------|-----------------|
| `date` | `date` |
| `account_id` | `account_id` |
| `account_name` | `account_name` |
| `account_currency` | `currency` |
| `spend_cap` | `spend_cap` |
| `amount_spent` | `amount_spent` |
| `spend` | `spend_last_7d` |

**Nota:** O filtro `account_currency notnull` exclui contas inativas sem dados válidos.

---

## Fluxo de Resolução de Alertas

Quando o saldo é reabastecido:

```sql
-- Marcar alerta como resolvido
UPDATE j_hub_balance_alerts
SET status = 'resolved', resolved_at = now()
WHERE account_id = '1097627115593816'
  AND status = 'notified';
```

Isso permite que novos alertas sejam criados no futuro.

---

## Troubleshooting

### Alerta não disparou

1. Verificar se `days_remaining <= alert_threshold_days`:
```sql
SELECT account_name, days_remaining, alert_threshold_days
FROM j_rep_metaads_account_balance
WHERE date = (SELECT MAX(date) FROM j_rep_metaads_account_balance)
ORDER BY days_remaining ASC;
```

2. Verificar se já existe alerta ativo:
```sql
SELECT * FROM j_hub_balance_alerts
WHERE status IN ('pending', 'notified');
```

3. Verificar se alertas estão habilitados:
```sql
SELECT account_name, alert_enabled
FROM j_rep_metaads_account_balance
WHERE alert_enabled = false;
```

### Webhook não chegou no n8n

1. Verificar se o n8n está configurado para **POST**
2. Verificar URL do webhook na Edge Function
3. Verificar logs da Edge Function no Supabase Dashboard

### Dados não atualizando

1. Verificar sync do Windsor
2. Verificar se a query tem os campos corretos
3. Verificar se o filtro não está excluindo contas válidas

---

## Testes

### Testar Edge Function manualmente

No Supabase Dashboard: **Edge Functions → j_hub_balance_check_alerts → Test**

### Forçar alerta para teste

```sql
-- Aumentar threshold temporariamente
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 999
WHERE account_id = '1097627115593816';

-- Limpar alerta existente
DELETE FROM j_hub_balance_alerts
WHERE account_id = '1097627115593816';

-- Executar Edge Function e verificar n8n

-- Restaurar threshold
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 5
WHERE account_id = '1097627115593816';
```

---

## Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20251126000001_create_account_balance.sql` | Tabela de saldos |
| `supabase/migrations/20251126000002_create_balance_alerts.sql` | Tabela de alertas |
| `supabase/migrations/20251126000003_schedule_balance_alerts.sql` | Job pg_cron |
| `supabase/functions/j_hub_balance_check_alerts/index.ts` | Edge Function |

---

## Histórico

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-11-26 | 1.0.0 | Implementação inicial |
