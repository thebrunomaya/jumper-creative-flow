# 🔧 Troubleshooting - Erros de Autenticação Local

## 🚨 Problema: 401 Unauthorized / 403 Forbidden

**Sintomas:**
```
POST http://127.0.0.1:54321/functions/v1/j_hub_user_accounts 401 (Unauthorized)
GET http://127.0.0.1:54321/auth/v1/user 403 (Forbidden)
```

**Causa:** Após `npx supabase db reset`, as sessões de autenticação são invalidadas.

---

## ✅ Solução Completa

### **Passo 1: Limpar cache do navegador**

**Chrome/Edge:**
1. Pressione `F12` (abrir DevTools)
2. Botão direito no ícone **Reload**
3. Selecione **"Empty Cache and Hard Reload"**

**Ou use atalho:**
- Mac: `Cmd+Shift+R`
- Windows: `Ctrl+Shift+R`

---

### **Passo 2: Criar usuário de teste**

1. **Abra Supabase Studio:**
   ```
   http://127.0.0.1:54323
   ```

2. **Navegue para SQL Editor:**
   - Barra lateral esquerda → **SQL Editor**
   - Clique em **"New query"**

3. **Cole e execute o script:**
   - Abra: `scripts/create-local-test-user.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"** (ou `Cmd+Enter`)

4. **Verifique sucesso:**
   ```
   ✅ Auth user created: bruno@jumper.studio
   ✅ Hub user created: admin role
   ```

---

### **Passo 3: Fazer login no app**

1. **Feche todas as abas** do `localhost:8080`
2. **Abra nova aba:** http://localhost:8080
3. **Faça login:**
   - Email: `bruno@jumper.studio`
   - Senha: `jumper123`

4. **Verificar sucesso:**
   - ✅ Login bem-sucedido
   - ✅ Menu com nome "Bruno Maya"
   - ✅ Nenhum erro 401/403 no console

---

## 🔍 Verificação Manual (Via Studio)

### **Verificar se usuário existe:**

**Authentication > Users:**
1. Abra http://127.0.0.1:54323
2. Barra lateral → **Authentication** → **Users**
3. Procure: `bruno@jumper.studio`

**Deve aparecer:**
- Email: bruno@jumper.studio
- Status: ✅ Confirmed
- Created: (data recente)

### **Verificar se tem role admin:**

**Table Editor > j_hub_users:**
1. Barra lateral → **Table Editor**
2. Selecione tabela: `j_hub_users`
3. Procure linha com email `bruno@jumper.studio`

**Campos esperados:**
- email: bruno@jumper.studio
- role: **admin** (importante!)
- nome: Bruno Maya

---

## 🐛 Problemas Comuns

### **Erro: "User already exists"**

**Solução:** Usuário já existe mas sessão está inválida.

1. **Método 1 - Redefinir senha via Studio:**
   - Authentication > Users
   - Clique no email do usuário
   - Clique em **"Send reset password email"**
   - (Não vai enviar email em local, mas reseta estado)

2. **Método 2 - Deletar e recriar:**
   ```sql
   -- No SQL Editor:
   DELETE FROM auth.users WHERE email = 'bruno@jumper.studio';
   DELETE FROM public.j_hub_users WHERE email = 'bruno@jumper.studio';

   -- Depois execute o script create-local-test-user.sql novamente
   ```

### **Erro: "Role 'admin' not working"**

**Verificar:**
```sql
SELECT email, role FROM public.j_hub_users WHERE email = 'bruno@jumper.studio';
```

**Se role não for 'admin':**
```sql
UPDATE public.j_hub_users
SET role = 'admin'
WHERE email = 'bruno@jumper.studio';
```

### **Erro: "Edge Functions still returning 401"**

**Verificar que Edge Functions estão rodando:**
```bash
# Terminal separado
npx supabase functions serve
```

**Deve mostrar:**
```
Serving functions on http://127.0.0.1:54321
✓ j_hub_user_accounts
✓ j_hub_optimization_extract
✓ ... (outras functions)
```

**Se não estiverem listadas:**
```bash
# Parar tudo
npx supabase stop

# Iniciar novamente
npx supabase start

# Servir functions
npx supabase functions serve
```

---

## 🔄 Reset Completo (Última opção)

Se nada funcionar, reset completo:

```bash
# 1. Parar Supabase
npx supabase stop

# 2. Limpar volumes do Docker
docker volume prune -f

# 3. Reiniciar Supabase
npx supabase start

# 4. Aplicar migrations
npx supabase db reset

# 5. Criar usuário de teste
# Execute: scripts/create-local-test-user.sql no Studio

# 6. Servir Edge Functions
npx supabase functions serve

# 7. Iniciar frontend
npm run dev

# 8. Limpar cache do navegador (F12 > Hard Reload)

# 9. Login: bruno@jumper.studio / jumper123
```

---

## 📊 Verificação de Saúde

**Checklist completo:**

### **Backend (Supabase):**
- [ ] `npx supabase status` mostra tudo rodando
- [ ] Studio acessível: http://127.0.0.1:54323
- [ ] Usuário existe em `Authentication > Users`
- [ ] Usuário tem role `admin` em `j_hub_users`

### **Edge Functions:**
- [ ] Terminal com `npx supabase functions serve` rodando
- [ ] Logs não mostram erros
- [ ] Functions listadas: j_hub_user_accounts, j_hub_optimization_extract, etc.

### **Frontend:**
- [ ] `npm run dev` rodando sem erros
- [ ] Acessível: http://localhost:8080
- [ ] Console (F12) sem erros 401/403
- [ ] Login funciona

### **Auth Session:**
- [ ] Login com bruno@jumper.studio / jumper123
- [ ] Menu mostra nome "Bruno Maya"
- [ ] Sidebar carrega corretamente
- [ ] Nenhum erro no console

---

## 🆘 Ainda com problemas?

**Capture evidências:**
1. Screenshot do erro no console (F12)
2. Log do terminal Edge Functions
3. Output de `npx supabase status`
4. Screenshot do Studio > Authentication > Users

**E me chame com essas informações!**
