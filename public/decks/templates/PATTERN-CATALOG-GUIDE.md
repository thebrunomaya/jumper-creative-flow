# Pattern Catalog Guide

> **Como criar arquivos `[template-name]-patterns.json` para novos templates**

---

## 📋 Propósito

O arquivo `-patterns.json` é um **catálogo de padrões de slides** que a IA (Claude) usa durante a **Stage 1: Content Analysis** para recomendar os melhores slides para cada seção de conteúdo.

**Exemplo:** `koko-classic-patterns.json` contém 17 padrões de slides (hero-slide, metric-cards, timeline, etc.) que o Claude analisa e escolhe os mais adequados para o conteúdo do usuário.

---

## 🎯 Quando Criar um Pattern Catalog

Crie um `-patterns.json` quando:
- ✅ Você criar um novo template HTML personalizado
- ✅ O template for usado para geração de decks (não apenas visualização)
- ✅ O template tiver múltiplos padrões de slides reutilizáveis

**Não é necessário para:**
- ❌ Templates genéricos em `general-*.html` (apenas referência visual)
- ❌ Templates que não serão usados no sistema de geração

---

## 📐 Estrutura do Arquivo JSON

### **Esqueleto Base:**

```json
{
  "template_id": "jumper-flare",
  "template_version": "1.0",
  "template_name": "Jumper Flare Template",
  "description": "Short description of the template's design philosophy",
  "brand_colors": {
    "primary": "#FA4721",
    "secondary": "#000000",
    "accent": "#FFFFFF"
  },
  "patterns": [
    {
      "id": "pattern-slug",
      "name": "Pattern Display Name",
      "css_class": "css-class-name",
      "best_for": ["use-case-1", "use-case-2"],
      "content_type": "category",
      "description": "What this pattern does visually",
      "when_to_use": "Specific scenarios where this pattern excels",
      "required_elements": ["element-1", "element-2"],
      "example": "Concrete example of content that fits this pattern"
    }
  ]
}
```

---

## 🔑 Campos Obrigatórios

### **Metadados do Template:**

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `template_id` | string | ID do template (sem .html) | `"jumper-flare"` |
| `template_version` | string | Versão semântica | `"1.0"` ou `"2.1"` |
| `template_name` | string | Nome descritivo | `"Jumper Flare Template"` |
| `description` | string | Filosofia de design (1-2 frases) | `"Minimalist sophistication with strategic organic accents"` |
| `brand_colors` | object | Cores principais da marca | `{"primary": "#FA4721"}` |

### **Pattern Object:**

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | string | Identificador único (kebab-case) | `"hero-slide"` |
| `name` | string | Nome legível | `"Hero Slide"` |
| `css_class` | string | Classe CSS no template HTML | `"hero-slide"` |
| `best_for` | array | Use-cases (tags de pesquisa) | `["cover", "title-page"]` |
| `content_type` | string | Categoria do padrão | `"cover"`, `"metrics"`, `"chart"` |
| `description` | string | O que o padrão faz visualmente | `"Dramatic cover slide with large title"` |
| `when_to_use` | string | Quando recomendar este padrão | `"First slide of presentation"` |
| `required_elements` | array | Elementos HTML obrigatórios | `["title", "subtitle"]` |
| `example` | string | Exemplo concreto de conteúdo | `"TÍTULO + Subtítulo + Data"` |

---

## 📊 Categorias de Content Type

Use estas categorias padronizadas:

| Content Type | Uso | Exemplos de Patterns |
|--------------|-----|----------------------|
| `cover` | Slides de capa/abertura | hero-slide, title-page |
| `narrative` | Texto/conteúdo explicativo | content-slide, text-heavy |
| `metrics` | KPIs e números-chave | metric-cards, kpi-grid |
| `chart` | Visualizações de dados | line-chart, bar-chart, donut-chart |
| `timeline` | Evolução temporal | timeline, process-flow |
| `statement` | Mensagens impactantes | statement-slide, big-number |
| `structure` | Estrutura/agenda | table-of-contents, funnel |
| `comparison` | Antes/Depois, A vs B | comparison-grid, split-view |
| `callout` | Destaques/avisos | emphasis-box, warning-box |
| `data` | Dados estruturados | data-table, data-list |
| `grid` | Múltiplos itens em grid | cards-grid, features-grid |
| `divider` | Separadores de seção | section-divider, chapter-break |
| `conclusion` | Slides finais | conclusion-slide, next-steps |

