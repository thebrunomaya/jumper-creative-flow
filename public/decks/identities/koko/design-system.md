# Koko - Design System for Presentation Decks

**Version:** 2.0.0
**Last Updated:** 2025-01-11
**Focus:** Marketing & Analytics Presentations

---

## 🎯 Brand Philosophy

### Core Principle
> **"Bold simplicity with graphic intensity"**

Koko presentations embrace **raw visual impact** through stark contrasts and iconic graphic elements. We don't whisper—we make statements through bold typography, high-contrast design, and unmistakable brand signatures.

### Golden Rule
> **"70% Black & White. 20% Yellow highlights. 10% accents."**

**Visual Distribution:**
- **70% Black & White** - Strong contrast, maximum readability, foundational palette
- **20% Yellow Accents** - Strategic highlights, key metrics, CTAs, success indicators
- **10% Pink/Blue/Gray** - Subtle elements, borders, secondary information

**Why?** High contrast creates immediate visual hierarchy. When yellow appears on black/white, it demands attention and signals importance.

---

## 🎨 Color System

### Brand Colors (HSL Format)

```css
:root {
    /* Primary - Foundational */
    --koko-black: 0 0% 0%;          /* #000000 */
    --koko-white: 0 0% 100%;        /* #FFFFFF */

    /* Accent - Primary Highlight */
    --koko-yellow: 43 86% 60%;      /* #E5C94F */

    /* Accent - Secondary */
    --koko-pink: 330 100% 50%;      /* #FF0080 */
    --koko-blue: 238 70% 39%;       /* #2F3696 */

    /* Neutral - Subtle Elements */
    --koko-gray: 180 1% 74%;        /* #BDBEBE */
    --koko-gray-dark: 0 0% 40%;     /* #666666 */
}
```

**For Tailwind/HSL:**
```js
// tailwind.config.js
colors: {
  'koko-black': 'hsl(var(--koko-black))',
  'koko-white': 'hsl(var(--koko-white))',
  'koko-yellow': 'hsl(var(--koko-yellow))',
  'koko-pink': 'hsl(var(--koko-pink))',
  // ...
}
```

### Color Usage Guidelines

| Color | Usage | Ratio | Examples |
|-------|-------|-------|----------|
| **Black** | All text, borders, graphic elements, marquees | 40% | Headings, body text, card borders |
| **White** | Slide backgrounds, negative space | 30% | Default background, card backgrounds |
| **Yellow** | Highlights, success metrics, CTAs, emphasis | 20% | Key numbers, winner cards, insight boxes |
| **Pink** | Alerts, failures, dynamic accents | 5% | Failed campaigns, warning indicators |
| **Blue** | Alternative accent (rare) | 3% | Secondary information |
| **Gray** | Subtle borders, secondary text | 2% | Dividers, captions, borders |

**Contrast Ratios (WCAG Compliance):**
- Black on White: 21:1 (AAA)
- Black on Yellow: 10:1 (AAA for large text)
- White on Black: 21:1 (AAA)
- Yellow text on Black: 14.8:1 (AAA)
- Pink text on Black: 5.6:1 (AA)

---

## ✍️ Typography System

### Font Families

**1. Alternate Gothic Condensed ATF** (Primary - Display)

```css
/* Black (900) - Hero Titles */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Black.otf') format('opentype');
    font-weight: 900;
    font-display: swap;
}

/* Bold (700) - Section Titles */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Bold.otf') format('opentype');
    font-weight: 700;
    font-display: swap;
}

/* Book (400) - Body Display */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Book.otf') format('opentype');
    font-weight: 400;
    font-display: swap;
}
```

**2. Playfair Display** (Secondary - Editorial)

```css
/* Bold (700) - Emphasis */
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Bold.ttf') format('truetype');
    font-weight: 700;
    font-display: swap;
}

/* Regular (400) - Body Text */
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Regular.ttf') format('truetype');
    font-weight: 400;
    font-display: swap;
}
```

**3. Glarious** (Decorative - Rare Use)

```css
@font-face {
    font-family: 'Glarious';
    src: url('https://hub.jumper.studio/decks/identities/koko/fonts/Glarious.otf') format('opentype');
    font-weight: 400;
    font-display: swap;
}
```

### Typographic Scale for Presentations

