# Funções do Sistema - Jumper Hub

> **Atualizado:** 2026-01-11 | **Versão:** v2.1.104

Documentação de referência para funções operacionais do sistema.

---

## Índice

1. [Desenvolvimento Local (localdev)](#1-desenvolvimento-local-localdev)
2. [Alertas de Saldo Meta Ads](#2-alertas-de-saldo-meta-ads)

---

## 1. Desenvolvimento Local (localdev)

Scripts para setup e gerenciamento do ambiente de desenvolvimento local.

### Estrutura

```
localdev/
├── localdev.sh              # Menu interativo principal
├── 1-validate-env.sh        # Validação de ambiente
├── 2-backup-production.sh   # Backup do banco de produção
├── 3-setup-local-env.sh     # Setup completo (7 etapas)
└── 4-quick-reset.sh         # Reset rápido do banco
```

### Uso

```bash
# Menu interativo (recomendado)
./localdev.sh

# Scripts individuais
./localdev/1-validate-env.sh      # Validar Docker, Node, Supabase CLI
./localdev/2-backup-production.sh # Backup produção (pede senha)
./localdev/3-setup-local-env.sh   # Setup completo
./localdev/4-quick-reset.sh       # Reset rápido
```

### Credenciais Locais

| Campo | Valor |
|-------|-------|
| Email | `bruno@jumper.studio` |
| Senha | `senha123` |

### Endpoints

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Supabase Studio | http://127.0.0.1:54323 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Edge Functions | http://127.0.0.1:54321/functions/v1/ |

### Troubleshooting

**Docker não está rodando:**
```bash
# Abrir Docker Desktop, aguardar, executar:
./localdev/1-validate-env.sh
```

**Porta 8080 ocupada:**
```bash
kill -9 $(lsof -ti:8080)
```

**Dados corrompidos:**
```bash
./localdev/4-quick-reset.sh
```

---

## 2. Alertas de Saldo Meta Ads

Sistema automatizado para monitorar saldo de contas Meta Ads e alertar quando estiver em perigo.

### Arquitetura

```
Windsor.ai (sync diário)
    │
    ▼
j_rep_metaads_account_balance (Supabase)
    │
    │ Colunas GENERATED:
    │ - current_balance = (spend_cap - amount_spent) / 100
    │ - avg_daily_spend = spend_last_7d / 7
    │ - days_remaining = current_balance / avg_daily_spend
    │
    ▼
pg_cron (9:00 UTC / 6:00 BRT)
    │
    ▼
Edge Function: j_hub_balance_check_alerts
    │
    ▼
Webhook n8n → Slack/WhatsApp
```

### Tabelas

**j_rep_metaads_account_balance** - Dados de saldo

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta Meta Ads |
| `account_name` | TEXT | Nome da conta |
| `spend_cap` | BIGINT | Limite de gasto (centavos) |
| `amount_spent` | BIGINT | Já gasto (centavos) |
| `current_balance` | NUMERIC | **GENERATED** - Saldo em R$ |
| `days_remaining` | NUMERIC | **GENERATED** - Dias até acabar |
| `alert_threshold_days` | INTEGER | Threshold para alertar (default: 10) |
| `alert_enabled` | BOOLEAN | Se alertas estão ativos |

**j_hub_balance_alerts** - Histórico de alertas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `account_id` | TEXT | ID da conta |
| `balance_at_alert` | NUMERIC | Saldo no momento |
| `days_remaining_at_alert` | NUMERIC | Dias restantes |
| `status` | ENUM | `pending`, `notified`, `resolved` |

### Configuração de Threshold

```sql
-- Definir threshold de 7 dias para uma conta
UPDATE j_rep_metaads_account_balance
SET alert_threshold_days = 7
WHERE account_id = '1097627115593816';

-- Desabilitar alertas para uma conta
UPDATE j_rep_metaads_account_balance
SET alert_enabled = false
WHERE account_id = '1097627115593816';
```

**Thresholds recomendados:**

| Método Pagamento | Threshold | Razão |
|------------------|-----------|-------|
| Boleto | 5-7 dias | Tempo para gerar, pagar, compensar |
| Pix | 3-5 dias | Compensação imediata |
| Cartão | 3 dias | Cobrança automática |
| Faturamento | 7-10 dias | Processo de aprovação |

### Payload do Webhook

```json
{
  "account_id": "1097627115593816",
  "account_name": "Conta Example",
  "current_balance": 920.53,
  "days_remaining": 5,
  "avg_daily_spend": 184.10,
  "payment_method": "Boleto",
  "alert_date": "2026-01-11"
}
```

### Troubleshooting

**Alerta não disparou:**
```sql
-- Verificar dias restantes
SELECT account_name, days_remaining, alert_threshold_days
FROM j_rep_metaads_account_balance
WHERE date = (SELECT MAX(date) FROM j_rep_metaads_account_balance)
ORDER BY days_remaining ASC;

-- Verificar alertas ativos
SELECT * FROM j_hub_balance_alerts
WHERE status IN ('pending', 'notified');
```

**Resolver alerta manualmente:**
```sql
UPDATE j_hub_balance_alerts
SET status = 'resolved', resolved_at = now()
WHERE account_id = '1097627115593816'
  AND status = 'notified';
```

---

**Última atualização:** 2026-01-11
