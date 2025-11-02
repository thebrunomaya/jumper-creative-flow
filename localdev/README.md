# Scripts de Desenvolvimento Local

Scripts corrigidos para setup e gerenciamento do ambiente local do Jumper Hub.

## 📁 Estrutura

```
localdev/
├── localdev.sh              # Menu interativo principal
├── 1-validate-env.sh        # Validação de ambiente
├── 2-backup-production.sh   # Backup do banco de produção
├── 3-setup-local-env.sh     # Setup completo (7 etapas)
└── 4-quick-reset.sh         # Reset rápido do banco
```

## 🚀 Uso Rápido

### Menu Interativo (Recomendado)
```bash
./localdev.sh
```

Escolha os scripts para executar:
- Digite números separados por espaço: `1 2 4`
- Ou `all` para executar tudo

### Scripts Individuais

**1. Validar Ambiente**
```bash
./localdev/1-validate-env.sh
```
Verifica: Docker, PostgreSQL tools, Node.js, Supabase CLI, configurações

**2. Backup Produção**
```bash
./localdev/2-backup-production.sh
```
Cria backup do banco de produção (solicita senha interativamente)

**3. Setup Completo**
```bash
./localdev/3-setup-local-env.sh
```
Setup completo em 7 etapas: backup → Supabase → reset → restore → senha → deps → server

**4. Reset Rápido**
```bash
./localdev/4-quick-reset.sh
```
Reset rápido: apaga dados → reaplica migrations → restaura backup

## 🎨 Melhorias Visuais

Todos os scripts agora incluem:
- ✅ Cores para status (verde = sucesso, vermelho = erro, amarelo = aviso)
- 📊 Emojis para contexto visual
- 🔍 Separadores visuais entre seções
- ⏳ Indicadores de progresso/tempo

## ⚙️ Correções Implementadas

### Paths Corrigidos
- ✅ `localdev.sh` executa scripts com `./localdev/script.sh`
- ✅ Scripts referem outros scripts corretamente
- ✅ Caminhos relativos funcionam de qualquer diretório

### Validações
- Backup recente (< 24h) reutilizável
- Teste de conexão antes de backup longo
- Validação pós-restore (contagem de usuários)
- Check de espaço em disco

## 📋 Fluxo Recomendado

**Primeira vez:**
```bash
./localdev.sh
# Escolher: all
```

**Dia-a-dia (dados bagunçados):**
```bash
./localdev/4-quick-reset.sh
```

**Atualizar migrations:**
```bash
./localdev/3-setup-local-env.sh
```

## 🔑 Credenciais

**Desenvolvimento Local:**
- Email: `bruno@jumper.studio`
- Senha: `senha123`

**Produção:**
- Senha solicitada interativamente quando necessário
- Nunca armazenada em arquivos

## 🌐 Endpoints

Após setup:
- Frontend: http://localhost:8080
- Supabase Studio: http://127.0.0.1:54323
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Edge Functions: http://127.0.0.1:54321/functions/v1/

## 🐛 Troubleshooting

**Docker não está rodando:**
```bash
# Abrir Docker Desktop e aguardar inicializar
# Executar novamente: ./localdev/1-validate-env.sh
```

**Backup falhou:**
```bash
# Verificar senha de produção
# Verificar conexão de rede
# Ver logs: cat /tmp/backup.log
```

**Restore incompleto:**
```bash
# Reset completo:
./localdev/3-setup-local-env.sh
```

**Porta 8080 ocupada:**
```bash
# Matar processo:
kill -9 $(lsof -ti:8080)
# Ou responder 'yes' quando script perguntar
```

## 📝 Notas

- Scripts assumem projeto Supabase: `biwwowendjuzvpttyrlb`
- Backups salvos em: `./backups/`
- Logs em: `/tmp/backup.log`, `/tmp/restore.log`, `/tmp/vite-dev.log`
- Ambiente local usa anon key padrão do Supabase

---

**Última atualização:** 2025-11-01
**Versão:** 2.0 (paths corrigidos + cores)
