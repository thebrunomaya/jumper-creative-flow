# Jumper Studio - Design System for Presentation Decks

**Version:** 1.0
**Last Updated:** November 2025
**Focus:** Presentation decks (Reports, Media Plans, Pitches)

---

## 🎯 Brand Philosophy

### Core Principle
> **"Sophisticated minimalism with strategic organic accents"**

Jumper Studio presentations balance **clean professionalism** with **subtle visual sophistication**. We don't shout—we demonstrate expertise through thoughtful design and substance.

### Golden Rule
> **"Small elements = solid colors. Large compositions = organic gradients."**

**Application:**
- Buttons, badges, icons → Solid orange `#FA4721` or grays
- Full-slide backgrounds, hero sections → Organic gradient images
- Data visualizations → Performance colors (green/blue/amber/red)

### Color Distribution Philosophy

- **90% Grays** - Navigation, states, functional components, body text
- **5% Orange** - Critical actions, key highlights, brand moments
- **5% Semantic** - Success (green), warnings (amber), errors (red), info (blue)

**Why?** Strategic restraint creates impact. When orange appears, it commands attention.

---

## 🎨 Visual Identity

### Color Palette

**Primary Brand Colors:**
```css
--jumper-orange: #FA4721;    /* Primary accent - use strategically */
--jumper-purple: #8143A7;    /* Gradient companion to orange */
--jumper-white: #FFFFFF;     /* Pure white backgrounds */
--jumper-black: #000000;     /* Pure black (rare, for high contrast) */
```

**Grays (90% of interface):**
```css
--jumper-gray-dark: #181818;     /* Dark surfaces, heavy text */
--jumper-gray-medium: #3E3D40;   /* Borders, subtle elements */
--jumper-gray-light: #C6CBD4;    /* Secondary text */
--color-subtle: #6B7280;         /* Muted elements */
--color-muted: #9CA3AF;          /* Tertiary information */
```

**Semantic Colors (Data & Alerts):**
```css
--color-success: #10B981;    /* Green - positive metrics, growth */
--color-warning: #F59E0B;    /* Amber - attention needed */
--color-error: #EF4444;      /* Red - critical issues, declines */
--color-info: #3B82F6;       /* Blue - neutral information */
```

**Performance Indicators (Dashboard-inspired):**
```css
--metric-excellent: #2AA876;  /* Dark green - exceptional results */
--metric-good: #3B82F6;       /* Blue - solid performance */
--metric-warning: #F59E0B;    /* Amber - needs monitoring */
--metric-critical: #EF4444;   /* Red - urgent attention required */
```

---

### Typography

