# 🔐 Instruções de Login - Teste Local

## ✅ Ambiente Configurado

**Status:**
- ✅ Supabase Local rodando
- ✅ Edge Functions rodando
- ✅ Frontend rodando (http://localhost:8080)
- ✅ Usuário criado no banco

---

## 👤 Credenciais de Teste

```
📧 Email:    bruno@jumper.studio
🔑 Senha:    jumper123
👑 Role:     admin
```

---

## 🚀 Como Fazer Login

### **1. Limpar Cache do Navegador**

**IMPORTANTE:** Faça isso PRIMEIRO!

**Chrome/Edge:**
1. Pressione `F12` (abrir DevTools)
2. Clique com botão direito no ícone **Reload** (próximo à barra de endereço)
3. Selecione: **"Empty Cache and Hard Reload"**

**Ou use atalho:**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + F5`

---

### **2. Acessar Página de Login**

1. Abra: http://localhost:8080
2. Você deve ver a tela de login Jumper

---

### **3. Fazer Login**

**Opção A - Login com Email/Senha:**
1. Digite: `bruno@jumper.studio`
2. Digite: `jumper123`
3. Clique em **"Entrar"** ou **"Login"**

**Opção B - Magic Link (se disponível):**
1. Digite: `bruno@jumper.studio`
2. Clique em **"Enviar link mágico"**
3. Abra: http://127.0.0.1:54324 (Mailpit - email local)
4. Clique no link do email

---

### **4. Verificar Sucesso**

**Após login bem-sucedido:**
- ✅ Redirecionado para dashboard/home
- ✅ Menu lateral aparece
- ✅ Nome "Bruno Maya" no header
- ✅ Sem erros 401/403 no console (F12)

---

## 🐛 Se Der Erro

### **Erro: "Database error querying schema"**

**Causa:** Database schema não está correto

**Solução:**
```bash
# No terminal:
npx supabase db reset

# Depois recriar usuário (vou te ajudar com isso)
```

---

### **Erro: 401 Unauthorized / 403 Forbidden**

**Console mostra:**
```
POST http://127.0.0.1:54321/auth/v1/token 500 (Internal Server Error)
```

**Solução:**
1. Verifique se Supabase está rodando:
   ```bash
   npx supabase status
   ```
2. Se não estiver, reinicie:
   ```bash
   npx supabase stop
   npx supabase start
   ```

---

### **Erro: "Invalid login credentials"**

**Causa:** Senha incorreta ou usuário não existe

**Verificar no Supabase Studio:**
1. Abra: http://127.0.0.1:54323
2. Menu lateral → **Authentication** → **Users**
3. Procure: `bruno@jumper.studio`

**Se não aparecer:**
- Usuário não foi criado corretamente
- Me chame para recriar

---

## 📊 Verificação no Studio

**Acesse:** http://127.0.0.1:54323

### **1. Verificar Usuário Auth:**
Menu: **Authentication** > **Users**

Deve aparecer:
```
Email: bruno@jumper.studio
Status: Confirmed ✅
Provider: email
```

### **2. Verificar Usuário Hub:**
Menu: **Table Editor** > **j_hub_users**

Deve aparecer:
```
email: bruno@jumper.studio
role: admin
nome: Bruno Maya
```

---

## 🧪 Teste Rápido no Console (F12)

Após fazer login, rode no console do navegador:

```javascript
// 1. Verificar sessão
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'Active ✅' : 'None ❌');

// 2. Verificar usuário
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.email);

// 3. Testar Edge Function
const { data, error } = await supabase.functions.invoke('j_hub_user_accounts');
console.log('Edge Function:', error ? '❌ Error' : '✅ Working');
```

---

## 🆘 Ainda Com Problemas?

**Me chame e envie:**

1. **Screenshot do erro** (F12 Console)
2. **Screenshot da tela de login**
3. **Output deste comando:**
   ```bash
   npx supabase status
   ```
4. **Últimas linhas do log:**
   ```bash
   tail -20 /tmp/supabase-functions.log
   ```

---

**🎯 Objetivo:** Fazer login e acessar a página de Otimizações sem erros!