| Element | Font | Size | Weight | Line Height | Use Case |
|---------|------|------|--------|-------------|----------|
| **Hero Title** | Alternate Gothic | `120px` | 900 (Black) | 0.85 | Cover slides, main statements |
| **Section Title** | Alternate Gothic | `72px` (text-7xl) | 900 (Black) | 0.9 | Slide headings |
| **Section Title Dense** | Alternate Gothic | `48px` (text-5xl) | 900 (Black) | 0.9 | Dense content slides |
| **Subtitle** | Playfair Display | `24px` (text-2xl) | 400-700 (Italic) | 1.3 | Supporting text, context |
| **Card Title** | Alternate Gothic | `20px` (text-xl) | 700 (Bold) | 1.2 | Card headers, metrics |
| **Body Text** | Playfair Display | `16px` (text-base) | 400 | 1.6 | Paragraphs, descriptions |
| **Detail Text** | Playfair Display | `14px` (text-sm) | 400 | 1.5 | Lists, captions, footnotes |
| **Data Labels** | Alternate Gothic | `24px` (text-2xl) | 900 (Black) | 1.0 | Numbers, metrics |

### Typography Pairing Rules

**Headings → Alternate Gothic**
- Condensed, impactful
- Always uppercase
- Negative letter-spacing (-0.02em) for hero titles

**Body & Lists → Playfair Display**
- Readable, elegant
- Normal case
- Generous line-height (1.5-1.6)

**Data & Metrics → Alternate Gothic**
- Bold, direct
- Large sizes for impact
- Tight line-height (1.0)

**Captions → Playfair Display**
- Subtle, refined
- Smaller sizes
- Light weight (400)

---

## 📐 Spacing System

### Container Padding

```css
/* Standard slides */
.slide-content {
    padding: 0 24px; /* px-6 */
}

/* Wide slides */
.slide-content-wide {
    padding: 0 32px; /* px-8 */
}

/* Compact slides (data-heavy) */
.slide-content-compact {
    padding: 0 16px; /* px-4 */
}
```

### Vertical Rhythm

```css
/* Header margin-bottom */
.header-standard {
    margin-bottom: 24px; /* mb-6 */
}

.header-dense {
    margin-bottom: 16px; /* mb-4 */
}

/* Section gaps */
.gap-dense {
    gap: 16px; /* gap-4 */
}

.gap-standard {
    gap: 24px; /* gap-6 */
}

.gap-spacious {
    gap: 32px; /* gap-8 */
}

/* Card padding */
.card-compact {
    padding: 16px; /* p-4 */
}

.card-standard {
    padding: 24px; /* p-6 */
}
```

### Safe Zones

**Critical Spacing:**
```
Top:    48px (marquee) + 64px (logo) = 112px from top
Bottom: 48px (marquee) + 96px (nav) = 144px from bottom
Left:   32px minimum
Right:  32px minimum
```

**Content Boundaries:**
- Maximum content width: `1280px` (max-w-7xl)
- Hero sections: Full viewport width
- Text columns: `672px` per column (max-w-2xl)

---

## 🎨 Component Library

### 1. Cards with Cut Corners

**Standard Card:**
```html
<div class="border-2 border-black bg-white p-6 relative">
    <h3 class="text-xl font-bold mb-3 font-alternate">Card Title</h3>
    <p class="text-sm leading-relaxed font-playfair">
        Card content...
    </p>
    <!-- Cut corner accent (32px) -->
    <div class="absolute bottom-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 translate-y-4"></div>
</div>
```

**Highlighted Card (Yellow):**
```html
<div class="bg-koko-yellow border-4 border-black p-6 relative">
    <h3 class="text-xl font-bold mb-3 font-alternate">🥇 WINNER</h3>
    <p class="text-sm leading-tight font-playfair">
        Bullet points...
    </p>
    <div class="absolute bottom-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 translate-y-4"></div>
</div>
```

**Inverted Card (Black):**
```html
<div class="bg-black text-white p-6 relative">
    <h3 class="text-xl font-bold mb-3 font-alternate">Card Title</h3>
    <p class="text-sm leading-relaxed font-playfair">
        Card content...
    </p>
    <!-- White cut corner on black card -->
    <div class="absolute bottom-0 right-0 w-8 h-8 bg-white transform rotate-45 translate-x-4 translate-y-4"></div>
</div>
```