**Font Family:**
```css
@font-face {
  font-family: 'Haffer';
  src: url('../fonts/HafferVF.ttf') format('truetype');
  font-weight: 100 900;
  font-style: normal;
}

/* Default font stack */
font-family: 'Haffer', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Available Variants:**
- `../fonts/HafferVF.ttf` - Variable font (weights 400-900, recommended)
- `../fonts/HafferUprightVF.ttf` - Upright variant
- `../fonts/HafferItalicVF.ttf` - Italic variant

**Typographic Scale for Presentations:**

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| **Hero Title** | `clamp(48px, 8vw, 120px)` | 900 | Cover slides, main statements |
| **Section Title** | `clamp(36px, 5vw, 72px)` | 900 | Slide headings |
| **Subtitle** | `clamp(18px, 2.5vw, 32px)` | 400-600 | Supporting text, periods |
| **Hero Metric** | `clamp(72px, 12vw, 180px)` | 900 | Big numbers (conversions, ROAS) |
| **Body Text** | `clamp(16px, 2vw, 24px)` | 400 | Paragraphs, descriptions |
| **Detail Text** | `clamp(13px, 1.5vw, 18px)` | 400 | Captions, footnotes |

**Responsive Typography:**
Use `clamp(min, preferred, max)` for fluid scaling across devices. This ensures readability on mobile presentations and large screens.

---

### Logo System

**Available Assets:**

| File | Size | Background | Primary Use |
|------|------|------------|-------------|
| `../logos/jumper-black.png` | 9.3KB | Light | Main logo on white/gray slides |
| `../logos/jumper-white.png` | 7.0KB | Dark | Logo on dark/gradient backgrounds |
| `../logos/x-black.png` | 4.6KB | Light | Symbol only (minimal branding) |
| `../logos/X-White.png` | 4.2KB | Dark | Symbol on dark backgrounds |

**Standard Placement:**
```css
.brand-logo {
  position: absolute;
  top: 40px;
  right: 40px;
  width: 120px;
  height: auto;
  opacity: 0.9;
}
```

**Usage Guidelines:**
- Cover slides: Center or top-right placement
- Content slides: Top-right corner (unobtrusive)
- Closing slides: Center or bottom (reinforcement)
- Always maintain aspect ratio
- Minimum size: 80px width (mobile)

---

### Organic Gradients

**Available Backgrounds:**

| File | Size | Recommended Use |
|------|------|-----------------|
| `../gradients/organic-01.png` | 4.2MB | **Hero/cover slides** - highest visual impact |
| `../gradients/organic-02.png` | 1.4MB | CTA slides, closing statements |
| `../gradients/organic-03.png` | 392KB | Subtle backgrounds (most minimal) |
| `../gradients/organic-04.png` | 571KB | Mid-deck transitions |
| `../gradients/organic-05.png` | 693KB | Data visualization backgrounds |
| `../gradients/organic-06.png` | 615KB | Alternative hero sections |

**Application Example:**
```css
/* Full-slide gradient background */
.slide-hero {
  background-image: url('../gradients/organic-01.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* With fallback color */
.slide-gradient {
  background: #181818; /* Fallback */
  background-image: url('../gradients/organic-03.png');
  background-size: cover;
}
```

**Usage Philosophy:**
- **Use sparingly** - 2-3 gradient slides per 10-slide deck
- **Strategic placement** - Cover, major section breaks, closing
- **Prefer solid backgrounds** for data-heavy slides (readability)
- **Always provide fallback** - `background: #color;` before gradient

---

### ⚠️ CRITICAL: Asset URL Format

**MANDATORY RULE:** ALL asset references in generated HTML MUST use absolute HTTPS URLs.

**Correct Format (ALWAYS):**
```css
/* Fonts */
src: url('https://hub.jumper.studio/decks/identities/jumper/fonts/HafferVF.ttf')

/* Backgrounds */
background-image: url('https://hub.jumper.studio/decks/identities/jumper/gradients/organic-01.png')

/* Images */
<img src="https://hub.jumper.studio/decks/identities/jumper/logos/jumper-white.png">
```

**Wrong Formats (NEVER USE):**
```css
/* ❌ Relative paths - BREAKS when served from Storage */
src: url('/decks/identities/jumper/fonts/HafferVF.ttf')
background-image: url('../gradients/organic-01.png')
<img src="./logos/jumper-white.png">
```

**Why:** HTML files are served from Supabase Storage domain, not hub.jumper.studio. Relative paths resolve to wrong domain and return 404 errors.

---

## 📐 Presentation Design Guidelines

### Interface Rules

**Alignment:**
- ✅ **Text left-aligned** (default for body content)
- ✅ **Centered titles** on hero/cover slides only
- ❌ Avoid center-aligning paragraphs or lists

**Emoji Usage:**
- ✅ **Monochrome emojis** (🇨🇴 🏆 📊 ⚠️) - icons, flags, symbols
- ❌ Colorful/playful emojis (😀 🎉 💪) - unprofessional

**Visual Hierarchy:**
```
1. Function (Does it work?)
2. Legibility (Can users read it?)
3. Sophistication (Is it elegant?)
4. Brand Identity (Does it feel like Jumper?)
```

**Spacing System:**
```css
--spacing-xs: 4px;   /* Tight elements */
--spacing-sm: 8px;   /* Related items */
--spacing-md: 16px;  /* Default gap */
--spacing-lg: 24px;  /* Section spacing */
--spacing-xl: 32px;  /* Major separation */
--spacing-2xl: 48px; /* Slide padding */
--spacing-3xl: 64px; /* Hero sections */
```

---

### Slide Layout Patterns

**1. Cover Slide**
```html
<div class="slide slide-cover">
  <img src="../logos/jumper-black.png" class="brand-logo">
  <div class="slide-content">
    <h1>Deck Title</h1>
    <p class="subtitle">Period or Context</p>
  </div>
</div>
```

**2. Section Title Slide**
```html
<div class="slide slide-section">
  <div class="slide-content">
    <h1>Section Name</h1>
    <p class="body-text">Brief description or context</p>
  </div>
</div>
```

**3. Data Visualization Slide**
```html
<div class="slide">
  <div class="slide-content">
    <h1>Performance Overview</h1>
    <div class="cards-container">
      <!-- Metric cards, charts, comparisons -->
    </div>
  </div>
</div>
```

**4. Key Insight Slide**
```html
<div class="slide">
  <div class="slide-content">
    <div class="big-number">750</div>
    <div class="hero-text">Conversions Achieved</div>
    <p class="body-text">Supporting detail and context</p>
  </div>
</div>
```

---

### Gradient Layout Strategies

**Philosophy:** "Gradients add sophistication without compromising readability"

**Three Strategies Available** (in order of preference):

1. **Split Layout** (Recommended) - Gradient on one half, content on the other
2. **Text Containers** (Alternative) - Boxes with solid background over gradient
3. **Color Overrides** (Last Resort) - Adjust text colors directly

---

#### **Strategy 1: Split Layout (RECOMMENDED)**

**When to use:**
- Cover slides (maximum visual impact)
- Closing slides (strong final impression)
- Slides with minimal text (hero messages)

**Advantages:**
- ✅ 100% legibility guaranteed
- ✅ Full-size gradient (visual impact)
- ✅ More sophisticated and modern design
- ✅ Zero compromise between aesthetics and function

**Layout Pattern:**

```css
/* Split Layout: 50/50 Gradient + Content */
.slide-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  text-align: left;
}

.slide-split-gradient {
  background-image: url('../gradients/organic-01.png');
  background-size: cover;
  background-position: center;
}

.slide-split-content {
  background: #000000; /* or #FFFFFF depending on design */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(60px, 10vw, 120px);
}

/* Variation: Gradient Left */
.slide-split-gradient-left .slide-split-gradient {
  order: 1;
}

.slide-split-gradient-left .slide-split-content {
  order: 2;
}

/* Variation: Gradient Right */
.slide-split-gradient-right .slide-split-gradient {
  order: 2;
}

.slide-split-gradient-right .slide-split-content {
  order: 1;
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .slide-split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
```

**Example Usage:**
```html
<!-- Cover Slide: Gradient Right -->
<div class="slide slide-split slide-split-gradient-right">
  <div class="slide-split-content">
    <div>
      <h1 style="color: #FFFFFF;">Google Ads<br>Weekly Report</h1>
      <p class="subtitle" style="color: rgba(255,255,255,0.7);">October 24-30, 2025</p>
    </div>
  </div>
  <div class="slide-split-gradient"></div>
</div>

<!-- Closing Slide: Gradient Left -->
<div class="slide slide-split slide-split-gradient-left">
  <div class="slide-split-gradient"></div>
  <div class="slide-split-content">
    <div>
      <h2 style="color: #FFFFFF;">Portfolio Fully Optimized</h2>
      <p class="hero-text" style="color: rgba(255,255,255,0.8);">Ready for controlled expansion</p>
    </div>
  </div>
</div>
```

---

#### **⚠️ Critical: Split Layout Height Bug Fix**

**Problem:** Split layout gradients may not display correctly with the following symptoms:
- Empty gradient div has `height: 0px` (not visible at all)
- Black borders appear on gradient edges
- Gradient doesn't fill the grid parent container

**Root Cause:**
Using `min-height: 100vh` on `.slide-split-gradient` breaks in CSS Grid contexts because:
- `100vh` calculates height based on viewport, not grid parent
- Grid parent may be shorter or taller than viewport, causing mismatch/overflow
- Empty divs without content default to `height: 0px` unless explicitly sized

**Solution:**

```css
.slide-split-gradient {
  /* ❌ WRONG - causes empty div or black borders */
  min-height: 100vh;

  /* ✅ CORRECT - fills grid parent completely */
  height: 100%;

  background-image: url('../identities/jumper/gradients/organic-01.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

**Validation Checklist:**
- ✅ Gradient fills exactly 50% of slide width (edge-to-edge)
- ✅ No black borders or empty space visible
- ✅ Height matches the `.slide-split-content` div exactly
- ✅ Works correctly on mobile (stacked layout)

**Debugging Tips:**
If gradients still don't appear:
1. Use browser DevTools to inspect `.slide-split-gradient` element
2. Check computed `height` property (should NOT be `0px`)
3. Verify `background-image` path is correct relative to HTML file
4. Confirm gradient PNG files exist and have proper permissions (`chmod 644`)

**Historical Note:**
This fix was discovered on 2025-11-03 during Moldura Minuto presentation creation. Original code used `min-height: 100vh` which caused gradients to not display properly.

---

#### **Strategy 2: Text Containers (ALTERNATIVE)**

**When to use:**
- Data slides with gradient as background texture
- Multiple cards/elements need to stand out
- Timeline or comparison grids over gradients

**Advantages:**
- ✅ Gradient visible as background texture
- ✅ Perfect legibility in containers
- ✅ Flexible for complex layouts

**Container Patterns:**

```css
/* Text Box over Gradient (Dark) */
.gradient-text-box {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: clamp(24px, 4vw, 40px);
  color: #FFFFFF;
}

/* Text Box over Gradient (Light) */
.gradient-text-box-light {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: clamp(24px, 4vw, 40px);
  color: #181818;
}

/* Glassmorphism Variant */
.gradient-glass-box {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: clamp(24px, 4vw, 40px);
  color: #FFFFFF;
}
```

**Example Usage:**
```html
<div class="slide slide-gradient-1">
  <div class="slide-content">
    <h1>79% Efficiency Gain in 5 Weeks</h1>

    <!-- Timeline in containers -->
    <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
      <div class="gradient-text-box">
        <div class="timeline-label">Week 1</div>
        <div class="timeline-value">$2.03</div>
        <div class="timeline-sub">74 conv</div>
      </div>
      <div class="gradient-text-box">
        <div class="timeline-label">Week 2</div>
        <div class="timeline-value">$1.32</div>
        <div class="timeline-sub">↓35%</div>
      </div>
      <div class="gradient-text-box">
        <div class="timeline-label">Week 5</div>
        <div class="timeline-value">$0.42</div>
        <div class="timeline-sub">750 conv</div>
      </div>
    </div>
  </div>
</div>
```

---

#### **Strategy 3: Color Overrides (LAST RESORT)**

**When to use:**
- Full-bleed gradients mandatory
- No space for split layout
- Subtle gradients (organic-03, organic-04, organic-06)

**Disadvantages:**
- ⚠️ Depends on light/dark areas of gradient
- ⚠️ May fail at different resolutions
- ⚠️ Less elegant than split or containers

**Only use when:**
- Split layout breaks content structure
- Text containers feel too heavy
- Gradient is subtle enough to allow text overlays

**Override Rules:**

```css
/* Dark Gradients: Force white text hierarchy */
.slide-gradient-dark .subtitle {
  color: rgba(255, 255, 255, 0.8) !important;
}

.slide-gradient-dark .body-text {
  color: rgba(255, 255, 255, 0.7) !important;
}

.slide-gradient-dark .timeline-label {
  color: rgba(255, 255, 255, 0.6) !important;
}

.slide-gradient-dark .timeline-sub {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* Apply to specific gradient classes */
.slide-gradient-1,
.slide-gradient-2,
.slide-gradient-5 {
  /* These are dark gradients requiring overrides */
}
```

---

#### **Decision Matrix**

| Slide Type | Recommended Strategy | Reason |
|------------|---------------------|---------|
| **Cover** | Split Layout | Maximum impact, zero compromise |
| **Closing** | Split Layout | Strong final impression |
| **Timeline** | Text Containers | Multiple elements, guaranteed legibility |
| **Comparison** | Text Containers | Cards highlighted over texture |
| **Hero Message** | Split Layout | Simple message, impactful layout |
| **Data Heavy** | Text Containers | Multiple data points, clear organization |
| **Subtle Gradient** | Color Overrides | Light gradient allows default colors |

**Priority Hierarchy:**
1. ⭐ **Split Layout** - Whenever possible (cover, closing, hero)
2. 🥈 **Text Containers** - For complex layouts (data, timeline)
3. 🥉 **Color Overrides** - Only when necessary (subtle gradients)

---

#### **Live Section Examples**

**Location:** `../sections/`

Interactive HTML demos of the gradient layout strategies:

1. **`split-layout-gradient-right.html`**
   - Cover slide pattern with gradient on right side
   - Demonstrates organic-01.png usage
   - Perfect for opening slides
   - Includes animated content and brand logo positioning

2. **`split-layout-gradient-left.html`**
   - Closing slide pattern with gradient on left side
   - Demonstrates organic-02.png usage
   - Strong final impression layout
   - Badge component example

3. **`text-containers-on-gradient.html`**
   - Timeline pattern with dark containers over gradient
   - Demonstrates organic-05.png usage
   - Sequential animation of timeline items
   - Includes glassmorphism variant example

**Usage:** Open HTML files in browser to see interactive demos with animations, hover states, and responsive behavior. Each file includes an info panel explaining when and how to use the pattern.

---

### Component Library

**Metric Cards (Data Displays):**
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card .metric {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  line-height: 1;
  color: #FA4721; /* or performance color */
}
```

**Performance Badges:**
```css
.badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
}

.badge-excellent {
  background: rgba(42, 168, 118, 0.1);
  color: #2AA876;
}

.badge-good {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.badge-critical {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}
```

**Comparison Grids:**
```css
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(30px, 6vw, 80px);
  max-width: 1000px;
}

.comparison-item {
  text-align: center;
}

.comparison-item .big-stat {
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 900;
  line-height: 1;
}
```

**Cards Container (Grid Layout):**
```css
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(20px, 4vw, 40px);
  max-width: 1100px;
}

/* Responsive: Mobile single column */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
}
```

---

### Animation Standards

**Timing & Easing:**
```css
--transition-fast: 0.15s ease;
--transition-normal: 0.2s ease;
--transition-slow: 0.3s ease;

/* Preferred easing for smooth, professional feel */
--ease-jumper: cubic-bezier(0.16, 1, 0.3, 1);
```

**Standard Animations:**

**Fade In Up (Primary):**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-content {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
  opacity: 0; /* Initial state */
}
```

**Card Slide Up (Sequential):**
```css
@keyframes cardSlideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  opacity: 0;
  transform: translateY(30px);
  animation: cardSlideUp 0.6s ease-out forwards;
}

.card:nth-child(1) { animation-delay: 0.5s; }
.card:nth-child(2) { animation-delay: 0.6s; }
.card:nth-child(3) { animation-delay: 0.7s; }
.card:nth-child(4) { animation-delay: 0.8s; }
```

**Scale In (Comparison Elements):**
```css
@keyframes scaleIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.comparison-item {
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn 0.6s ease-out forwards;
}

.comparison-item:nth-child(1) { animation-delay: 0.4s; }
.comparison-item:nth-child(2) { animation-delay: 0.6s; }
```

**❌ Avoid:**
- Bounces, wiggles, rotations (too playful)
- Excessive delays (>1.5s total)
- Jarring easing (linear, ease-in-out)
- Overuse of scale transforms

---

## 📝 Content & Language Guidelines

### Tone of Voice

**Core Principle:** Implicit elegance, not explicit claims

✅ **DO:**
- Demonstrate quality through work, not adjectives
- Use precise metrics and methodology
- Show confidence through competence
- Focus on client results over self-promotion

❌ **DON'T:**
- Overuse "premium", "exclusive", "luxury", "world-class"
- Make unsubstantiated claims
- Use superlatives excessively
- Sound salesy or desperate

**Examples:**

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| "Our premium, world-class service delivers exceptional, exclusive results" | "Methodology-driven optimization, validated by 5 consecutive weeks of improvement" |
| "Luxury digital marketing for elite brands" | "Strategic digital advertising for growth-focused businesses" |
| "We're the best in the industry!" | "750 conversions at $0.42 cost/conversion (79% improvement)" |

---

### Deck Types & Content Strategy

**1. Reports (Performance Reviews)**

**Purpose:** Transparently communicate results, insights, next steps

**Structure:**
1. Cover (period, account name)
2. Executive summary (3-4 hero metrics)
3. Performance deep dive (charts, comparisons)
4. Key insights (what worked, what didn't)
5. Areas to monitor (honesty about challenges)
6. Next steps (clear action items)

**Language:**
- Professional, data-driven
- Confident but not boastful
- Honest about challenges
- Forward-looking (strategic)

**Visual Style:**
- Clean charts with performance color coding
- Metric cards with badges (excellent/good/warning/critical)
- Minimal decoration, maximum clarity

---

**2. Media Plans (Campaign Proposals)**

**Purpose:** Present strategy, timeline, budget, creative direction

**Structure:**
1. Cover (campaign name, objectives)
2. Strategy overview (approach, targeting)
3. Timeline (milestones, phases)
4. Budget breakdown (allocation, projections)
5. Creative direction (mockups, messaging)
6. Success metrics (how we'll measure)

**Language:**
- Strategic, organized
- Future-focused (we will...)
- Specific about deliverables
- Realistic about timelines

**Visual Style:**
- Timeline visualizations
- Budget tables (clean, readable)
- Mockup placeholders for creatives
- Calendar/Gantt-style layouts

---

**3. Pitches (New Client Proposals)**

**Purpose:** Demonstrate value, build trust, win business

**Structure:**
1. Problem statement (client's challenge)
2. Solution (how Jumper solves it uniquely)
3. Methodology (our process, tech, expertise)
4. Social proof (case studies, results)
5. Proposal (pricing, deliverables, timeline)
6. CTA (schedule a call, ask questions)

**Language:**
- Opportunity-focused (not problem-obsessed)
- Authentic (no false promises)
- Value-driven (ROI, outcomes)
- Consultative (partner, not vendor)

**Visual Style:**
- Bold headlines for problem/solution
- Before/after comparisons
- Case study results (numbers-first)
- Pricing tables (clear, transparent)

---

## ✅ Implementation Checklist

### Before Generating Any Deck

**Asset Validation:**
- [ ] Haffer font loaded correctly (fallback to system fonts)
- [ ] Logo file exists and matches background color
- [ ] Gradient images referenced with correct relative paths
- [ ] All colors use CSS variables or hex codes (not generic names)

**Design Validation:**
- [ ] Orange used strategically (not overused)
- [ ] Backgrounds are clean (white/subtle gradients, not busy)
- [ ] Text left-aligned (except hero/cover titles)
- [ ] Emojis are monochrome (flags, symbols, not faces)
- [ ] Performance colors match dashboard system

**Content Validation:**
- [ ] Tone is professional, not boastful
- [ ] Metrics are specific and accurate
- [ ] Language avoids excessive superlatives
- [ ] One clear idea per slide

**Technical Validation:**
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Animations are smooth (0.6-0.8s duration)
- [ ] WCAG AA contrast ratio validated (text readability)
- [ ] Keyboard navigation works (arrow keys, spacebar)
- [ ] Touch/swipe enabled for mobile presentations

**Accessibility:**
- [ ] Text size meets minimum 16px on mobile
- [ ] Color is not the only indicator (use icons/labels)
- [ ] Sufficient contrast (4.5:1 for body text, 3:1 for large text)
- [ ] Alt text provided for logos/images

---

## 🎯 Quick Reference

### When to Use Each Color

| Color | Use For | Don't Use For |
|-------|---------|---------------|
| **Orange `#FA4721`** | CTAs, key metrics, brand moments | Backgrounds, body text, borders |
| **Grays** | 90% of interface, text, borders | Hero moments, CTAs |
| **Green `#2AA876`** | Positive metrics, growth, success | Warnings, neutral data |
| **Blue `#3B82F6`** | Solid performance, neutral info | Critical issues |
| **Amber `#F59E0B`** | Warnings, needs attention | Success, positive metrics |
| **Red `#EF4444`** | Critical issues, declines | Positive data, highlights |

### When to Use Each Gradient

| Gradient | File Size | Best For | Recommended Strategy |
|----------|-----------|----------|---------------------|
| `organic-01.png` | 4.2MB | Cover slides, hero sections (maximum impact) | **Split Layout** |
| `organic-02.png` | 1.4MB | CTA slides, closing statements | **Split Layout** |
| `organic-03.png` | 392KB | Subtle backgrounds (minimal texture) | Color Overrides OK |
| `organic-04.png` | 571KB | Mid-deck transitions | Color Overrides OK |
| `organic-05.png` | 693KB | Data visualization, timeline backgrounds | **Text Containers** |
| `organic-06.png` | 615KB | Alternative hero sections | Split Layout or Containers |

**Rule of thumb:** Use gradients 2-3 times per 10-slide deck. More = cluttered, less = missed opportunity.

**Strategy Guidelines:**
- **Split Layout** → Cover, closing, and hero message slides
- **Text Containers** → Data-heavy slides (timeline, comparisons, metrics)
- **Color Overrides** → Only for subtle gradients (organic-03, 04, 07)

---

## 📐 Layout Best Practices

**Slide Padding:**
```css
.slide {
  padding: clamp(40px, 8vh, 120px);
}
```
- Mobile: 40px (safe zones)
- Tablet: ~60px (balanced)
- Desktop: 120px (generous white space)

**Content Max Width:**
```css
.slide-content {
  max-width: 1200px; /* Prevent ultra-wide text blocks */
  margin: 0 auto;
}
```

**Grid Gaps:**
```css
.cards-container {
  gap: clamp(20px, 4vw, 40px);
}
```
- Mobile: 20px (compact)
- Desktop: 40px (spacious)

---

## 🚫 Common Mistakes to Avoid

### Visual Mistakes

❌ **Orange Overload** - Don't make everything orange. Use strategically.
❌ **Busy Backgrounds** - Jumper is clean and minimal, not cluttered.
❌ **Wrong Font** - Never substitute Haffer with generic sans-serif in final output.
❌ **Centered Paragraphs** - Only center hero titles, left-align body content.
❌ **Colorful Emojis** - Use 🏆 not 😀. Professional, not playful.
❌ **Playful Animations** - No bounces, wiggles, or cartoon effects.
❌ **Missing Logo** - Every deck needs Jumper branding (cover minimum).
❌ **Full-bleed Gradients with Gray Text** - Use Split Layout or Text Containers instead of forcing color overrides. Gray text (#C6CBD4, #9CA3AF, #6B7280) disappears on dark gradients.
❌ **Gradient Overuse** - Reserve split layouts and dramatic gradients for 2-3 slides maximum per deck (cover, closing, one hero slide).
❌ **Ignoring Mobile Stacking** - Split layouts must stack vertically on mobile. Test responsive behavior.

### Content Mistakes

❌ **Superlative Spam** - "Premium luxury exclusive world-class" = desperate
❌ **Vague Claims** - "Great results" → Be specific: "750 conversions at $0.42"
❌ **Salesy Tone** - "Buy now!" → "Let's schedule a call to discuss"
❌ **Hiding Problems** - Reports should honestly address challenges
❌ **Wall of Text** - One idea per slide, use visuals liberally

---

## 📞 Support & Resources

**Font Files:**
- Primary: `../fonts/HafferVF.ttf` (variable weights 400-900)
- Upright: `../fonts/HafferUprightVF.ttf`
- Italic: `../fonts/HafferItalicVF.ttf`

**Logo Files:**
- Light backgrounds: `../logos/jumper-black.png`
- Dark backgrounds: `../logos/jumper-white.png`
- Symbol only: `../logos/x-black.png`, `../logos/X-White.png`

**Gradient Files:**
- `../gradients/organic-01.png` through `../gradients/organic-06.png`

**Decision Hierarchy When Unsure:**
1. **Simpler is better** (remove decoration)
2. **More white space is better** (generous padding)
3. **Less color is better** (strategic orange)
4. **Professional over playful** (minimal animations)
5. **Substance over style** (data over design)

---

**Remember:** Jumper decks should feel like **Apple Keynote meets Data Dashboard** — minimal, impactful, trustworthy, data-driven.

---

**© 2025 Jumper Studio - Design System for Presentation Decks v1.0**
