# 🗺️ ROADMAP - Jumper Creative Flow

## 📊 Status Atual do Projeto
**Última Atualização:** 2024-11-05
**Versão:** v2.1.11
**Ambiente:** Produção (hub.jumper.studio)
**Status:** ✅ Operacional

---

## ✅ FASE 1 - COMPLETA (Set/2024)
### Sistema Base de Upload de Criativos
- ✅ Sistema de upload e validação de criativos
- ✅ Integração com Notion API
- ✅ Autenticação e roles (admin/staff/client)
- ✅ Deploy em produção
- ✅ Edge functions operacionais
- ✅ Sistema resiliente com retry logic
- ✅ Validação de mídia por formato
- ✅ Fluxo multi-step funcional
- ✅ 9 Dashboards especializados por objetivo
- ✅ Performance indicators com thresholds
- ✅ Design system Jumper aplicado
- ✅ Mobile-first responsive

---

## ✅ FASE 2 v2.1 - COMPLETA (Nov/2024)
### Optimization System & Decks
- ✅ Nova página `/optimization/new` com fluxo completo
- ✅ Seletor de período estilo Facebook
- ✅ Auto-save de rascunhos (localStorage + recovery)
- ✅ ContextEditor aprimorado (contador, preview)
- ✅ Database: `date_range_start/end`, `is_draft`, `draft_data`
- ✅ **Decks System** - Geração de apresentações HTML com IA (Claude Sonnet 4.5)
- ✅ Password-protected sharing (PBKDF2 Web Crypto API)
- ✅ Anonymous browser access (--no-verify-jwt)
- ✅ Full-screen preview e compartilhamento público
- ✅ Template system (moldura-minuto)
- ✅ Brand identities (Jumper/Koko)

---

## 🔄 AJUSTES OPCIONAIS - Melhorias de UX/Design
**Origem:** Teste de UX realizado em 2025-08-26  
**Prioridade:** Opcional / Nice-to-have

### 🎯 Alta Prioridade
1. **Corrigir Erro HTTP 400**
   - Erro recorrente nos logs do console
   - Não impede funcionamento mas polui logs
   - Investigar origem na edge function

2. **Adicionar Loading Spinner**
   - Falta feedback visual durante processamento
   - Adicionar spinner/skeleton durante envio
   - Melhorar percepção de responsividade

3. **Melhorar Contraste de Cores**
   - Textos secundários com baixo contraste
   - Revisar cores seguindo WCAG AA
   - Especialmente textos em cinza claro

4. **Consolidar Modais de Aviso**
   - Sistema mostra múltiplos modais desnecessários
   - Unificar avisos em fluxo único
   - Reduzir fricção no processo

### 🔧 Média Prioridade
5. **Simplificar Nomenclatura de Criativos**
   - Nome gerado muito complexo (JSC-XXX_nome_CONV_SING_ACCT#XXX)
   - Adicionar tooltip explicativo
   - Ou simplificar formato

6. **Otimizar Cards de Upload**
   - Cards muito grandes verticalmente
   - Reduzir tamanho para melhor uso de espaço
   - Manter funcionalidade

7. **Padronizar Sistema de Ícones**
   - Mix de emojis e ícones SVG
   - Escolher uma abordagem consistente
   - Sugestão: manter apenas ícones SVG

8. **Implementar Auto-save**
   - Adicionar salvamento automático
   - Indicador visual de "salvando..."
   - Prevenir perda de dados

### 💡 Baixa Prioridade
9. **Melhorar Indicação de Campos Obrigatórios**
   - Asterisco (*) muito sutil
   - Adicionar borda vermelha ou outro indicador
   - Melhorar acessibilidade

10. **Adicionar Tooltips Contextuais**
    - Campos complexos precisam explicação
    - Hover tooltips com informações úteis
    - Especialmente em nomenclaturas técnicas

11. **Preview em Tempo Real**
    - Mostrar como ficará o anúncio
    - Preview por plataforma (Meta/Google)
    - Side-by-side com formulário

12. **Atalhos de Teclado**
    - Navegação entre etapas (Ctrl+→/←)
    - Submit rápido (Ctrl+Enter)
    - Melhorar produtividade power users

---

## 📊 HISTÓRICO DE PERFORMANCE (Técnico)
### ✅ Otimizações Implementadas (2025-08-25)
- **Bundle Optimization**: 852KB → 70KB inicial (91% redução)
- **Data Architecture**: API calls eliminadas (95% melhoria no loading)
- **Reports System**: Templates inteligentes + performance indicators
- **Sync Migration**: Zero calls em tempo real para Notion API
- **Asset Optimization**: Gradientes otimizados, lazy loading
- **Deploy Infrastructure**: Produção ativa (hub.jumper.studio)

### 🔄 Próximas Otimizações (Opcional)
- **Redis Cache**: $2-5/mês (baixa prioridade - sync tables superaram)
- **Code Cleanup**: Remoção de edge functions obsoletas
- **Component Memoization**: Otimizações adicionais de React
- **Service Worker**: Cache offline e background sync

---

## 🔄 FASE 2.2 - EM PLANEJAMENTO (Nov/2024)
### Sistema de Insights Comparativos (REPORTS branch)
- [ ] Detecção de anomalias automática
- [ ] Alertas em tempo real
- [ ] Comparação de períodos (MoM, YoY)
- [ ] Insights acionáveis via IA
- [ ] Exportação de relatórios PDF

## 🚀 FASE 3 - PLANEJADA (2025)
### Expansão de Funcionalidades
- [ ] Sistema de templates de criativos
- [ ] Integração com Meta Business API (ads programáticos)
- [ ] Integração com Google Ads API
- [ ] Bulk upload de criativos
- [ ] A/B testing automático
- [ ] Workflow de aprovação em múltiplas etapas

---

## 💎 FASE 4 - FUTURO (1-2 anos)
### Plataforma Self-Service Completa
- [ ] Portal do cliente final
- [ ] Sistema de pagamentos integrado
- [ ] White-label para parceiros
- [ ] API pública para integrações
- [ ] Mobile app (React Native)
- [ ] IA para geração de copies
- [ ] Otimização automática de campanhas
- [ ] Multi-plataforma ads (Meta, Google, TikTok, LinkedIn)

---

## 📝 Notas de Implementação

### Para os Ajustes de UX/Design:
- Podem ser implementados incrementalmente
- Não requerem mudanças estruturais
- Melhorarão significativamente a experiência
- Estimativa: 2-3 dias para implementar todos os ajustes de alta prioridade

### Métricas de Sucesso:
- Redução de 50% em tickets de suporte sobre "como usar"
- Aumento de 30% na velocidade de criação de criativos
- NPS > 8.5 dos usuários gerentes
- Zero perda de dados por timeout/navegação

---

## 🔗 Referências
- [Relatório de Teste UX](./TEST-REPORT-UX-DESIGN.md)
- [Documentação Claude](./CLAUDE.md)
- [Design System](https://hub.jumper.studio/design-system)

---

**Última revisão:** 2024-11-05 por Claude Code Assistant