---

## 🎨 Como Identificar Padrões no HTML

### **1. Analise o Template HTML**

Abra o arquivo `.html` e procure por classes CSS distintas:

```html
<!-- Exemplo: jumper-flare.html -->
<div class="slide slide-split slide-split-gradient-right">
  <!-- Pattern: cover slide com gradient -->
</div>

<div class="slide">
  <div class="cards-container">
    <!-- Pattern: cards grid -->
  </div>
</div>

<div class="slide">
  <div class="comparison-grid">
    <!-- Pattern: comparison -->
  </div>
</div>
```

### **2. Identifique Padrões Reutilizáveis**

Pergunte-se:
- ✅ Esse layout pode ser usado para diferentes conteúdos?
- ✅ Tem uma estrutura HTML consistente?
- ✅ Serve um propósito específico (métricas, comparação, timeline)?

Se sim → É um padrão válido!

### **3. Extraia Classes CSS**

```css
/* No CSS do template, procure por: */
.slide-split { /* ... */ }           → Pattern: split-layout
.cards-container { /* ... */ }       → Pattern: cards-grid
.comparison-grid { /* ... */ }       → Pattern: comparison
.timeline { /* ... */ }              → Pattern: timeline
.data-table { /* ... */ }            → Pattern: data-table
```

### **4. Documente `best_for` Tags**

Pense em **quando** o Claude deve recomendar este padrão:

```json
{
  "id": "metric-cards",
  "best_for": [
    "kpis",              // ✅ Tag genérica
    "key-metrics",       // ✅ Variante
    "dashboard",         // ✅ Contexto de uso
    "performance-summary" // ✅ Use-case específico
  ]
}
```

**Dicas:**
- Use 3-6 tags por padrão
- Misture tags genéricas + específicas
- Inclua sinônimos (ex: "metrics", "kpis", "numbers")

---

## 🛠️ Processo de Criação (Passo a Passo)

### **Passo 1: Crie o Arquivo JSON**

```bash
cd public/decks/templates/
touch jumper-flare-patterns.json
```

### **Passo 2: Copie o Esqueleto**

Use `koko-classic-patterns.json` como referência:

```bash
cp koko-classic-patterns.json jumper-flare-patterns.json
```

### **Passo 3: Atualize Metadados**

```json
{
  "template_id": "jumper-flare",
  "template_version": "1.0",
  "template_name": "Jumper Flare Template",
  "description": "Minimalist sophistication with strategic organic accents. Dark theme with Jumper orange (#FA4721) highlights.",
  "brand_colors": {
    "primary": "#FA4721",
    "black": "#000000",
    "white": "#FFFFFF",
    "success": "#2AA876",
    "warning": "#F59E0B",
    "critical": "#EF4444"
  },
  "patterns": []
}
```

### **Passo 4: Analise o Template HTML**

Abra `jumper-flare.html` e identifique slides distintos:

```html
<!-- Slide 1: Cover (Split Layout) -->
<div class="slide slide-split slide-split-gradient-right">

<!-- Slide 2: Section Header -->
<div class="slide">
  <span class="badge badge-info">Fase 1</span>
  <h1>Nome da Seção</h1>

<!-- Slide 3: Cards Container -->
<div class="slide">
  <div class="cards-container">

<!-- Slide 4: Comparison Grid -->
<div class="slide">
  <div class="comparison-grid">
```

### **Passo 5: Crie Patterns**

Para cada padrão identificado, crie um objeto:

```json
{
  "id": "cover-split-gradient",
  "name": "Cover Slide (Split Layout with Gradient)",
  "css_class": "slide-split slide-split-gradient-right",
  "best_for": ["cover", "title-page", "hero", "opening"],
  "content_type": "cover",
  "description": "Two-column split layout with content on left and organic gradient background on right. Creates dramatic visual impact for opening slides.",
  "when_to_use": "First slide of any presentation, major section openers requiring visual emphasis",
  "required_elements": [
    "title (h1)",
    "subtitle or period (h2/p)",
    "optional context text"
  ],
  "example": "TÍTULO DO RELATÓRIO + Período: Outubro 2024 + Cliente: Acme Corp"
}
```

