# Decks System - Roadmap & Future Improvements

> **Status Atual:** v2.1.14 - Phases 1 & 2 Complete (2024-11-11)
>
> Sistema de geração de apresentações HTML com IA, incluindo versionamento e refinamento iterativo.

---

## 🎯 Vision

Criar um sistema completo de geração, refinamento e análise de apresentações que:
- Permite iteração rápida com feedback textual para IA
- Preserva histórico completo de versões
- Aprende com refinamentos para melhorar templates
- Fornece insights sobre padrões de uso e qualidade

---

## ✅ Phase 1: Versionamento (COMPLETE - v2.1.14)

**Objetivo:** Sistema de controle de versões para decks gerados

**Implementado:**
- ✅ Database: `j_hub_deck_versions` table (histórico completo)
- ✅ Database: `current_version` e `is_refined` em `j_hub_decks`
- ✅ Backend: `j_hub_deck_generate` cria v1 automaticamente
- ✅ Frontend: Badge de versão em `DeckCard` (v1 cinza, v2+ âmbar ✨)
- ✅ Frontend: `DeckVersionHistory` component (Sheet com lista)
- ✅ Feature: Botão "Ver Histórico" em `DeckEditor`
- ✅ Feature: Restaurar versões antigas (rollback)

**Resultado:**
- Cada deck gerado automaticamente vira v1
- Histórico completo de mudanças preservado
- Usuário pode voltar para qualquer versão anterior

---

## ✅ Phase 2: AI Refinement (COMPLETE - v2.1.14)

**Objetivo:** Refinamento iterativo com feedback textual para IA

**Implementado:**
- ✅ Backend: `j_hub_deck_refine` Edge Function
  - Input: `deck_id` + `refinement_prompt` (texto livre)
  - Processing: Claude Sonnet 4.5 aplica mudanças específicas
  - Validation: Garante URLs absolutas e fidelidade de dados
  - Output: Nova versão (v2, v3, ...) com HTML refinado
- ✅ Frontend: `DeckRefineModal` component
  - Textarea para feedback textual
  - Exemplos clicáveis de refinamentos
  - Alertas sobre como funciona versionamento
  - Loading states durante processamento (~30-60s)
- ✅ Feature: Botão "Refinar com IA" em `DeckEditor` (apenas editors)
- ✅ Feature: Toast com resumo de mudanças após refinamento
- ✅ Permissions: Apenas admins/staff/owners podem refinar

**Resultado:**
- Usuário descreve mudanças desejadas em português natural
- IA aplica mudanças precisas sem regenerar tudo
- Nova versão criada automaticamente (v2, v3, ...)
- Histórico completo de prompts e mudanças

**Exemplo de uso:**
```
Prompt: "Aumentar o tamanho do título no slide 1 e mudar a cor de fundo do slide 3 para azul escuro"
→ IA aplica APENAS essas mudanças
→ v2 criada com `changes_summary`
→ Histórico mostra o que foi pedido e o que foi feito
```

---

## 🔄 Phase 3: Version Comparison (PENDING)

**Objetivo:** Comparação visual lado a lado entre versões

**Planejado:**

### 3.1. DeckVersionComparison Component
**Descrição:** Componente para visualizar duas versões simultaneamente

**Features:**
- Split-screen com duas iframes (versão antiga | versão nova)
- Selector de versões (dropdown para escolher v1, v2, v3, ...)
- Sincronização de scroll entre painéis
- Destaque visual das diferenças (se possível via diff HTML)
- Botão "Restaurar esta versão" em cada painel

**UI/UX:**
```
┌─────────────────────────────────────────────┐
│  Comparar Versões                           │
│  ┌──────────┐         ┌──────────┐          │
│  │ v1 ▼    │         │ v3 ▼    │          │
│  └──────────┘         └──────────┘          │
├─────────────────────────────────────────────┤
│  ┌───────────────┐   ┌───────────────┐     │
│  │               │   │               │     │
│  │   Slide 1     │   │   Slide 1     │     │
│  │   (v1)        │   │   (v3)        │     │
│  │               │   │               │     │
│  └───────────────┘   └───────────────┘     │
│  [Restaurar v1]      [Restaurar v3]        │
└─────────────────────────────────────────────┘
```

**Technical Implementation:**
- Component: `src/components/decks/DeckVersionComparison.tsx`
- Props: `deckId`, `leftVersion`, `rightVersion`, `onRestore`
- State: Selected versions, sync scroll position
- Data: Fetch HTML from `j_hub_deck_versions` table

**Integration:**
- Add button "Comparar Versões" to `DeckVersionHistory` component
- Opens dialog/sheet with side-by-side view
- User can select which versions to compare

