# 🚀 Jumper Creative Flow - Ad Uploader

Sistema profissional de upload e gestão de criativos publicitários da **Jumper Studio**.

## 📊 Status do Projeto

- **Versão**: 1.8
- **Ambiente**: Produção ativa
- **URL**: [hub.jumper.studio](https://hub.jumper.studio)
- **Status**: ✅ Operacional

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui (customizado)
- **Backend**: Supabase (Database + Edge Functions + Auth + Storage)
- **Deploy**: Vercel (produção automática)
- **Integration**: Notion API para gestão de clientes e criativos

## 🚀 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+ ([instalar via nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Acesso às credenciais Supabase

### Setup

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd jumper-creative-flow

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.template .env
# Edite .env com suas credenciais Supabase

# 4. Execute em desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev         # Servidor de desenvolvimento
npm run build       # Build de produção
npm run preview     # Preview do build
npm run lint        # Validação ESLint
npm run deploy      # Deploy para Vercel

# 🧹 Limpeza de arquivos temporários
npm run clean:temp              # Remove todos os arquivos temp/
npm run clean:temp:old          # Remove arquivos > 30 dias
npm run clean:temp:screenshots  # Remove apenas screenshots
npm run clean:temp:docs         # Remove apenas docs temporários
npm run clean:all               # Limpeza completa
```

## 🏗️ Arquitetura

### Frontend
```
src/
├── components/     # Componentes React reutilizáveis
├── pages/         # Páginas da aplicação
├── hooks/         # Custom hooks
├── utils/         # Utilitários puros
├── contexts/      # Context providers
└── assets/        # Recursos estáticos
```

### Backend (Supabase)
```
supabase/
├── functions/     # Edge Functions (Deno/TypeScript)
└── migrations/    # Migrações de banco
```

### 🗂️ Arquivos Temporários
```
temp/               # 🧹 PASTA PARA ARQUIVOS TEMPORÁRIOS
├── screenshots/    # Screenshots, prints de teste
├── docs/          # Documentação temporária, logs
├── html-templates/ # Templates HTML, mockups
├── debug-files/   # Scripts debug, testes
└── exports/       # Exports CSV/JSON temporários
```

> **💡 Dica**: Use sempre a pasta `temp/` para arquivos que podem ser deletados.  
> Esta pasta não vai para o Git e pode ser limpa com `npm run clean:temp`.

## 👥 Tipos de Usuário

- **👑 Administrador**: Acesso total, debugging, gestão
- **⚡ Gestor**: Gestores Jumper, edição/publicação de criativos  
- **👥 Supervisor**: Diretores de agências parceiras
- **📝 Gerente**: Gerentes de marketing, upload de criativos

## 🎯 Funcionalidades Principais

- ✅ Upload multi-formato de criativos (imagem/vídeo)
- ✅ Validação automática por posicionamento
- ✅ Sistema de roles e permissões
- ✅ Integração completa com Notion
- ✅ Dashboard de reports profissionais
- ✅ Sistema resiliente à prova de falhas
- ✅ Design system Jumper customizado

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Frontend (.env)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Backend (Supabase Edge Functions)  
SUPABASE_SERVICE_ROLE_KEY=chave_service_role
NOTION_TOKEN=token_integracao_notion
```

## 🚀 Deploy

### Produção
- **Deploy automático**: Push para `main` → Vercel deploy
- **URL de produção**: https://hub.jumper.studio
- **Monitoramento**: Via Vercel dashboard

### Manual
```bash
npm run deploy        # Deploy para produção
npm run deploy:preview # Deploy preview
```

## 📚 Documentação

- **[CLAUDE.md](./CLAUDE.md)** - Configuração detalhada do projeto
- **[ROADMAP.md](./ROADMAP.md)** - Roadmap estratégico e técnico
- **[Design System](https://hub.jumper.studio/design-system)** - Documentação visual

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Validação de files no upload
- Rate limiting nas Edge Functions
- HTTPS enforced em produção

## 📞 Suporte

- **Issues**: Reporte bugs via GitHub Issues
- **Documentação**: Claude Code configuration em `CLAUDE.md`
- **Deploy**: Vercel dashboard para logs e métricas

---

**Desenvolvido com ❤️ pela equipe Jumper Studio**  
**Powered by**: React + Supabase + Vercel + Claude Code