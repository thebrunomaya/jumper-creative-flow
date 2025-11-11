# Koko Design System

## Overview

Design system ousado e rebelde da Agência Koko. Visual punk-streetwear com elementos gráficos característicos (gorila, explosões, xadrez). Contraste forte entre preto e branco com toques vibrantes de amarelo e rosa.

---

## Typography

### Font Stack

**Primary (Display/Headlines):**
```css
font-family: 'AlternateGothicCondATF', 'Arial Black', 'Impact', sans-serif;
```

**Secondary (Serif/Editorial):**
```css
font-family: 'PlayfairDisplay', 'Georgia', 'Times New Roman', serif;
```

**Decorative:**
```css
font-family: 'Glarious', cursive;
```

### Font Loading

```css
/* Display Font - AlternateGothicCondATF */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Black.otf') format('opentype');
    font-weight: 900;
}
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Bold.otf') format('opentype');
    font-weight: 700;
}
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Book.otf') format('opentype');
    font-weight: 400;
}

/* Serif Font - PlayfairDisplay */
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Bold.ttf') format('truetype');
    font-weight: 700;
}
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Regular.ttf') format('truetype');
    font-weight: 400;
}

/* Decorative Font */
@font-face {
    font-family: 'Glarious';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/Glarious.otf') format('opentype');
    font-weight: 400;
}
```

### Type Scale

```css
/* Headlines (AlternateGothicCondATF) */
--heading-hero: clamp(4rem, 10vw, 8rem);     /* 64px - 128px */
--heading-1: clamp(3rem, 7vw, 6rem);         /* 48px - 96px */
--heading-2: clamp(2.5rem, 5vw, 4.5rem);     /* 40px - 72px */
--heading-3: clamp(2rem, 4vw, 3.5rem);       /* 32px - 56px */
--heading-4: clamp(1.5rem, 3vw, 2.5rem);     /* 24px - 40px */

/* Body Text (AlternateGothicCondATF or PlayfairDisplay) */
--body-large: clamp(1.25rem, 2vw, 1.75rem);  /* 20px - 28px */
--body-regular: clamp(1rem, 1.5vw, 1.25rem); /* 16px - 20px */
--body-small: clamp(0.875rem, 1.2vw, 1rem);  /* 14px - 16px */
--caption: clamp(0.75rem, 1vw, 0.875rem);    /* 12px - 14px */
```

### Font Weights

- **Thin:** 100
- **Light:** 300
- **Book:** 400 (Regular)
- **Medium:** 500
- **Demi:** 600
- **Bold:** 700
- **Heavy:** 800
- **Black:** 900

---

## Colors

### Brand Colors

```css
:root {
    /* Primary */
    --koko-black: #000000;
    --koko-white: #FFFFFF;

    /* Accent */
    --koko-yellow: #F2C541;    /* Amarelo vibrante */
    --koko-pink: #FF0080;      /* Rosa punk */
    --koko-blue: #1E22AA;      /* Azul royal */

    /* Neutral */
    --koko-gray: #BBBCBC;      /* Cinza claro */
    --koko-gray-dark: #666666; /* Cinza escuro */
}
```

### Color Usage

