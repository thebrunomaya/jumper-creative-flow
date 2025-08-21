# Personalização do Template de Email - Supabase Magic Link

## 📧 Como Personalizar o Email Template

### **1. Acessar Configurações de Email**
1. Acesse o **Supabase Dashboard**
2. Vá para **Authentication → Email Templates**
3. Encontre **"Magic Link"** na lista de templates

### **2. Customizar o Template**

**Template Sugerido para Jumper Ads:**

```html
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Acesso à Plataforma Jumper Ads</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8f9fa;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #FA4721;
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .access-button {
      display: inline-block;
      background: #FA4721;
      color: white !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
    }
    .access-button:hover {
      background: #e63d1c;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #FA4721;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">JUMPER ADS</div>
      <div class="subtitle">Plataforma de Gestão de Criativos</div>
    </div>
    
    <div class="content">
      <div class="greeting">Olá! 👋</div>
      
      <div class="message">
        Você solicitou acesso à plataforma <strong>Jumper Ads</strong>. 
        Clique no botão abaixo para fazer login de forma segura:
      </div>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="access-button">
          🚀 ACESSAR PLATAFORMA
        </a>
      </div>
      
      <div class="message" style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        Se você não solicitou este acesso, pode ignorar este email com segurança.<br>
        Este link é válido por 1 hora por questões de segurança.
      </div>
    </div>
    
    <div class="footer">
      <div>
        <strong>Jumper Studio</strong><br>
        Democratizando o acesso ao tráfego pago de qualidade
      </div>
      <div style="margin-top: 15px;">
        <a href="https://jumper.studio">jumper.studio</a> • 
        <a href="mailto:contato@jumper.studio">contato@jumper.studio</a>
      </div>
    </div>
  </div>
</body>
</html>
```

### **3. Variáveis Disponíveis**
- `{{ .Email }}` - Email do usuário
- `{{ .ConfirmationURL }}` - Link de confirmação (magic link)
- `{{ .SiteURL }}` - URL do site configurada
- `{{ .Token }}` - Token de confirmação

### **4. Template Alternativo (Minimalista)**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #FA4721; margin-bottom: 10px;">JUMPER ADS</h1>
    <p style="color: #666;">Acesso à Plataforma</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #333; margin-top: 0;">Seu link de acesso está pronto! 🔗</h2>
    
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Clique no botão abaixo para acessar a plataforma Jumper Ads de forma segura:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #FA4721; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 6px; font-weight: bold;">
        ACESSAR PLATAFORMA
      </a>
    </div>
    
    <p style="color: #888; font-size: 14px;">
      Link válido por 1 hora • Se não foi você, ignore este email
    </p>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    Jumper Studio - <a href="https://jumper.studio" style="color: #FA4721;">jumper.studio</a>
  </div>
</div>
```

## 🎨 Personalizações Adicionais

### **Subject Line (Assunto)**
- Padrão: "Magic Link"
- Sugerido: "🔗 Seu acesso à Jumper Ads"

### **From Name**
- Padrão: "noreply@mail.app.supabase.io"
- Sugerido: "Jumper Ads" (requer configuração de SMTP custom)

## 🔧 Passos para Aplicar

1. **Dashboard** → **Authentication** → **Email Templates**
2. **Selecione "Magic Link"**
3. **Cole o template HTML acima**
4. **Teste enviando um magic link**
5. **Ajuste cores/textos conforme necessário**

## 📱 Responsividade

Os templates acima são responsivos e funcionam bem em:
- Desktop
- Mobile
- Clients de email populares (Gmail, Outlook, etc.)