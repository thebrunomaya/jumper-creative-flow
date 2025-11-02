# Jumper Studio - Brand Design System

## 🎨 Visual Identity

**Brand Personality:** Technological, Professional, Innovative, Trustworthy
**Industry:** Digital Marketing & Advertising Technology
**Target Audience:** Marketing managers, business owners (non-technical, value-focused)

### Core Colors
- **Primary (Orange Hero):** `#FA4721` / `hsl(14, 95%, 55%)`
  - Use for: CTAs, hero metrics, key highlights, brand moments
  - Never overuse - strategic placement only

- **Neutral Base:**
  - Backgrounds: `#FFFFFF`, `#F5F5F5`, `#FAFAFA`
  - Text: `#1A1A1A` (headings), `#4A4A4A` (body)
  - Borders: `#E5E5E5`

- **Performance Indicators (from Dashboard System):**
  - Excellent: `#2AA876` (green) - Use when metrics are great
  - Good: `#3B82F6` (blue) - Use when metrics are solid
  - Warning: `#F59E0B` (amber) - Use for attention needed
  - Critical: `#EF4444` (red) - Use for issues/problems

### Typography
**Primary Font:** Haffer (brand font)
- Headlines: `900` weight, `clamp(36px, 5vw, 60px)` - Bold, impactful
- Subheadlines: `600` weight, `clamp(18px, 2.2vw, 24px)` - Clear hierarchy
- Body: `400` weight, `18-20px` - Readable, professional

**Font Loading:**
```html
<!-- Include in <head> -->
<link href="assets/fonts/Haffer.woff2" rel="preload" as="font" type="font/woff2" crossorigin>
<style>
  @font-face {
    font-family: 'Haffer';
    src: url('../assets/fonts/Haffer.woff2') format('woff2');
    font-weight: 400 900;
    font-display: swap;
  }
</style>
```

---

## 📐 Layout Principles

### Background Philosophy
**NEVER use bright, busy backgrounds. Jumper is CLEAN and MINIMAL.**

✅ **DO USE:**
- Pure white (`#FFFFFF`)
- Subtle gradients: `linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)`
- Light gray tones (`#FAFAFA`, `#F8F8F8`)
- Thin geometric patterns (very subtle)

❌ **DON'T USE:**
- Bright colors as backgrounds
- Heavy textures
- Full-image backgrounds (unless very muted overlay)
- Neon, vibrant gradients

### Spacing & Rhythm
- **Generous white space** - Let content breathe
- **Consistent gaps:** `16px`, `24px`, `32px`, `48px` (multiples of 8)
- **Max content width:** `1100px` (keep slides centered)
- **Safe zones:** `80px` top/bottom padding minimum

### Card/Panel Design
```css
.jumper-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.jumper-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
```

---

## 🎬 Animation Standards

### Timing & Easing
- **Duration:** `0.6s` (default), `0.4s` (quick), `0.8s` (dramatic)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` - Smooth, professional
- **Stagger delays:** `0.1s` between sequential elements

### Animation Types
**Preferred:** Fade + TranslateY (subtle upward reveal)
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
```

**Avoid:** Scale transforms, rotations, bounces (too playful for brand)

### Sequential Reveals
- Headline first (instant or 0.2s delay)
- Subheadline (0.3s delay)
- Content elements (0.4s+, staggered)
- Always user-controlled (spacebar/arrow keys)

---

## 📊 Dashboard-Specific Styling

### Metric Cards (Hero Numbers)
```html
<div class="metric-card">
  <div class="metric-value" style="color: #FA4721; font-size: 72px; font-weight: 900;">
    3.2x
  </div>
  <div class="metric-label" style="color: #4A4A4A; font-size: 18px;">
    ROAS
  </div>
  <div class="metric-performance excellent">
    <span>↑ 28%</span> vs. período anterior
  </div>
</div>
```

### Performance Badges
```html
<!-- Excellent -->
<span class="badge-excellent" style="
  background: rgba(42, 168, 118, 0.1);
  color: #2AA876;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
">Excelente</span>

<!-- Warning -->
<span class="badge-warning" style="
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
">Atenção</span>

<!-- Critical -->
<span class="badge-critical" style="
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
">Crítico</span>
```

---

## 📋 Content Types & Templates

### 1. REPORTS (Sales, Traffic, Engagement)