- **Background:** Black (#000000) ou White (#FFFFFF) - contraste forte
- **Text:** White on Black, ou Black on White - sem meios-termos
- **Highlights:** Yellow (#F2C541) para CTAs e destaques primários
- **Accents:** Pink (#FF0080) para elementos ousados/rebeldes
- **Secondary:** Blue (#1E22AA) para informações secundárias
- **Borders/Dividers:** Gray (#BBBCBC)

### Color Psychology

- **Yellow:** Energia, atenção, criatividade rebelde
- **Pink:** Ousadia, juventude, anti-establishment
- **Blue:** Confiança, tecnologia, profissionalismo
- **Black:** Força, mistério, impacto visual
- **White:** Clareza, contraste, respiração

---

## Layout

### Safe Zones

- **Minimum padding:** `60px` on all sides (mais generoso que Jumper)
- **Maximum content width:** `1400px`
- **Slide aspect ratio:** 16:9 (1920x1080)
- **Pattern header/footer:** `40px` height (faixas pretas com scroll)

### Grid System

```css
/* 12-column grid */
.container {
    max-width: 1400px;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 32px;
}

/* Asymmetric layouts são permitidos */
.hero-split {
    grid-template-columns: 2fr 1fr; /* 2:1 ratio */
}
```

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1400px;
```

---

## Components

### Pattern Header/Footer

Faixas pretas com texto scrolling - característica única da Koko:

```css
.pattern-header {
    position: fixed;
    top: 0;
    width: 100%;
    height: 40px;
    background: var(--koko-black);
    color: var(--koko-yellow);
    overflow: hidden;
}

.pattern-text {
    animation: scrollLeft 40s linear infinite;
}
```

### Koko Dust Background

Textura sutil de fundo (sempre com opacidade baixa):

```html
<div class="koko-dust-bg" style="
    background-image: url('https://hub.jumper.studio/decks/identities/koko/gradients/Koko Dust 1.jpg');
    opacity: 0.15;
"></div>
```

### Checkerboard Pattern

Padrão xadrez característico:

```html
<img src="https://hub.jumper.studio/decks/identities/koko/elements/fundo de xadrez.png">
```

### Navigation

- **Keyboard shortcuts:** Arrow keys, Space
- **Touch gestures:** Swipe up/down, left/right
- **Visual navigation:** Dots ou counter sempre visíveis

### Animations

Koko usa animações mais agressivas que Jumper:

```css
/* Entrance animations */
--duration-fast: 0.3s;
--duration-normal: 0.5s;
--duration-slow: 0.8s;

/* Easing more aggressive */
--ease-punch: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);         /* Smooth */

/* Stagger intervals */
--stagger-tight: 0.1s;
--stagger-normal: 0.15s;
--stagger-loose: 0.2s;
```

---

## Assets

### Logos

**Primary Logo (White on Black):**
```html
<img src="https://hub.jumper.studio/decks/identities/koko/logos/Logo_Preferencial_Koko_Branco.png" alt="Koko">
```

**Primary Logo (Black on White):**
```html
<img src="https://hub.jumper.studio/decks/identities/koko/logos/Logo_Preferencial_Koko_Preto.png" alt="Koko">
```

**Symbol Only (White):**
```html
<img src="https://hub.jumper.studio/decks/identities/koko/logos/Símbolo_Branco.png" alt="Koko Symbol">
```

**Symbol Only (Black):**
```html
<img src="https://hub.jumper.studio/decks/identities/koko/logos/Símbolo_Preto.png" alt="Koko Symbol">
```

### Backgrounds

```html
<!-- Koko Dust Textures (use with opacity 0.1-0.2) -->
<img src="https://hub.jumper.studio/decks/identities/koko/gradients/Koko Dust 1.jpg">
<img src="https://hub.jumper.studio/decks/identities/koko/gradients/Koko Dust 2.jpg">
<img src="https://hub.jumper.studio/decks/identities/koko/gradients/Koko Dust 3.jpg">
```

### Decorative Elements

```html
<!-- Gorila (mascote) -->
<img src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela direita.png">
<img src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela esquerda.png">

<!-- Shapes -->
<img src="https://hub.jumper.studio/decks/identities/koko/elements/Coração.png">
<img src="https://hub.jumper.studio/decks/identities/koko/elements/Boca.png">
<img src="https://hub.jumper.studio/decks/identities/koko/elements/computador.png">

<!-- Effects -->
<img src="https://hub.jumper.studio/decks/identities/koko/elements/explosao rosa.png">
<img src="https://hub.jumper.studio/decks/identities/koko/elements/fundo da capa.png">
<img src="https://hub.jumper.studio/decks/identities/koko/elements/fundo de xadrez.png">
```

---

## Best Practices

### Accessibility

- **Contrast:** Black/White garantem WCAG AAA (21:1 ratio)
- **Yellow text on Black:** WCAG AAA compliant (14.8:1)
- **Pink text on Black:** WCAG AA compliant (5.6:1)
- **Semantic HTML:** Use `<h1>`, `<h2>`, `<strong>` corretamente
- **Alt text:** Obrigatório para todos elementos decorativos

### Typography Hierarchy

```css
/* Slide Title */
h1 {
    font-family: 'AlternateGothicCondATF', sans-serif;
    font-weight: 900;
    font-size: var(--heading-hero);
    text-transform: uppercase;
    letter-spacing: -0.02em;
    color: var(--koko-yellow);
}

/* Section Title */
h2 {
    font-family: 'AlternateGothicCondATF', sans-serif;
    font-weight: 700;
    font-size: var(--heading-1);
    text-transform: uppercase;
    color: var(--koko-black);
}

/* Body Text (Display) */
p.display {
    font-family: 'AlternateGothicCondATF', sans-serif;
    font-weight: 400;
    font-size: var(--body-large);
}

/* Body Text (Editorial) */
p.editorial {
    font-family: 'PlayfairDisplay', serif;
    font-weight: 400;
    font-size: var(--body-regular);
    line-height: 1.6;
}
```

### Performance

- **Optimize images:** Elements são PNG com transparência, comprimir quando possível
- **Font loading:** `font-display: swap` para evitar FOIT
- **CSS animations:** Preferir CSS over JavaScript
- **Lazy load:** Off-screen elements (decorativos)

### Mobile Responsiveness

- **Stack vertically:** Pattern header/footer mantém altura fixa
- **Reduce font sizes:** Mantém legibilidade
- **Hide decorative elements:** Simplificar em telas pequenas
- **Touch targets:** Mínimo 44x44px

---

## Design Principles

### 1. Contraste Radical

Sem meios-termos. Preto ou Branco. Contraste máximo em todas interações.

### 2. Tipografia Ousada

AlternateGothicCondATF em uppercase = impacto. Use generosamente.

### 3. Elementos Punk

Xadrez, explosões, gorila = identidade visual única. Use com propósito.

### 4. Movimento Constante

Pattern scrolling header/footer = energia perpétua.

### 5. Amarelo como Protagonista

Amarelo (#F2C541) é o CTA universal. Reserve para ações primárias.

---

## Common Patterns

### Cover Slide

```html
<div class="slide cover">
    <div class="pattern-header">
        <div class="pattern-text">KOKO • KOKO • KOKO • KOKO • KOKO • KOKO</div>
    </div>
    <div class="koko-dust-bg"></div>
    <div class="content">
        <img src=".../gorila-mao-direita.png" class="decorative-gorila">
        <h1>TÍTULO OUSADO</h1>
        <p class="subtitle">Subtítulo em PlayfairDisplay</p>
    </div>
    <div class="pattern-footer">
        <div class="pattern-text">REBEL • REBEL • REBEL • REBEL • REBEL</div>
    </div>
</div>
```

### Stats Slide

```html
<div class="slide stats">
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value" style="color: var(--koko-yellow);">89%</div>
            <div class="stat-label">CRESCIMENTO</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: var(--koko-pink);">2.5M</div>
            <div class="stat-label">IMPRESSÕES</div>
        </div>
    </div>
</div>
```

### Quote Slide

```html
<div class="slide quote" style="background: var(--koko-black);">
    <blockquote style="
        font-family: 'PlayfairDisplay', serif;
        font-size: 3rem;
        color: var(--koko-white);
        text-align: center;
    ">
        "Texto inspirador aqui"
    </blockquote>
    <cite style="color: var(--koko-yellow);">— Autor</cite>
</div>
```

---

## Koko vs Jumper

| Aspecto | Koko | Jumper |
|---------|------|--------|
| **Paleta** | Preto/Branco + Yellow/Pink | Grays + Orange |
| **Tipografia** | AlternateGothic (condensed) | Haffer (variable) |
| **Contraste** | Máximo (21:1) | Médio-Alto (4.5:1+) |
| **Estilo** | Punk, rebelde, ousado | Minimalista, sofisticado |
| **Animações** | Agressivas, bounce | Suaves, ease-out |
| **Elementos** | Gorila, explosões, xadrez | Gradientes orgânicos |
| **Header/Footer** | Pattern scrolling | Clean, sem pattern |

---

## Support

Para dúvidas sobre identidade Koko:
- Revisar template `/templates/koko-rebel.html`
- Explorar elementos em `/identities/koko/elements/`
- Seguir princípios: CONTRASTE, OUSADIA, MOVIMENTO

---

**Last Updated:** 2025-01-11
**Version:** 1.0.0
**Maintained by:** Koko Creative Team