### **Passo 6: Valide o JSON**

```bash
# Teste se o JSON é válido
cat jumper-flare-patterns.json | jq .
```

Se retornar erro → corrija a sintaxe.

### **Passo 7: Teste com Edge Function**

```bash
# Faça deploy do Edge Function (se mudou template)
npx supabase functions deploy j_hub_deck_analyze

# Teste criando um deck com jumper-flare template
# Veja se o Claude carrega os padrões corretamente
```

---

## ✅ Checklist de Qualidade

Antes de considerar o `-patterns.json` completo:

- [ ] **Metadados completos** (template_id, version, name, description, brand_colors)
- [ ] **Mínimo 5 padrões** documentados (mais é melhor!)
- [ ] **Cada padrão tem:**
  - [ ] ID único (kebab-case)
  - [ ] Nome descritivo
  - [ ] CSS class correspondente ao HTML
  - [ ] 3-6 tags `best_for`
  - [ ] `content_type` válido
  - [ ] Descrição visual clara
  - [ ] `when_to_use` com contexto
  - [ ] `required_elements` listados
  - [ ] Exemplo concreto de conteúdo
- [ ] **JSON válido** (sem erros de sintaxe)
- [ ] **Diversidade de categorias** (cover + narrative + metrics + charts + etc.)
- [ ] **Padrões correspondem ao HTML** (classes CSS existem no template)

---

## 🎯 Exemplo Completo: Jumper Flare

Baseado no `jumper-flare.html`, estes seriam os padrões principais:

