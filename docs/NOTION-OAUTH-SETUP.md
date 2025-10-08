# 🔐 Notion OAuth Setup - Guia de Configuração

> **Implementado em:** Outubro 2024
> **Status:** ✅ Código implementado | ⏳ Aguardando configuração OAuth

---

## 📋 Resumo

Este documento detalha o processo de configuração do Notion OAuth para permitir que **Gestores e Supervisores** acessem o sistema ads.jumper.studio usando suas contas do Notion workspace, sem necessidade de cadastro manual em DB_Gerentes.

---

## 🎯 Objetivo

**ANTES:**
- Gestores precisavam ser cadastrados manualmente em DB_Gerentes
- IDs de contas precisavam ser configurados manualmente
- Dupla manutenção (Notion + Supabase)

**DEPOIS:**
- Gestores fazem login com Notion OAuth
- Contas vinculadas automaticamente via campos "Gestor"/"Supervisor"
- Zero configuração manual
- Sincronização automática com Notion workspace

---

## ⚙️ FASE 1: Configuração no Notion (15 minutos)

### Passo 1: Acessar Notion Integrations

1. Faça login no Notion
2. Acesse: https://www.notion.so/my-integrations
3. Clique em **"+ New integration"**

### Passo 2: Configurar a Integração

**Basic Information:**
- **Name:** `Jumper Ads Platform`
- **Associated workspace:** Selecione o workspace da Jumper Studio
- **Logo:** (Opcional) Upload logo da Jumper

**Integration Type:**
- ✅ Selecione **"Public integration"**
- ⚠️ **IMPORTANTE:** NÃO selecione "Internal"

**Capabilities:**
- ✅ **Read user information including email addresses**
- ⚠️ Esta opção é CRÍTICA - sem ela o OAuth não funciona

**Content Capabilities:**
- Pode deixar TODAS desmarcadas (não precisamos ler conteúdo)

### Passo 3: Configurar Redirect URI

Após criar a integração, você verá a aba **"OAuth Domain and URIs"**.

1. Em **Redirect URIs**, clique em **"Add redirect URI"**
2. Cole exatamente este URL:
   ```
   https://biwwowendjuzvpttyrlb.supabase.co/auth/v1/callback
   ```
3. Clique em **"Save"**

### Passo 4: Copiar Credenciais

Na aba **"OAuth Domain and URIs"**, copie:

1. **OAuth client ID** (começa com `oauth2-...`)
2. **OAuth client secret** (clique em "Show" e copie)

⚠️ **GUARDE ESSAS CREDENCIAIS EM LUGAR SEGURO!**

---

## ⚙️ FASE 2: Configuração no Supabase (5 minutos)

### Passo 1: Acessar Supabase Dashboard

1. Faça login em: https://supabase.com/dashboard
2. Selecione o projeto: `biwwowendjuzvpttyrlb`
3. No menu lateral, vá em: **Authentication** → **Providers**

### Passo 2: Habilitar Notion Provider

1. Procure por **"Notion"** na lista de providers
2. Clique para expandir
3. **Enable Notion:** ✅ Toggle ON

### Passo 3: Colar Credenciais

Cole as credenciais copiadas do Notion:

1. **Notion Client ID:** Cole o `OAuth client ID`
2. **Notion Client Secret:** Cole o `OAuth client secret`

### Passo 4: Salvar

1. Clique em **"Save"**
2. Aguarde confirmação de sucesso

---

## 🔄 FASE 3: Sincronização Notion → Supabase (10 minutos)

⚠️ **CRÍTICO:** Antes de testar, você DEVE executar a sincronização do Notion para atualizar os campos "Gestor" e "Supervisor" com emails ao invés de nomes.

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: **Edge Functions** no dashboard
2. Encontre: `j_ads_notion_sync_accounts`
3. Clique em **"Invoke"**
4. Aguarde execução (pode levar 30-60 segundos)
5. Verifique logs para confirmar sucesso

### Opção B: Via Code (Admin)

Se você é admin, pode chamar diretamente no console do navegador:

```javascript
// Abrir ads.jumper.studio
// F12 → Console
// Colar e executar:

const { data, error } = await supabase.functions.invoke('j_ads_notion_sync_accounts');
console.log('Sync result:', data, error);
```

### Verificar Sincronização

Após sync, verifique se funcionou:

1. Vá em **Database** → **j_ads_notion_db_accounts**
2. Procure por uma conta onde você sabe que há um gestor
3. Verifique o campo **"Gestor"**:
   - ✅ **CORRETO:** `claudio@jumper.studio, maria@jumper.studio`
   - ❌ **ERRADO:** `Cláudio Silva, Maria Santos`

Se ainda estiver com nomes, a API do Notion pode não estar retornando emails. Neste caso, entre em contato.

---

## 🧪 FASE 4: Testes (15 minutos)

### Teste 1: Gestor via Notion OAuth

**Pré-requisito:**
- Usuário tem email no Notion workspace: `claudio@jumper.studio`
- Aparece no campo "Gestor" de pelo menos uma conta

**Passos:**
1. Acesse: https://ads.jumper.studio
2. Clique em **"Entrar com Notion"**
3. Será redirecionado para Notion
4. Autorize o acesso
5. Retorna para ads.jumper.studio
6. **Resultado esperado:** Dashboard com contas vinculadas

**Verificar:**
- [ ] Login funcionou sem erros
- [ ] Exibe contas corretas (onde é Gestor)
- [ ] Role detectado como "manager"
- [ ] Pode acessar recursos de gestor