**Priority:** Medium (nice-to-have para power users)

---

## 📊 Phase 4: Template Learning & Analytics (PENDING)

**Objetivo:** Aprender com refinamentos para melhorar templates automaticamente

### 4.1. j_hub_template_analyze Edge Function
**Descrição:** Analisa padrões de refinamento para gerar insights

**Input:**
```typescript
{
  template_id: string,        // Ex: "jumper-flare"
  time_range?: string,        // Ex: "last_30_days"
  min_refinements?: number    // Mínimo de refinamentos para considerar
}
```

**Processing:**
1. Buscar todos decks com `template_id` especificado
2. Filtrar decks com `is_refined = true` (foram refinados)
3. Analisar `refinement_prompt` e `changes_summary` de todas versões
4. Identificar padrões comuns:
   - Quais slides são mais refinados?
   - Quais tipos de mudanças são mais frequentes?
   - Quais elementos precisam de ajustes (títulos, cores, layout)?
5. Usar IA (Claude) para gerar insights e recomendações

**Output:**
```typescript
{
  template_id: string,
  total_decks: number,
  total_refinements: number,
  common_patterns: [
    {
      category: "Typography",
      frequency: 45,  // 45% dos refinamentos
      examples: [
        "Aumentar tamanho do título",
        "Mudar fonte do texto",
        "Deixar título em negrito"
      ],
      recommendation: "Considerar aumentar font-size padrão de títulos"
    },
    {
      category: "Colors",
      frequency: 30,
      examples: [
        "Mudar cor de fundo para azul escuro",
        "Usar cor mais vibrante no CTA"
      ],
      recommendation: "Oferecer paleta de cores alternativas"
    }
  ],
  suggestions_for_template: [
    "Aumentar h1 de 48px para 56px",
    "Adicionar variante de cor de fundo (light/dark)",
    "Melhorar contraste em cards de métricas"
  ]
}
```

**Usage:**
```typescript
// Admin calls analysis
const { data } = await supabase.functions.invoke('j_hub_template_analyze', {
  body: { template_id: 'jumper-flare' }
});
```

### 4.2. TemplateInsights Component (Admin Only)
**Descrição:** Dashboard de insights sobre templates

**Features:**
- Lista de templates com estatísticas:
  - Total de decks gerados
  - % de decks refinados
  - Média de refinamentos por deck
  - Última análise realizada
- Botão "Analisar Template" para rodar `j_hub_template_analyze`
- Exibição de insights:
  - Gráficos de frequência de categorias
  - Lista de padrões comuns
  - Recomendações de melhorias
- Ação: "Aplicar melhorias ao template" (manual ou semi-automático)

**UI/UX:**
```
┌────────────────────────────────────────────┐
│  Template Analytics (Admin)                │
├────────────────────────────────────────────┤
│  Template: jumper-flare                    │
│  📊 120 decks gerados | 65% refinados      │
│  📈 Média: 2.3 refinamentos/deck           │
│  🕒 Última análise: 2024-11-10             │
│                                            │
│  [🔄 Analisar Novamente]                   │
├────────────────────────────────────────────┤
│  Padrões Mais Comuns:                      │
│                                            │
│  🎨 Typography (45%)                       │
│  → Aumentar tamanho do título              │
│  → Deixar texto em negrito                 │
│                                            │
│  🖌️ Colors (30%)                           │
│  → Mudar cor de fundo                      │
│  → Ajustar contraste                       │
│                                            │
│  📐 Layout (20%)                           │
│  → Reorganizar slides                      │
│  → Adicionar espaçamento                   │
├────────────────────────────────────────────┤
│  Recomendações:                            │
│  ✅ Aumentar h1 de 48px → 56px             │
│  ✅ Oferecer paleta alternativa            │
│  ✅ Melhorar contraste em cards            │
│                                            │
│  [📝 Aplicar ao Template]                  │
└────────────────────────────────────────────┘
```

**Technical Implementation:**
- Component: `src/components/decks/TemplateInsights.tsx`
- Route: `/admin/template-analytics` (admin only)
- Data: Calls `j_hub_template_analyze` Edge Function
- Charts: Use Recharts or similar for visualization

### 4.3. Template Update Workflow
**Descrição:** Aplicar aprendizados ao template base

**Manual Process (v1):**
1. Admin revisa insights gerados
2. Admin edita template HTML manualmente
3. Admin testa novo template localmente
4. Admin faz commit e deploy