```json
{
  "template_id": "jumper-flare",
  "template_version": "1.0",
  "template_name": "Jumper Flare Template",
  "description": "Minimalist dark theme with Jumper orange accents and organic gradients",
  "brand_colors": {
    "primary": "#FA4721",
    "black": "#000000",
    "white": "#FFFFFF",
    "success": "#2AA876",
    "warning": "#F59E0B",
    "critical": "#EF4444"
  },
  "patterns": [
    {
      "id": "cover-split-gradient-right",
      "name": "Cover Slide (Gradient Right)",
      "css_class": "slide-split slide-split-gradient-right",
      "best_for": ["cover", "title-page", "opening", "hero"],
      "content_type": "cover",
      "description": "Two-column split with content left and organic gradient background right",
      "when_to_use": "First slide of presentation for dramatic visual impact",
      "required_elements": ["title", "subtitle", "period"],
      "example": "RELATÓRIO DE PERFORMANCE + Período: Out/2024 + Cliente XYZ"
    },
    {
      "id": "section-header",
      "name": "Section Header",
      "css_class": "slide",
      "best_for": ["section-break", "chapter-title", "phase-intro"],
      "content_type": "divider",
      "description": "Centered layout with badge, title, and subtitle for section introductions",
      "when_to_use": "Start of major sections or phases in the presentation",
      "required_elements": ["badge", "title", "subtitle"],
      "example": "Badge: Fase 1 + DESCOBERTA + Análise inicial do mercado"
    },
    {
      "id": "cards-grid",
      "name": "Cards Grid Container",
      "css_class": "cards-container",
      "best_for": ["multiple-items", "features", "insights", "context"],
      "content_type": "grid",
      "description": "Auto-fit responsive grid (3-4 columns) of cards with hover effects",
      "when_to_use": "Presenting 3-6 related items with titles and descriptions",
      "required_elements": ["card-title", "card-content"],
      "example": "Contexto 1 | Contexto 2 | Contexto 3 (each in separate card)"
    },
    {
      "id": "comparison-grid",
      "name": "Comparison Grid (Before/After)",
      "css_class": "comparison-grid",
      "best_for": ["before-after", "problem-solution", "a-b-comparison"],
      "content_type": "comparison",
      "description": "Two-column side-by-side comparison with stats and labels",
      "when_to_use": "Showing improvements, validations, or comparing two scenarios",
      "required_elements": ["comparison-title", "stat", "label"],
      "example": "Antes: CPA R$ 50 | Depois: CPA R$ 20 (-60%)"
    },
    {
      "id": "timeline",
      "name": "Timeline (Temporal Evolution)",
      "css_class": "timeline",
      "best_for": ["evolution", "progression", "weekly-data", "phases"],
      "content_type": "timeline",
      "description": "Horizontal timeline with 3-5 data points showing evolution",
      "when_to_use": "Time-series data, week-over-week changes, growth curves",
      "required_elements": ["date", "value", "sub-label"],
      "example": "Semana 1: 50 | Semana 2: 75 (+50%) | Semana 3: 125 (+150%)"
    },
    {
      "id": "data-table",
      "name": "Data Table (Structured Comparison)",
      "css_class": "data-table",
      "best_for": ["channel-comparison", "detailed-metrics", "benchmarks"],
      "content_type": "data",
      "description": "Table with animated rows showing structured data comparison",
      "when_to_use": "Comparing metrics across channels, campaigns, or periods",
      "required_elements": ["table-headers", "table-rows", "metric-values"],
      "example": "Google Ads: R$ 10 CPA | Meta Ads: R$ 20 | TikTok: R$ 50"
    },
    {
      "id": "checklist",
      "name": "Checklist (Actions Completed)",
      "css_class": "checklist",
      "best_for": ["completed-actions", "requirements", "steps-done"],
      "content_type": "narrative",
      "description": "List with checkmark icons and descriptions of completed items",
      "when_to_use": "Showing accomplished tasks, delivered features, completed phases",
      "required_elements": ["checklist-item", "icon", "text"],
      "example": "✓ Campanha otimizada | ✓ Budget realocado | ✓ Criativos renovados"
    },
    {
      "id": "big-number",
      "name": "Big Number (Hero Metric)",
      "css_class": "big-number",
      "best_for": ["hero-metric", "main-result", "key-achievement"],
      "content_type": "statement",
      "description": "Large highlighted number with context and badge",
      "when_to_use": "Emphasizing the single most important metric or achievement",
      "required_elements": ["big-number", "label", "context"],
      "example": "750 + Conversões Alcançadas + +150% vs período anterior"
    },
    {
      "id": "closing-split-gradient-left",
      "name": "Closing Slide (Gradient Left)",
      "css_class": "slide-split slide-split-gradient-left",
      "best_for": ["closing", "next-steps", "call-to-action", "summary"],
      "content_type": "conclusion",
      "description": "Two-column split with gradient left and content/CTA right",
      "when_to_use": "Last slide with next steps, action items, or call-to-action",
      "required_elements": ["title", "action-list", "cta-button"],
      "example": "PRÓXIMOS PASSOS + Lista de ações + CTA: Agendar Reunião"
    }
  ]
}
```

---

## 🚀 Próximos Passos

Após criar `jumper-flare-patterns.json`:

1. **Commit no Git:**
   ```bash
   git add public/decks/templates/jumper-flare-patterns.json
   git commit -m "feat: Add pattern catalog for Jumper Flare template"
   ```

2. **Teste a Geração de Deck:**
   - Crie um novo deck via UI
   - Escolha `jumper-flare` como template
   - Veja se o Claude recomenda os padrões corretos

3. **Itere e Melhore:**
   - Se o Claude não escolhe bons padrões → ajuste `best_for` tags
   - Se faltam padrões → adicione mais ao JSON
   - Se padrões confusos → melhore `description` e `when_to_use`

---

## 📚 Referências

- **Exemplo Completo:** `koko-classic-patterns.json` (17 padrões documentados)
- **Template HTML:** `jumper-flare.html` (9 slides de exemplo)
- **Edge Function:** `supabase/functions/j_hub_deck_analyze/index.ts` (usa os padrões)
- **Utility:** `supabase/functions/_shared/template-utils.ts` (loadPatternMetadata)

---

**Criado:** 2024-11-12
**Autor:** Claude Code Assistant
**Versão:** 1.0
