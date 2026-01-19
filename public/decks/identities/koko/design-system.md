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
    --koko-yellow: 45 91% 61%;      /* #F5C542 */

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
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Black.otf') format('opentype');
    font-weight: 900;
    font-display: swap;
}

/* Bold (700) - Section Titles */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Bold.otf') format('opentype');
    font-weight: 700;
    font-display: swap;
}

/* Book (400) - Body Display */
@font-face {
    font-family: 'AlternateGothicCondATF';
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/AlternateGothicCondATF-Book.otf') format('opentype');
    font-weight: 400;
    font-display: swap;
}
```

**2. Playfair Display** (Secondary - Editorial)

```css
/* Bold (700) - Emphasis */
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Bold.ttf') format('truetype');
    font-weight: 700;
    font-display: swap;
}

/* Regular (400) - Body Text */
@font-face {
    font-family: 'PlayfairDisplay';
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/PlayfairDisplay-Regular.ttf') format('truetype');
    font-weight: 400;
    font-display: swap;
}
```

**3. Glarious** (Decorative - Rare Use)

```css
@font-face {
    font-family: 'Glarious';
    src: url('https://flow.jumper.studio/decks/identities/koko/fonts/Glarious.otf') format('opentype');
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

### 1. Cards with Dog-Ear Effect (Paper Fold)

**The dog-ear effect simulates a folded paper corner in the bottom-right of cards**, creating a realistic "paper back" appearance with diagonal division.

#### Implementation Technique

The dog-ear uses two complementary CSS techniques:

1. **Clip-path on card** - Creates triangular cutout in bottom-right corner
2. **Linear-gradient on ::after pseudo-element** - Fills cutout with diagonal division

**Visual Structure:**
```
┌─────────────────────┐
│                     │
│   Card Content      │
│                     │
│                  ╱──┤ ← Triangular cutout (clip-path)
│               ╱  ┃  │
│            ╱     ┃  │   ┃ = 2px diagonal border
│         ╱        ┃  │   Upper-left = darker shade (verso)
│      ╱──────────────┤   Lower-right = background color
└─────────────────────┘
```

#### Standard Card (White)

```html
<div class="card card-default corner-cut">
    <h3 class="text-xl font-bold mb-3 font-alternate">Card Title</h3>
    <p class="text-sm leading-relaxed font-playfair">
        Card content...
    </p>
</div>
```

**CSS Implementation:**
```css
/* Card base with standardized 2px border */
.card-default {
    background: var(--koko-white);
    border: 2px solid var(--koko-black);
    padding: 18px;
    position: relative;
}

/* Clip-path creates triangular cutout (22px accounts for 2px border) */
.corner-cut {
    clip-path: polygon(
        0 0,                          /* Top-left */
        100% 0,                       /* Top-right */
        100% calc(100% - 22px),       /* Right side until cutout */
        calc(100% - 22px) 100%,       /* Diagonal cutout */
        0 100%                        /* Left side */
    );
}

/* Pseudo-element fills cutout with diagonal gradient */
.corner-cut::after {
    content: '';
    position: absolute;
    bottom: -2px;  /* Compensates for border width */
    right: -2px;   /* Compensates for border width */
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg,
        #d9d9d9 0%,      /* Verso (paper back) - gray */
        #d9d9d9 45.5%,   /* Until diagonal */
        #000 45.5%,      /* Diagonal border (2px = 9% of 22px) */
        #000 54.5%,      /* Diagonal border */
        #FFFFFF 54.5%,   /* Background color (white) */
        #FFFFFF 100%     /* Lower-right triangle */
    );
}
```

#### Highlighted Card (Yellow)

```html
<div class="card card-highlight-yellow corner-cut">
    <h3 class="text-xl font-bold mb-3 font-alternate">🥇 WINNER</h3>
    <p class="text-sm leading-tight font-playfair">
        Bullet points...
    </p>
</div>
```

**CSS:**
```css
.card-highlight-yellow {
    background: var(--koko-yellow);
    border: 2px solid var(--koko-black);  /* Standardized to 2px */
}

.card-highlight-yellow.corner-cut::after {
    background: linear-gradient(135deg,
        #c89420 0%,      /* Darkened yellow (verso) */
        #c89420 45.5%,
        #000 45.5%,      /* Black border */
        #000 54.5%,
        #FFFFFF 54.5%,   /* White background */
        #FFFFFF 100%
    );
}
```

#### Inverted Card (Black)

```html
<div class="card card-dark corner-cut">
    <h3 class="text-xl font-bold mb-3 font-alternate">Card Title</h3>
    <p class="text-sm leading-relaxed font-playfair">
        Card content...
    </p>
</div>
```

**CSS:**
```css
.card-dark {
    background: var(--koko-black);
    color: var(--koko-white);
    border: 2px solid var(--koko-white);  /* White border on dark */
}

.card-dark.corner-cut::after {
    background: linear-gradient(135deg,
        #444 0%,         /* Light gray (verso) - contrast with black */
        #444 45.5%,
        #fff 45.5%,      /* White border */
        #fff 54.5%,
        #FFFFFF 54.5%,   /* White background */
        #FFFFFF 100%
    );
}
```

#### Pink Accent Card

```html
<div class="card card-highlight-pink corner-cut">
    <h3 class="text-xl font-bold mb-3 font-alternate">ALERT</h3>
    <p class="text-sm leading-tight font-playfair">
        Important information...
    </p>
</div>
```

**CSS:**
```css
.card-highlight-pink {
    background: var(--koko-pink);
    color: var(--koko-white);
    border: 2px solid var(--koko-black);
}

.card-highlight-pink.corner-cut::after {
    background: linear-gradient(135deg,
        #cc0066 0%,      /* Darkened pink (verso) */
        #cc0066 45.5%,
        #000 45.5%,      /* Black border */
        #000 54.5%,
        #FFFFFF 54.5%,   /* White background */
        #FFFFFF 100%
    );
}
```

#### Dog-Ear Size Variations

**Standard Cards (22px dog-ear):**
- Used for: Default cards, highlighted cards, emphasis boxes
- Clip-path size: `22px`
- Gradient border: `45.5%` to `54.5%` (9% = 2px)

**Compact Cards (16px dog-ear):**
- Used for: Metric cards, small data containers
- Clip-path size: `16px`
- Gradient border: `43.75%` to `56.25%` (12.5% = 2px)

**CSS for metric cards:**
```css
.metric-card {
    background: var(--koko-black);
    color: var(--koko-white);
    padding: 14px;
    border: 2px solid var(--koko-white);
}

.metric-card.corner-cut {
    clip-path: polygon(
        0 0,
        100% 0,
        100% calc(100% - 16px),   /* Smaller cutout */
        calc(100% - 16px) 100%,
        0 100%
    );
}

.metric-card.corner-cut::after {
    bottom: -2px;
    right: -2px;
    width: 16px;   /* Smaller quadrado */
    height: 16px;
    background: linear-gradient(135deg,
        #444 0%,
        #444 43.75%,     /* 2px = 12.5% of 16px */
        #fff 43.75%,
        #fff 56.25%,
        #FFFFFF 56.25%,
        #FFFFFF 100%
    );
}
```

#### Border Standardization

**ALL cards use 2px borders consistently:**
- Standard cards: `border: 2px solid var(--koko-black)`
- Dark cards: `border: 2px solid var(--koko-white)`
- Highlighted cards: `border: 2px solid var(--koko-black)` *(changed from 4px)*
- Emphasis boxes: `border: 2px solid` *(changed from none)*
- Metric cards: `border: 2px solid var(--koko-white)` *(changed from none)*

**Why standardization matters:**
- Ensures dog-ear alignment across all card types
- Consistent visual weight throughout presentation
- Simplified gradient calculations (2px = same percentage per size)

#### Gradient Calculation Math

**For 2px diagonal border:**

1. **22px quadrado** (standard cards):
   - 2px as percentage: `(2 / 22) × 100% = 9.09%`
   - Center gradient at 50%
   - Border range: `50% - 4.5%` to `50% + 4.5%` = `45.5%` to `54.5%`

2. **16px quadrado** (metric cards):
   - 2px as percentage: `(2 / 16) × 100% = 12.5%`
   - Center gradient at 50%
   - Border range: `50% - 6.25%` to `50% + 6.25%` = `43.75%` to `56.25%`

#### Color Guidelines for "Verso" (Paper Back)

**Light cards** → Darker verso:
- White card → `#d9d9d9` (light gray)
- Yellow card → `#c89420` (darkened yellow)

**Dark cards** → Lighter verso:
- Black card → `#444` (medium gray for contrast)
- Pink card → `#cc0066` (darkened pink)

**Contrast principle:** Verso should be noticeably different from card background to create fold illusion.

#### Positioning Details

**Critical:** Pseudo-element uses negative offsets to compensate for border:

```css
.corner-cut::after {
    bottom: -2px;  /* Shifts down to cover border */
    right: -2px;   /* Shifts right to cover border */
}
```

**Why:** Card uses `border-box` sizing, but `bottom: 0` positions relative to content-box. The `-2px` offset aligns the quadrado with the clip-path cutout edge.

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
        background-image: url('https://flow.jumper.studio/decks/identities/koko/elements/hero-background.png');
        background-size: cover;
        background-position: center;
    "></div>

    <!-- Gorilla Hands - Diagonal Composition -->
    <img
        src="https://flow.jumper.studio/decks/identities/koko/elements/gorilla-hand-left.png"
        class="absolute w-[43vw] max-w-[540px] z-10"
        style="left: -5%; top: -5%;">

    <img
        src="https://flow.jumper.studio/decks/identities/koko/elements/gorilla-hand-right.png"
        class="absolute w-[43vw] max-w-[540px] z-10"
        style="right: -5%; bottom: -5%;">

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

### 5. Statement Slide (Text Left + Graphic Right)

**Purpose:** Present a statement or message with supporting visual element.

**Structure:**
```html
<div class="slide statement-slide">
    <div class="slide-content">
        <div class="statement-text">
            <h2 class="statement-title">TÍTULO</h2>
            <p class="statement-body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit...
            </p>
        </div>
        <div class="statement-graphic">
            <img src="https://flow.jumper.studio/decks/identities/koko/elements/pink-mouth.png"
                 alt="Koko graphic element">
        </div>
    </div>
</div>
```

**CSS:**
```css
.statement-slide .slide-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
}

.statement-graphic img {
    max-width: 100%;
    height: auto;
    max-height: 400px;
}
```

**Key Elements:**
- Grid 50/50: text left, graphic right
- Graphic max-height: 400px
- Centered vertical alignment

---

### 6. Statement Slide Reverse (Graphic Left + Text Right)

**Purpose:** Statement with emphasis on large graphic element (loud mouth, etc).

**Structure:**
```html
<div class="slide statement-slide-reverse">
    <div class="slide-content">
        <div class="statement-graphic">
            <img src="https://flow.jumper.studio/decks/identities/koko/elements/loud.png"
                 alt="Koko loud graphic element">
        </div>
        <div class="statement-text">
            <h2 class="statement-title">TÍTULO</h2>
            <p class="statement-subtitle">Lorem ipsum dolor sit amet...</p>
            <p class="statement-body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit...
            </p>
        </div>
    </div>
</div>
```

**CSS:**
```css
.statement-slide-reverse .slide-content {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 50% graphic, 50% text */
    gap: clamp(30px, 4vw, 60px);
    align-items: center;
    padding: 80px clamp(60px, 8vw, 140px);
}

.statement-slide-reverse .statement-graphic {
    order: -1; /* Move graphic to the left */
}

.statement-slide-reverse .statement-graphic img {
    width: 100%;
    max-height: 90vh; /* Large vertical size */
}

.statement-slide-reverse .statement-title {
    font-size: clamp(48px, 6vw, 72px);
    text-transform: uppercase;
    margin-bottom: 8px;
}

.statement-slide-reverse .statement-subtitle {
    font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 700;
    margin-bottom: 12px;
}

.statement-slide-reverse .statement-body {
    font-size: clamp(13px, 1.4vw, 16px);
    line-height: 1.5;
    margin-bottom: 8px;
}
```

**Key Elements:**
- Grid 50/50: graphic left, text right
- Graphic fills entire left column (90vh max-height)
- Tight spacing between title/subtitle/body (8-12px)
- Small body text (13-16px) for high density

---

### 7. Section Divider (Title Left + Computer Right)

**Purpose:** Chapter breaks, major section transitions with minimal design.

**Structure:**
```html
<div class="slide section-divider-slide">
    <div class="slide-content">
        <div class="section-divider-title-wrapper">
            <h2 class="section-divider-title">TÍTULO</h2>
            <p class="section-divider-subtitle">Subtítulo opcional</p>
        </div>
        <div class="section-divider-graphic">
            <img src="https://flow.jumper.studio/decks/identities/koko/elements/computer.png"
                 alt="Koko computer graphic">
        </div>
    </div>
</div>
```

**CSS:**
```css
.section-divider-slide .slide-content {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 50% title, 50% graphic */
    gap: clamp(40px, 5vw, 80px);
    align-items: center;
    padding: 80px clamp(60px, 8vw, 140px);
}

.section-divider-title {
    font-size: clamp(56px, 8vw, 112px);
    font-weight: 900;
    text-transform: uppercase;
}

.section-divider-subtitle {
    font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 700;
}

.section-divider-graphic img {
    width: 100%;
    max-height: 80vh; /* Large graphic */
}
```

**Key Elements:**
- Grid 50/50: title left, computer graphic right
- Large title (56-112px) uppercase
- Optional subtitle support
- Computer graphic fills right column (80vh max-height)
- Clean white background, no borders or patterns

---

### 8. Table of Contents (Funnel Effect)

**Purpose:** Present categories/sections with visual funnel hierarchy.

**Structure:**
```html
<div class="slide toc-slide">
    <div class="slide-content">
        <div class="toc-title-wrapper">
            <h2 class="toc-main-title">TÍTULO</h2>
        </div>
        <div class="toc-categories">
            <div class="toc-category">
                <div class="toc-category-title">DESCOBERTA</div>
                <ul class="toc-category-list">
                    <li>Formatos prioritários:</li>
                    <li>Objetivos:</li>
                </ul>
            </div>
            <div class="toc-category">
                <div class="toc-category-title">NUTRIÇÃO</div>
                <ul class="toc-category-list">
                    <li>Formatos prioritários:</li>
                </ul>
            </div>
            <div class="toc-category">
                <div class="toc-category-title">CONVERSÃO</div>
                <ul class="toc-category-list">
                    <li>Formatos prioritários:</li>
                </ul>
            </div>
        </div>
    </div>
</div>
```

**CSS:**
```css
.toc-categories {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: flex-start; /* Left-aligned for funnel */
}

/* Funnel effect: progressive width reduction */
.toc-category:nth-child(1) {
    width: 100%; /* Widest - Discovery */
}

.toc-category:nth-child(2) {
    width: 85%; /* Medium - Nurturing */
}

.toc-category:nth-child(3) {
    width: 70%; /* Narrowest - Conversion (funnel bottom) */
}

.toc-category {
    background: var(--koko-black);
    color: var(--koko-white);
    padding: clamp(20px, 3vw, 32px);
}

.toc-category-title {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 900;
    margin-bottom: 16px;
}
```

**Key Elements:**
- Vertical stack with progressive width reduction (100% → 85% → 70%)
- Creates visual funnel representing user journey
- Black background cards with white text
- Left-aligned for clear funnel visualization

---

## 📊 Data Visualization Patterns (Slides 18-22)

**Added:** 2024-11-11 (Template v2.0)

Five standardized chart patterns for analytics presentations. All charts share:
- **Dog-ear corners** (18px corner fold effect)
- **2px black borders** (consistent with card system)
- **Responsive sizing** using `clamp()` for mobile-to-desktop
- **Semantic color coding** (green = positive, blue = info, yellow = warning, red = negative)

---

### Pattern 1: Line Chart (Temporal Evolution)

**Use Case:** Time-series data, performance trends, growth/decline over time

**HTML Structure:**
```html
<div class="slide line-chart-slide">
    <h1 class="slide-title">EVOLUÇÃO DE CONVERSÕES</h1>
    <p class="slide-subtitle">Performance ao longo de 6 semanas</p>

    <div class="line-chart-container">
        <svg class="line-chart" viewBox="0 0 600 300">
            <!-- Y-axis labels -->
            <g class="y-axis">
                <text x="40" y="50">400</text>
                <text x="40" y="100">300</text>
                <!-- ... -->
            </g>

            <!-- Line path -->
            <path class="line-path"
                  d="M 80,250 L 160,220 L 240,180 L 320,150 L 400,90 L 480,50"
                  stroke="#10B981"
                  stroke-width="3"
                  fill="none"/>

            <!-- Data points -->
            <circle cx="80" cy="250" r="5" fill="#10B981"/>
            <!-- ... -->

            <!-- X-axis labels -->
            <g class="x-axis">
                <text x="80" y="280">Sem 1</text>
                <!-- ... -->
            </g>
        </svg>

        <div class="chart-legend">
            <span class="legend-item">
                <span class="legend-color" style="background: #10B981"></span>
                Conversões totais
            </span>
        </div>
    </div>

    <div class="line-chart-metrics">
        <div class="metric-card">
            <div class="metric-label">Total de Conversões</div>
            <div class="metric-value">1.476</div>
        </div>
        <!-- More metrics -->
    </div>
</div>
```

**CSS:**
```css
.line-chart-container {
    background: var(--koko-white);
    border: 2px solid var(--koko-black);
    padding: clamp(20px, 3vw, 40px);
    clip-path: polygon(/* Dog-ear corner */);
}

.line-chart {
    width: 100%;
    height: auto;
}

.line-path {
    stroke: #10B981; /* Green for positive growth */
    stroke-width: 3;
    fill: none;
}
```

---

### Pattern 2: Horizontal Bar Chart (Comparison)

**Use Case:** Comparing values across categories, performance benchmarks

**HTML Structure:**
```html
<div class="slide bar-chart-slide">
    <h1 class="slide-title">PERFORMANCE POR CANAL</h1>
    <p class="slide-subtitle">Comparação de resultados</p>

    <div class="slide-content">
        <div class="bar-chart-item">
            <div class="bar-chart-header">
                <span class="bar-label">GOOGLE ADS</span>
                <span class="bar-value">R$ 247.890</span>
            </div>
            <div class="bar-chart-track">
                <div class="bar-chart-fill" style="width: 100%; background: #10B981">
                    <span class="bar-chart-label">ROAS 5.2x</span>
                </div>
            </div>
        </div>
        <!-- More bars -->
    </div>
</div>
```

**CSS:**
```css
.bar-chart-slide .slide-content {
    gap: clamp(16px, 2vw, 24px); /* Compact vertical spacing */
}

.bar-chart-track {
    width: 100%;
    height: clamp(36px, 4.5vw, 54px);
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid var(--koko-black);
    position: relative;
    overflow: hidden;
    clip-path: polygon(/* Trapezoid shape */);
}

.bar-chart-fill {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.8s ease-out;
}
```

**Color Semantics:**
- Green (#10B981): Top performer, positive results
- Blue (#3B82F6): Good performance, secondary
- Yellow (#F5C542): Warning, needs attention
- Red (#EF4444): Underperforming, critical

---

### Pattern 3: Donut Chart (Distribution)

**Use Case:** Budget allocation, market share, portfolio distribution

**HTML Structure:**
```html
<div class="slide donut-chart-slide">
    <div class="donut-chart-container">
        <h1 class="slide-title">DISTRIBUIÇÃO DE BUDGET</h1>
        <p class="slide-subtitle">Alocação por plataforma (Outubro 2024)</p>

        <div class="donut-chart-wrapper">
            <svg class="donut-chart" viewBox="0 0 200 200">
                <!-- Donut segments using stroke-dasharray -->
                <circle class="donut-segment"
                        cx="100" cy="100" r="80"
                        stroke="#F5C542"
                        stroke-width="40"
                        stroke-dasharray="226 565"
                        transform="rotate(-90 100 100)"/>
                <!-- More segments -->
            </svg>
            <div class="donut-center">
                <div class="donut-center-value">R$ 300k</div>
                <div class="donut-center-label">Budget Total</div>
            </div>
        </div>
    </div>

    <div class="donut-legend">
        <div class="legend-item">
            <span class="legend-color" style="background: #F5C542"></span>
            <span class="legend-text">Google Ads</span>
            <span class="legend-value">R$ 135k (45%)</span>
        </div>
        <!-- More legend items -->
    </div>
</div>
```

**CSS:**
```css
.donut-chart-wrapper {
    position: relative;
    width: clamp(200px, 40vw, 400px);
    aspect-ratio: 1;
}

.donut-segment {
    fill: none;
    stroke-width: 40;
    stroke-linecap: butt;
}

.donut-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}
```

**Segment Calculation:**
```javascript
// For a circle with radius 80:
const circumference = 2 * Math.PI * 80; // 502.65
const segmentLength = (percentage / 100) * circumference;
const gap = circumference - segmentLength;

// stroke-dasharray: segmentLength gap
// Example: 45% = "226 277"
```

---

### Pattern 4: Funnel Visualization (Conversion Path)

**Use Case:** Multi-stage funnels, drop-off analysis, user journey mapping

**HTML Structure:**
```html
<div class="slide funnel-slide">
    <h1 class="slide-title">FUNIL DE CONVERSÃO</h1>
    <p class="slide-subtitle">Jornada completa - Outubro 2024</p>

    <div class="slide-content">
        <div class="funnel-stage">
            <div class="funnel-stage-header">
                <span class="funnel-stage-label">1. IMPRESSÕES</span>
                <span class="funnel-stage-value">
                    1.250.000
                    <span class="funnel-stage-percentage">(100%)</span>
                </span>
            </div>
            <div class="funnel-bar">
                <span class="funnel-bar-label">TOPO DO FUNIL</span>
            </div>
            <div class="funnel-drop-off">-15%</div>
        </div>
        <!-- More stages -->
    </div>

    <div class="funnel-insight">
        <strong>OPORTUNIDADE:</strong> Drop-off crítico Leads → Conversões (65%).
        Sugestão: remarketing + melhor copy nas LPs.
    </div>
</div>
```

**CSS (Critical - Empirically Validated):**
```css
.funnel-slide .slide-content {
    gap: clamp(16px, 2vw, 24px); /* Space for drop-off badges */
}

.funnel-stage {
    gap: 4px; /* Minimal internal gap */
    position: relative;
}

.funnel-bar {
    height: clamp(35px, 3.5vw, 50px);
    border: 2px solid var(--koko-black);
    /* Trapezoid: wide top, narrow bottom */
    clip-path: polygon(0 0, 100% 0, 92% 100%, 8% 100%);
}

/* Width progression creates funnel effect */
.funnel-stage:nth-of-type(1) .funnel-bar { width: 100%; }
.funnel-stage:nth-of-type(2) .funnel-bar { width: 85%; margin: 0 auto; }
.funnel-stage:nth-of-type(3) .funnel-bar { width: 60%; margin: 0 auto; }
.funnel-stage:nth-of-type(4) .funnel-bar { width: 35%; margin: 0 auto; }

/* Drop-off badges: CRITICAL positioning */
.funnel-drop-off {
    position: absolute;
    bottom: calc(-1 * clamp(40px, 5vw, 47px));
    /* ↑ Empirically measured: gap center - badge half height */
    left: 50%;
    transform: translate(-50%, 0%);
    background: var(--koko-white);
    border: 2px solid var(--koko-black);
    padding: 4px 12px;
    z-index: 10;
}
```

**Badge Positioning Math:**
- Gap between stages: 16-24px (CSS) → **63px real** (computed)
- Badge height: ~30px
- Gap center: 31.5px from bar bottom
- Badge center from top: 15px
- **Bottom offset needed:** 31.5px + 15px = ~47px
- **Result:** Badges perfectly centered (±1px validated via Playwright)

**Critical Notes:**
1. **Use `:nth-of-type()` not `:nth-child()`** - Counts only `.funnel-stage` elements
2. **Bottom offset is negative** - Pushes badge DOWN into gap
3. **Empirical validation required** - CSS clamp ≠ computed gap size
4. **Responsive sizing** - All values use clamp() for mobile-to-desktop

---

### Pattern 5: Stacked Area Chart (Multi-Channel Evolution)

**Use Case:** Multi-source trends, channel contribution, portfolio evolution

**HTML Structure:**
```html
<div class="slide stacked-area-slide">
    <h1 class="slide-title">EVOLUÇÃO MULTI-CANAL</h1>
    <p class="slide-subtitle">Receita mensal por plataforma (Mai-Out 2024)</p>

    <div class="slide-content">
        <div class="chart-container">
            <svg class="stacked-area-chart" viewBox="0 0 600 300">
                <!-- Y-axis -->
                <g class="y-axis">
                    <text x="40" y="50">400k</text>
                    <!-- ... -->
                </g>

                <!-- Stacked areas (bottom to top) -->
                <path class="area-path area-google"
                      d="M 80,250 L 160,240 ... L 480,180 L 480,300 L 80,300 Z"
                      fill="url(#google-gradient)"/>
                <path class="area-path area-meta"
                      d="M 80,180 L 160,170 ... L 480,120 L 480,180 L 80,250 Z"
                      fill="url(#meta-gradient)"/>
                <!-- TikTok area -->

                <!-- X-axis -->
                <g class="x-axis">
                    <text x="80" y="280">Mai</text>
                    <!-- ... -->
                </g>
            </svg>
        </div>

        <div class="channel-metrics">
            <div class="channel-card">
                <div class="channel-color" style="background: #F5C542"></div>
                <div class="channel-name">Google Ads</div>
                <div class="channel-stats">
                    <div class="stat">
                        <span class="stat-label">Receita</span>
                        <span class="stat-value">R$ 160k</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Crescimento</span>
                        <span class="stat-value">+100%</span>
                    </div>
                </div>
            </div>
            <!-- More channels -->
        </div>
    </div>
</div>
```

**CSS:**
```css
.stacked-area-slide .slide-content {
    display: grid;
    grid-template-columns: 1.5fr 1fr; /* 60% chart, 40% legend */
    gap: clamp(40px, 5vw, 80px);
}

.area-path {
    opacity: 0.8;
    stroke-width: 2;
    stroke: var(--koko-black);
}

.channel-card {
    display: grid;
    grid-template-columns: 8px 1fr;
    gap: 16px;
    padding: 16px;
    background: var(--koko-white);
    border: 2px solid var(--koko-black);
    clip-path: polygon(/* Dog-ear */);
}

.channel-color {
    width: 8px;
    height: 100%;
    background: var(--channel-color);
}
```

**Gradients for Depth:**
```html
<defs>
    <linearGradient id="google-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#F5C542" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#F5C542" stop-opacity="0.4"/>
    </linearGradient>
</defs>
```

---

### Shared Chart Styling

**Common Container CSS:**
```css
/* All chart slides share base structure */
.chart-container,
.line-chart-container,
.donut-chart-container {
    background: var(--koko-white);
    border: 2px solid var(--koko-black);
    padding: clamp(20px, 3vw, 40px);
    position: relative;

    /* Dog-ear corner (18px) */
    clip-path: polygon(
        0 0,
        100% 0,
        100% calc(100% - 18px),
        calc(100% - 18px) 100%,
        0 100%
    );
}

.chart-container::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg,
        #d9d9d9 0%,      /* Verso (paper back) */
        #d9d9d9 45.5%,
        #000 45.5%,      /* 2px border */
        #000 54.5%,
        #FFFFFF 54.5%,   /* Background */
        #FFFFFF 100%
    );
}
```

**Typography:**
```css
.slide-title {
    font-size: clamp(40px, 5vw, 64px);
    margin-bottom: 8px;
}

.slide-subtitle {
    font-size: clamp(16px, 2vw, 24px);
    margin-bottom: 24px;
    opacity: 0.8;
}

.chart-legend {
    display: flex;
    gap: 16px;
    margin-top: 16px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: clamp(12px, 1.4vw, 16px);
}

.legend-color {
    width: 16px;
    height: 16px;
    border: 2px solid var(--koko-black);
}
```

**Responsive Breakpoints:**
```css
@media (max-width: 768px) {
    /* Stack chart + legend vertically on mobile */
    .stacked-area-slide .slide-content {
        grid-template-columns: 1fr;
    }

    /* Reduce chart height */
    .line-chart,
    .stacked-area-chart {
        height: 200px;
    }
}
```

---

### Chart Pattern Selection Guide

| Pattern | Best For | Avoid When |
|---------|----------|------------|
| **Line Chart** | Time-series, trends, growth | Comparing categories, discrete data |
| **Bar Chart** | Category comparison, rankings | Temporal data, distributions |
| **Donut Chart** | Part-to-whole, percentages | Too many categories (>6), time-series |
| **Funnel** | Multi-stage processes, drop-offs | Non-sequential data, parallel paths |
| **Stacked Area** | Multi-source evolution, composition | Too many sources (>4), negative values |

**Data Density Guidelines:**
- Maximum 6 data points for mobile line charts
- Maximum 4 bars for vertical bar charts
- Maximum 5 segments for donut charts
- Maximum 4 stages for funnels
- Maximum 3 channels for stacked areas

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
        src="https://flow.jumper.studio/decks/identities/koko/logos/Logo_Preferencial_Koko_Preto.png"
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
- `gorilla-hand-left.png` - Left hand (positioned at top-left)
- `gorilla-hand-right.png` - Right hand (positioned at bottom-right)

**Usage Pattern (Hero Slide):**
```html
<!-- Left hand from top-left diagonal -->
<img
    src="https://flow.jumper.studio/decks/identities/koko/elements/gorilla-hand-left.png"
    class="absolute w-[43vw] max-w-[540px]"
    style="left: -5%; top: -5%;">

<!-- Right hand from bottom-right diagonal -->
<img
    src="https://flow.jumper.studio/decks/identities/koko/elements/gorilla-hand-right.png"
    class="absolute w-[43vw] max-w-[540px]"
    style="right: -5%; bottom: -5%;">
```

**2. Pattern Backgrounds**

Available:
- `hero-background.png` - Full-slide hero background pattern
- `checkered-background.png` - Checkerboard pattern

**Application:**
```css
.pattern-background {
    background-image: url('https://flow.jumper.studio/decks/identities/koko/elements/hero-background.png');
    background-size: cover;
    background-position: center;
}
```

**3. Accent Graphics**

Available:
- `heart.png` - Heart (emotional moments)
- `pink-explosion.png` - Pink splash (dynamic accents)
- `mouth.png` - Mouth halftone
- `computer.png` - Computer halftone

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
    background-image: url('https://flow.jumper.studio/decks/identities/koko/gradients/Koko Dust 1.jpg');
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

Base URL: `https://flow.jumper.studio/decks/identities/koko/fonts/`

### Logos
- `Logo_Preferencial_Koko_Branco.png` (white, dark backgrounds)
- `Logo_Preferencial_Koko_Preto.png` (black, light backgrounds)
- `Símbolo_Branco.png` (white symbol)
- `Símbolo_Preto.png` (black symbol)

Base URL: `https://flow.jumper.studio/decks/identities/koko/logos/`

### Graphics
- `hero-background.png` (hero background pattern)
- `checkered-background.png` (checkerboard pattern)
- `gorilla-hand-left.png` (left hand for top-left position)
- `gorilla-hand-right.png` (right hand for bottom-right position)
- `heart.png` (heart)
- `pink-explosion.png` (pink splash)
- `mouth.png` (mouth halftone)
- `computer.png` (computer halftone)

Base URL: `https://flow.jumper.studio/decks/identities/koko/elements/`

### Textures
- `Koko Dust 1.jpg` (texture background)
- `Koko Dust 2.jpg` (texture background)
- `Koko Dust 3.jpg` (texture background)

Base URL: `https://flow.jumper.studio/decks/identities/koko/gradients/`

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