**Semi-Automatic Process (v2 - Future):**
1. Admin seleciona recomendações para aplicar
2. Sistema gera diff proposto (mudanças no HTML/CSS)
3. Admin revisa e aprova
4. Sistema aplica mudanças automaticamente
5. Sistema versiona template (jumper-flare-v2)

**Fully Automatic Process (v3 - Long-term):**
1. Sistema analisa periodicamente (cronjob semanal)
2. Sistema identifica padrões com alta confiança
3. Sistema cria branch no git com melhorias
4. Sistema abre PR para revisão humana
5. Admin aprova PR → template atualizado

**Priority:** Low (requires significant manual work in v1)

---

## 🔮 Future Ideas (Backlog)

### 5.1. Real-time Collaboration
- Múltiplos usuários editando/refinando ao mesmo tempo
- Live cursors e presence indicators
- Conflict resolution quando refinamentos simultâneos

### 5.2. A/B Testing for Decks
- Criar variantes de um deck (A/B/C)
- Compartilhar diferentes versões com clientes
- Tracking de qual versão teve melhor engajamento

### 5.3. Smart Suggestions
- IA sugere melhorias automaticamente ao abrir deck
- "Este slide 3 poderia ter contraste melhor"
- "Slide 5 tem muito texto, considere dividir em 2"

### 5.4. Deck Templates Marketplace
- Staff/admins publicam templates customizados
- Usuários escolhem templates além dos padrões
- Versionamento de templates (jumper-flare-v1, v2, ...)

### 5.5. Export to PowerPoint
- Converter HTML → PPTX
- Manter formatação e layout
- Permitir edição offline

### 5.6. Audio Narration
- Usuário grava narração para cada slide
- Sistema sincroniza áudio com slides
- Export como vídeo MP4

---

## 🛠️ Technical Debt & Improvements

### Current Known Issues:
1. **PDF Generation:** Requires Playwright + Python script (manual process)
   - **Solution:** Create `j_hub_deck_export_pdf` Edge Function using Puppeteer
2. **Asset Management:** Assets scattered in `/public/decks/`
   - **Solution:** Centralize in Supabase Storage with CDN
3. **Template Validation:** No automated testing for templates
   - **Solution:** Add E2E tests using Playwright
4. **Large HTML Size:** Some decks exceed 500KB
   - **Solution:** Minify HTML/CSS, optimize images

### Performance Optimizations:
- [ ] Implement HTML caching in `DeckEditor` (avoid re-fetching)
- [ ] Add progressive loading for version history (paginate)
- [ ] Compress HTML before storage (gzip)
- [ ] Add image lazy loading in generated decks

### Security Improvements:
- [ ] Add rate limiting to `j_hub_deck_generate` (prevent abuse)
- [ ] Sanitize user input in refinement prompts (XSS prevention)
- [ ] Add CSRF tokens to share password forms
- [ ] Implement deck expiration for public shares (auto-delete after 30 days)

---

## 📅 Priority & Timeline

**Immediate (Next Session):**
- [ ] Test complete refinement workflow in production
- [ ] Fix any bugs found during testing
- [ ] Update documentation in `ARCHITECTURE.md`

**Short-term (1-2 weeks):**
- [ ] Phase 3: DeckVersionComparison component
- [ ] PDF export automation (Edge Function)
- [ ] Template validation tests

**Medium-term (1-2 months):**
- [ ] Phase 4: Template Learning & Analytics
- [ ] Asset management overhaul
- [ ] Performance optimizations

**Long-term (3-6 months):**
- [ ] Real-time collaboration
- [ ] A/B Testing
- [ ] Smart Suggestions
- [ ] Templates Marketplace

---

## 📚 Resources & References

**Documentation:**
- [CLAUDE.md](CLAUDE.md) - System overview and instructions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical details
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Session history

**Key Files:**
- Edge Functions: `supabase/functions/j_hub_deck_*`
- Components: `src/components/decks/`
- Templates: `public/decks/templates/`
- Migrations: `supabase/migrations/*deck*`

**External:**
- [Claude API Docs](https://docs.anthropic.com/claude/reference/messages_post)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 🤝 Contributing

**For Developers:**
1. Read `CLAUDE.md` for project context
2. Check this roadmap for planned features
3. Create feature branch: `git checkout -b feature/deck-comparison`
4. Implement feature following existing patterns
5. Test locally with `npm run dev` + `supabase start`
6. Update this roadmap if priorities change

**For Designers:**
1. Review existing templates in `public/decks/templates/`
2. Propose improvements via GitHub issues
3. Create mockups for new features (Figma/Sketch)
4. Collaborate with developers on implementation

---

**Last Updated:** 2024-11-11
**Maintained by:** Claude Code Assistant
**Next Review:** After Phase 3 completion