**Cut Corner Variations:**
- **Small**: 24px (`w-6 h-6`, translate 3px) - Compact cards
- **Standard**: 32px (`w-8 h-8`, translate 4px) - Default cards
- **Large**: 48px (`w-12 h-12`, translate 6px) - Hero cards

**Border Weights:**
- **Standard cards**: 2px (`border-2`)
- **Highlighted cards**: 4px (`border-4`)
- **Subtle cards**: 1px (`border`)

---

### 2. Data List Component

**Two-Column Data Display:**
```html
<div class="grid grid-cols-2 gap-8">
    <!-- Left Column: List Data -->
    <div>
        <div class="flex justify-between items-baseline border-b border-black/20 pb-2 mb-2">
            <span class="font-playfair text-sm">Week 1</span>
            <div class="flex gap-2 items-baseline">
                <span class="font-alternate text-xl font-bold">$2.03</span>
                <span class="font-playfair text-xs text-black/70">[baseline]</span>
            </div>
        </div>
        <!-- Repeat for more rows -->
    </div>

    <!-- Right Column: Metrics Cards -->
    <div class="space-y-2">
        <div class="bg-black text-white p-3 relative">
            <div class="font-playfair text-xs uppercase tracking-wide opacity-80">Total Improvement</div>
            <div class="font-alternate text-2xl font-black">79%</div>
            <div class="absolute bottom-0 right-0 w-6 h-6 bg-white transform rotate-45 translate-x-3 translate-y-3"></div>
        </div>
        <!-- Repeat for more metrics -->
    </div>
</div>
```

---

### 3. Comparison Cards (Vertical Stack)

```html
<div class="space-y-4">
    <!-- Winner Card -->
    <div class="bg-koko-yellow border-4 border-black p-4 relative">
        <h3 class="text-xl font-bold mb-3 font-alternate">🥇 DISPLAY EVC (WINNER)</h3>
        <ul class="text-sm leading-tight font-playfair space-y-1">
            <li>• Cost/Conversion: $0.35</li>
            <li>• Volume Share: 56% (826 conversions)</li>
            <li>• CPC: $0.02 (ultra-low)</li>
        </ul>
        <div class="absolute bottom-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 translate-y-4"></div>
    </div>

    <!-- Standard Card -->
    <div class="border-2 border-black bg-white p-4 relative">
        <h3 class="text-xl font-bold mb-3 font-alternate">🥈 SEARCH EVC (STRONG)</h3>
        <ul class="text-sm leading-tight font-playfair space-y-1">
            <li>• Cost/Conversion: $0.50</li>
            <li>• Volume Share: 44% (651 conversions)</li>
        </ul>
        <div class="absolute bottom-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 translate-y-4"></div>
    </div>

    <!-- Failed Card -->
    <div class="border-2 border-black bg-white p-4 relative">
        <h3 class="text-xl font-bold mb-3 font-alternate text-koko-pink">❌ EH CAMPAIGNS (FAILED)</h3>
        <ul class="text-sm leading-tight font-playfair space-y-1">
            <li>• Cost/Conversion: $7.47</li>
            <li>• 8.6x worse than account average</li>
        </ul>
        <div class="absolute bottom-0 right-0 w-8 h-8 bg-black transform rotate-45 translate-x-4 translate-y-4"></div>
    </div>
</div>
```

**Spacing:**
- Vertical gap: `space-y-4` (16px) for dense content
- Vertical gap: `space-y-6` (24px) for standard content
- Card padding: `p-4` (16px) compact, `p-6` (24px) standard

---

### 4. Highlight Boxes

**Yellow Emphasis Box:**
```html
<div class="p-3 bg-koko-yellow">
    <p class="font-alternate text-base font-bold">
        KEY INSIGHT: Quiz CTA outperformed direct action 8.2:1
    </p>
</div>
```

**Black Emphasis Box:**
```html
<div class="p-3 bg-black text-white">
    <p class="font-playfair text-base">
        BOTTOM LINE: Data validates channel viability. Continuation depends on backend metrics and organizational readiness.
    </p>
</div>
```

---

## 🖼️ Slide Layout Patterns

### 1. Hero / Cover Slide