**Structure:**
1. **Cover Slide:** Account name + period + Jumper logo
2. **Executive Summary:** 3-4 hero metrics in large cards
3. **Performance Deep Dive:** Charts with performance indicators
4. **Key Insights:** Bullet points with metrics context
5. **Next Steps:** Clear action items

**Tone:** Professional, data-driven, confident
**Visual Style:** Clean charts, metric cards with colored badges, minimal decoration

---

### 2. MEDIA PLANS (Launch, Optimization)

**Structure:**
1. **Cover:** Campaign name + objectives
2. **Strategy Overview:** Timeline with milestones
3. **Budget Breakdown:** Clean tables with totals
4. **Creative Direction:** Mockups/placeholders for ads
5. **Timeline:** Gantt-style or calendar view

**Tone:** Strategic, organized, future-focused
**Visual Style:** Timelines, budget tables, calendar grids

---

### 3. PITCHES (New Clients, Upsells)

**Structure:**
1. **Problem Statement:** Bold headline with pain point
2. **Solution:** How Jumper solves it (tech angle)
3. **Social Proof:** Case studies, numbers, testimonials
4. **Proposal:** Pricing tiers, deliverables
5. **CTA:** "Let's Schedule a Call" (not pushy)

**Tone:** Opportunity-focused, authentic, value-driven
**Visual Style:** Bold headlines, before/after comparisons, pricing tables

---

## 🎯 How to Apply This Identity to Neutral Examples

When you receive a **neutral HTML example** (from `decks/examples/`), apply Jumper identity:

### Step 1: Replace Colors
```javascript
// Find and replace in HTML/CSS:
Primary colors → #FA4721 (Jumper Orange)
Background colors → #FFFFFF, #F5F5F5
Text colors → #1A1A1A (headlines), #4A4A4A (body)
```

### Step 2: Replace Typography
```css
/* Change font-family everywhere: */
font-family: 'Haffer', -apple-system, sans-serif;
```

### Step 3: Simplify Backgrounds
```css
/* If example has busy backgrounds, simplify: */
background: linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%);
/* OR */
background: #FFFFFF;
```

### Step 4: Add Jumper Logo
```html
<!-- Top-right or center of cover slide -->
<img src="../assets/logos/jumper-logo.svg" alt="Jumper Studio" class="brand-logo">

<style>
.brand-logo {
  width: 120px;
  height: auto;
  opacity: 0.9;
}
</style>
```

### Step 5: Apply Performance Colors (if report type)
```css
/* For metrics with performance levels: */
.metric-excellent { color: #2AA876; }
.metric-good { color: #3B82F6; }
.metric-warning { color: #F59E0B; }
.metric-critical { color: #EF4444; }
```

### Step 6: Polish Animations
- Keep subtle, professional (no bounces)
- Use fadeInUp pattern
- Sequential reveals via spacebar

---

## ✅ Final Checklist

Before delivering a Jumper-branded deck, verify:

- [ ] **Colors:** Orange (`#FA4721`) used strategically (not everywhere)
- [ ] **Backgrounds:** White/light gray only (no vibrant colors)
- [ ] **Typography:** Haffer font applied throughout
- [ ] **Logo:** Jumper logo visible (cover + footer optional)
- [ ] **Spacing:** Generous white space, not cramped
- [ ] **Animations:** Smooth, professional (0.6s cubic-bezier)
- [ ] **Performance Indicators:** Correct colors if report type
- [ ] **Mobile Responsive:** Test at 768px, 1024px, 1440px
- [ ] **Content Safe Zones:** No overflow, all text visible

---

## 🚫 Common Mistakes to Avoid

❌ **Orange Overload:** Don't make everything orange. Use strategically.
❌ **Busy Backgrounds:** Jumper = clean, not cluttered
❌ **Wrong Font:** Never substitute Haffer with generic sans-serif
❌ **Playful Animations:** No bounces, wiggles, or cartoon effects
❌ **Cramped Layouts:** Always prioritize white space
❌ **Missing Logo:** Every deck needs Jumper branding
❌ **Inconsistent Performance Colors:** Follow dashboard system exactly

---

## 📞 Brand Contact

If unsure about any design decision, default to:
- **Simpler is better**
- **More white space is better**
- **Less color is better**
- **Professional over playful**

---

**Remember:** Jumper decks should feel like **Apple Keynote meets Data Dashboard** - minimal, impactful, trustworthy.