### Teste 2: Supervisor via Notion OAuth

**Pré-requisito:**
- Usuário aparece no campo "Supervisor" de pelo menos uma conta

**Passos:**
1. Repetir Teste 1 com usuário supervisor
2. **Resultado esperado:** Dashboard com contas onde é supervisor

**Verificar:**
- [ ] Exibe apenas contas onde é supervisor
- [ ] Role detectado como "supervisor"

### Teste 3: Gerente via Email/Password (Compatibilidade)

**Pré-requisito:**
- Usuário cadastrado em DB_Gerentes
- Tem contas vinculadas no campo "Contas"

**Passos:**
1. Acesse: https://ads.jumper.studio
2. Digite email e senha (fluxo normal)
3. **Resultado esperado:** Login funciona como antes

**Verificar:**
- [ ] Login email/senha ainda funciona
- [ ] Exibe contas do campo "Contas"
- [ ] Não houve regressão

### Teste 4: Usuário com Ambos Métodos

**Cenário:**
- Usuário tem email `teste@jumper.studio`
- Está em DB_Gerentes (pode fazer email/senha)
- Também aparece como Gestor em contas (pode fazer OAuth)

**Passos:**
1. Teste login via Notion OAuth → Deve funcionar
2. Logout
3. Teste login via Email/Password → Deve funcionar
4. **Resultado:** Ambos métodos funcionam

---

## 🐛 Troubleshooting

### Erro: "Notion OAuth not configured"

**Causa:** Credenciais não foram configuradas no Supabase
**Solução:** Revise FASE 2 - verifique Client ID e Secret

### Erro: "No accounts found"

**Causa 1:** Usuário não aparece em nenhum campo Gestor/Supervisor
**Solução:** Adicione o usuário como Gestor em pelo menos uma conta no Notion

**Causa 2:** Sincronização não foi executada
**Solução:** Execute FASE 3 - sync do Notion

**Causa 3:** Campo Gestor tem nome ao invés de email
**Solução:** Verifique se a API do Notion está retornando `person.email`

### Erro: "Invalid redirect URI"

**Causa:** Redirect URI não foi configurado corretamente no Notion
**Solução:** Revise FASE 1, Passo 3 - deve ser exatamente o URL fornecido

### Usuário não consegue autorizar no Notion

**Causa:** Usuário não tem acesso ao workspace
**Solução:** Convide o usuário para o workspace do Notion primeiro

---

## 📊 Logs e Debugging

### Ver Logs de Autenticação

**Supabase Edge Functions:**
1. Dashboard → Edge Functions
2. Selecione `j_ads_auth_roles`
3. Ver logs recentes
4. Procure por: `🔐 Detecting role for: [email]`

**Logs esperados (Notion OAuth):**
```
🔐 Detecting role for: claudio@jumper.studio | OAuth: true
🎯 Notion OAuth login - checking Gestor/Supervisor fields
✅ Found user as Gestor → role: manager
```

**Logs esperados (Email/Password):**
```
🔐 Detecting role for: gerente@cliente.com | OAuth: false
📧 Email/Password login - checking DB_Gerentes
✅ Role from DB_Gerentes → role: gerente
```

### Ver Logs de Contas

**Edge Function:** `j_ads_user_accounts`

**Procure por:**
```
🔐 Login method: Notion OAuth
🎯 Notion OAuth detected - searching by Gestor/Supervisor fields
✅ Found 5 accounts via Gestor/Supervisor
```

---

## 🔒 Segurança

### Dados Armazenados

**Notion OAuth retorna:**
- `user.id` (Supabase UUID - gerado)
- `user.email` (do Notion)
- `user.app_metadata.provider` = 'notion'
- `user.user_metadata` (nome, etc)

**Armazenamos:**
- ✅ Email (usado para matching)
- ✅ Provider (para detectar método de login)
- ❌ NÃO armazenamos Notion user ID
- ❌ NÃO armazenamos tokens do Notion

### Permissões da Integração

A integração Notion tem acesso a:
- ✅ Read user information (email, nome)
- ❌ NÃO tem acesso a pages/databases
- ❌ NÃO pode modificar conteúdo

### Revogação de Acesso

Se um usuário precisar ser removido:

1. **No Notion:** Remova email do campo Gestor/Supervisor
2. **Sync:** Execute `j_ads_notion_sync_accounts`
3. **Resultado:** Na próxima tentativa de login, não verá mais contas

---

## 📚 Referências

- [Supabase Notion Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-notion)
- [Notion OAuth Documentation](https://developers.notion.com/docs/authorization)
- [CLAUDE.md - Project Overview](../CLAUDE.md)

---

## ✅ Checklist Final

Antes de considerar o setup completo:

- [ ] Integração criada no Notion
- [ ] Redirect URI configurado
- [ ] Credenciais copiadas
- [ ] Provider habilitado no Supabase
- [ ] Credenciais coladas no Supabase
- [ ] Sincronização executada
- [ ] Campos Gestor/Supervisor com emails
- [ ] Teste 1 (Gestor OAuth) passou
- [ ] Teste 2 (Supervisor OAuth) passou
- [ ] Teste 3 (Email/Password) passou
- [ ] Logs verificados sem erros

---

**Setup completo?** Gestores e Supervisores agora podem fazer login com Notion OAuth! 🎉

**Dúvidas?** Entre em contato com o time de desenvolvimento.

**Última atualização:** Outubro 2024