**Structure:**
```html
<div class="slide hero relative w-full h-full">
    <!-- Background Pattern (full bleed) -->
    <div class="absolute inset-0 z-0" style="
        background-image: url('https://hub.jumper.studio/decks/identities/koko/elements/fundo da capa.png');
        background-size: cover;
        background-position: center;
    "></div>

    <!-- Gorilla Hands - Diagonal Composition -->
    <img
        src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela direita.png"
        class="absolute w-[43vw] max-w-[540px] z-10"
        style="left: -5%; top: -5%; transform: rotate(15deg);">

    <img
        src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela esquerda.png"
        class="absolute w-[43vw] max-w-[540px] z-10"
        style="right: -5%; bottom: -5%; transform: rotate(315deg);">

    <!-- Main Title - Centered -->
    <div class="absolute inset-0 flex flex-col items-center justify-center z-20">
        <h1 class="text-[120px] leading-none font-black font-alternate text-center">
            GOOGLE ADS<br>VIABILITY TEST
        </h1>
    </div>

    <!-- Bottom Left Text -->
    <div class="absolute bottom-24 left-8 text-left z-20 max-w-2xl">
        <p class="font-playfair text-3xl mb-2 font-bold italic">A Tu Lado - LATAM Markets</p>
        <p class="font-playfair text-base">Test Period: September 22 - October 30, 2025</p>
    </div>
</div>
```

**Key Elements:**
- Pattern background (full bleed, z-0)
- Diagonal gorilla hands (left top, right bottom, z-10)
- Centered hero text (120px, z-20)
- Bottom-left metadata (client, date, z-20)

---

### 2. Content Slide (Standard)

**Structure:**
```html
<div class="slide content w-full max-w-7xl relative px-6">
    <!-- Header -->
    <div class="mb-6 relative z-10">
        <h2 class="text-7xl font-black mb-4 font-alternate">THE WINNING FORMULA</h2>
        <p class="text-xl font-playfair italic text-black/80">Performance Hierarchy</p>
    </div>

    <!-- Content Grid (2 columns) -->
    <div class="grid grid-cols-1 gap-4 relative z-10">
        <!-- Cards with cut corners -->
        <div class="bg-koko-yellow border-4 border-black p-4 relative">
            <!-- Winner card content -->
        </div>
        <div class="border-2 border-black bg-white p-4 relative">
            <!-- Standard card content -->
        </div>
    </div>

    <!-- Bottom Emphasis Box -->
    <div class="p-3 bg-koko-yellow mt-4">
        <p class="font-alternate text-base font-bold">
            KEY INSIGHT: Quiz CTA outperformed direct action 8.2:1
        </p>
    </div>
</div>
```

**Layout Options:**
- `grid-cols-2` for balanced content
- `grid-cols-1` for dense/long content (constraints)
- `grid-cols-3` for metrics-heavy slides (rare)

---

### 3. Data-Heavy Slide

**Structure:**
```html
<div class="slide data w-full max-w-7xl relative px-6">
    <!-- Smaller Header for Dense Content -->
    <div class="mb-4 relative z-10">
        <h2 class="text-5xl font-black mb-4 font-alternate">WEEKLY EVOLUTION</h2>
        <p class="text-xl font-playfair italic text-black/80 mb-6">Performance Trajectory</p>
    </div>

    <!-- Two-Column Data -->
    <div class="grid grid-cols-2 gap-8">
        <div>
            <!-- Data list with border-bottom separators -->
            <h3 class="text-2xl font-bold font-alternate mb-4">COST PER CONVERSION</h3>
            <div class="flex justify-between border-b border-black/20 pb-2 mb-2">
                <span class="font-playfair text-sm">Week 1 (Sep 22-Oct 1):</span>
                <span class="font-alternate text-xl font-bold">$2.03</span>
            </div>
            <!-- Repeat for more weeks -->
        </div>
        <div>
            <!-- Metric cards stacked -->
            <div class="bg-black text-white p-3 relative mb-2">
                <div class="font-playfair text-xs uppercase tracking-wide opacity-80">TOTAL IMPROVEMENT</div>
                <div class="font-alternate text-2xl font-black">79%</div>
                <div class="absolute bottom-0 right-0 w-6 h-6 bg-white transform rotate-45 translate-x-3 translate-y-3"></div>
            </div>
        </div>
    </div>
</div>
```

**Optimizations for Dense Content:**
- Title: `text-5xl` (48px) instead of `text-7xl` (72px)
- Font size: `text-sm` (14px) for body
- Padding: `p-3` or `p-4` instead of `p-6`
- Gap: `gap-4` instead of `gap-6`
- Line height: `leading-tight` instead of `leading-relaxed`

---

### 4. Text Columns (Appendix/Methodology)

**Structure:**
```html
<div class="slide appendix w-full max-w-7xl relative px-8">
    <div class="mb-6 relative z-10">
        <h2 class="text-5xl font-black mb-4 font-alternate">APPENDIX</h2>
        <p class="text-xl font-playfair italic text-black/80 mb-6">Methodology</p>
    </div>

    <div class="grid grid-cols-2 gap-8 relative z-10">
        <div>
            <h3 class="font-alternate text-base font-bold mb-2 uppercase">CONVERSION TRACKING</h3>
            <p class="text-sm leading-tight text-black/90 font-playfair">
                Primary: Quiz completions<br>
                Secondary: Doctor search requests<br>
                Platform: Google Ads conversion tracking<br>
                Attribution: Last-click, 30-day window
            </p>
        </div>
        <div>
            <h3 class="font-alternate text-base font-bold mb-2 uppercase">CURRENCY</h3>
            <p class="text-sm leading-tight text-black/90 font-playfair">
                All values presented in USD<br>
                Original exports may show BRL denomination<br>
                Values represent USD equivalents
            </p>
        </div>
    </div>
</div>
```

---

## 🎬 Marquee System

**Top & Bottom Marquees** (Continuous Brand Presence)

**HTML Structure:**
```html
<!-- Top Marquee -->
<div class="absolute top-0 left-0 right-0 h-12 bg-black overflow-hidden z-30">
    <div class="animate-marquee whitespace-nowrap flex items-center h-full">
        <span class="text-white text-xs font-medium mx-16 font-alternate uppercase">
            GOOGLE ADS • VIABILITY TEST • A TU LADO • LATAM MARKETS •
        </span>
        <!-- Repeat 20x for infinite scroll -->
    </div>
</div>

<!-- Bottom Marquee (similar structure) -->
<div class="absolute bottom-0 left-0 right-0 h-12 bg-black overflow-hidden z-30">
    <div class="animate-marquee whitespace-nowrap flex items-center h-full">
        <span class="text-white text-xs font-medium mx-16 font-alternate uppercase">
            SEPTEMBER 2025 • JUMPER STUDIO • TRAFFIC MANAGEMENT TEAM •
        </span>
        <!-- Repeat 20x for infinite scroll -->
    </div>
</div>
```

**CSS Animation:**
```css
@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.animate-marquee {
    animation: marquee 30s linear infinite;
}

/* Pause on hover (accessibility) */
.marquee-container:hover .animate-marquee {
    animation-play-state: paused;
}
```

**Usage Guidelines:**
- **Height**: Fixed 48px (`h-12`)
- **Background**: Always black (`bg-black`)
- **Text**: Always white (`text-white`)
- **Font**: Alternate Gothic, `text-xs`, `font-medium`, `uppercase`
- **Spacing**: 64px between repeated texts (`mx-16`)

**Content Strategy:**
- **Top**: Project title + client + key context
- **Bottom**: Timeline + team name + supplementary info
- **Alternating messages** for visual rhythm

---

## 🖼️ Graphic Elements & Patterns

### Logo System

**Available Assets:**
- `Logo_Preferencial_Koko_Branco.png` - White logo (dark backgrounds)
- `Logo_Preferencial_Koko_Preto.png` - Black logo (light backgrounds)
- `Símbolo_Branco.png` - White symbol only
- `Símbolo_Preto.png` - Black symbol only

**Standard Placement:**
```html
<!-- Top-left placement (standard) -->
<div class="absolute top-16 left-8 z-20">
    <img
        src="https://hub.jumper.studio/decks/identities/koko/logos/Logo_Preferencial_Koko_Preto.png"
        alt="Koko Logo"
        class="h-12 mix-blend-multiply">
</div>
```

**Usage Guidelines:**
- **Cover slides**: Left placement (creates asymmetry)
- **Content slides**: Top-left corner (consistent branding)
- **Closing slides**: Center or bottom (reinforcement)
- **Default variant**: Black logo on white backgrounds
- **Minimum size**: 40px height (mobile), 48px (desktop)
- **Mix-blend-multiply**: For seamless integration on white

---

### Decorative Elements

**1. Gorilla Hand Motifs** (Brand Signature)

Available:
- `Gorila mao pela direita.png` - Right hand
- `Gorila mao pela esquerda.png` - Left hand

**Usage Pattern (Hero Slide):**
```html
<!-- Left hand from top-left diagonal -->
<img
    src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela direita.png"
    class="absolute w-[43vw] max-w-[540px]"
    style="left: -5%; top: -5%; transform: rotate(15deg);">

<!-- Right hand from bottom-right diagonal (mirrored) -->
<img
    src="https://hub.jumper.studio/decks/identities/koko/elements/Gorila mao pela esquerda.png"
    class="absolute w-[43vw] max-w-[540px]"
    style="right: -5%; bottom: -5%; transform: rotate(315deg);">
```

**2. Pattern Backgrounds**

Available:
- `fundo da capa.png` - Full-slide hero background
- `fundo de xadrez.png` - Checkerboard pattern

**Application:**
```css
.pattern-background {
    background-image: url('https://hub.jumper.studio/decks/identities/koko/elements/fundo da capa.png');
    background-size: cover;
    background-position: center;
}
```

**3. Accent Graphics**

Available:
- `Coração.png` - Heart (emotional moments)
- `explosao rosa.png` - Pink splash (dynamic accents)
- `Boca.png` - Mouth halftone
- `computador.png` - Computer halftone

---

### Koko Dust Textures

**Available:**
- `Koko Dust 1.jpg`
- `Koko Dust 2.jpg`
- `Koko Dust 3.jpg`

**Application (Subtle Background):**
```css
.slide::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('https://hub.jumper.studio/decks/identities/koko/gradients/Koko Dust 1.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.15; /* Subtle texture */
    pointer-events: none;
    z-index: 0;
}

.slide__content {
    position: relative;
    z-index: 1;
}
```

---

## 🎭 Animation & Transitions

### Slide Transitions

**Implementation:**
```css
.slide {
    position: absolute;
    inset: 0;
    transition: all 700ms ease-out;
}

.slide.active {
    opacity: 1;
    transform: translateX(0);
}

.slide.prev {
    opacity: 0;
    transform: translateX(-100%);
}

.slide.next {
    opacity: 0;
    transform: translateX(100%);
}
```

**Settings:**
- Duration: `700ms` (smooth but not slow)
- Easing: `ease-out` (natural deceleration)
- Transform: Horizontal slide (`translateX`)
- Opacity: Fade in/out

---

### Animation Tokens

```css
:root {
    /* Durations */
    --duration-fast: 300ms;
    --duration-normal: 500ms;
    --duration-slow: 700ms;

    /* Easing */
    --ease-punch: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce */
    --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);         /* Smooth */

    /* Stagger intervals */
    --stagger-tight: 100ms;
    --stagger-normal: 150ms;
    --stagger-loose: 200ms;
}
```

**Accessibility:**
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 🔢 Z-Index Hierarchy

**Layering System:**
```css
:root {
    --z-background: 0;    /* Background patterns, textures */
    --z-content: 10;      /* Main content (text, cards, graphics) */
    --z-navigation: 20;   /* Navigation elements (dots, arrows, logo) */
    --z-marquee: 30;      /* Marquees (always on top) */
    --z-overlay: 40;      /* Modals, overlays (if any) */
}
```

**Application:**
```css
.slide-background {
    z-index: var(--z-background);
}

.slide-content {
    z-index: var(--z-content);
}

.logo, .nav-dots {
    z-index: var(--z-navigation);
}

.marquee {
    z-index: var(--z-marquee);
}
```

---

## ✅ Design Checklist

**Before Publishing a Deck:**

### Brand Consistency
- [ ] Koko logo present on all slides (except hero)
- [ ] Consistent logo placement (top-left, 48px height)
- [ ] Marquees on all slides (top & bottom)
- [ ] Gorilla hands on hero slide only

### Typography
- [ ] Alternate Gothic for all headings
- [ ] Playfair Display for all body text
- [ ] Font sizes match typographic scale
- [ ] No body text smaller than 14px (text-sm)

### Color Usage
- [ ] Black text on white backgrounds (primary)
- [ ] Yellow highlights only for key metrics/CTAs
- [ ] Cut corners on all cards
- [ ] Consistent border weights (2px standard, 4px highlight)

### Layout
- [ ] Content within safe zones (avoid marquee overlap)
- [ ] Consistent padding (px-6 standard)
- [ ] Consistent grid gaps (gap-4 or gap-6)
- [ ] Max width: 7xl (1280px) for content containers

### Spacing
- [ ] Header mb-6 (standard) or mb-4 (dense)
- [ ] Card padding: p-4 (compact) or p-6 (standard)
- [ ] Bottom emphasis boxes present on key slides
- [ ] Navigation dots visible and functional

### Content
- [ ] Slide counter visible (bottom-right)
- [ ] Navigation arrows functional
- [ ] Keyboard navigation enabled (arrow keys)
- [ ] All data accurate and formatted consistently

### Accessibility
- [ ] WCAG AA contrast ratios met (4.5:1 minimum)
- [ ] Alt text for decorative images (aria-hidden="true")
- [ ] Focus indicators visible
- [ ] Marquee pauses on hover

---

## 🚀 Quick Start Templates

### Hero Slide
```
- Background: fundo da capa.png
- Gorilla hands: diagonal placement (left top, right bottom)
- Title: 120px, Alternate Gothic Black
- Logo: top-left, 48px height
- Marquees: top & bottom
```

### Content Slide
```
- Title: text-7xl (72px), Alternate Gothic Black
- Subtitle: text-xl (24px), Playfair Italic
- Cards: 2-column grid, cut corners
- Bottom box: Yellow or black emphasis
```

### Data Slide
```
- Title: text-5xl (48px) - smaller for dense content
- Layout: 2-column (list left, metrics right)
- Font size: text-sm (14px) for lists
- Padding: p-3 or p-4 (compact)
```

---

## 📋 Asset Inventory

### Fonts
- `AlternateGothicCondATF-Black.otf` (900)
- `AlternateGothicCondATF-Bold.otf` (700)
- `AlternateGothicCondATF-Book.otf` (400)
- `PlayfairDisplay-Bold.ttf` (700)
- `PlayfairDisplay-Regular.ttf` (400)
- `Glarious.otf` (400)

Base URL: `https://hub.jumper.studio/decks/identities/koko/fonts/`

### Logos
- `Logo_Preferencial_Koko_Branco.png` (white, dark backgrounds)
- `Logo_Preferencial_Koko_Preto.png` (black, light backgrounds)
- `Símbolo_Branco.png` (white symbol)
- `Símbolo_Preto.png` (black symbol)

Base URL: `https://hub.jumper.studio/decks/identities/koko/logos/`

### Graphics
- `fundo da capa.png` (hero background pattern)
- `fundo de xadrez.png` (checkerboard pattern)
- `Gorila mao pela direita.png` (right hand)
- `Gorila mao pela esquerda.png` (left hand)
- `Coração.png` (heart)
- `explosao rosa.png` (pink splash)
- `Boca.png` (mouth halftone)
- `computador.png` (computer halftone)

Base URL: `https://hub.jumper.studio/decks/identities/koko/elements/`

### Textures
- `Koko Dust 1.jpg` (texture background)
- `Koko Dust 2.jpg` (texture background)
- `Koko Dust 3.jpg` (texture background)

Base URL: `https://hub.jumper.studio/decks/identities/koko/gradients/`

---

## 🔗 Additional Resources

**See Also:**
- [koko-classic.html](../templates/koko-classic.html) - Reference template implementation
- [koko-rebel.html](../templates/koko-rebel.html) - Alternative template

**For questions or additions:**
Contact the Koko design team or Jumper Creative Flow development team.

---

**End of Design System v2.0.0**

**Changelog:**
- **v2.0.0 (2025-01-11)**: Complete rewrite with Lovable improvements, HSL color format, component library, slide layout patterns, spacing system, z-index hierarchy, animation guidelines, design checklist
- **v1.0.0 (2025-01-11)**: Initial version with basic color/typography/assets
