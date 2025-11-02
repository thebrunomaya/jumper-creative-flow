# Koko Creative - Brand Design System

## 🎨 Visual Identity

**Brand Personality:** Young, Bold, Creative, Energetic, Playful
**Industry:** Creative Agency & Content Marketing
**Target Audience:** Young brands, startups, creative businesses (visual-first, trend-conscious)

### Core Colors
- **Primary (Koko Pink):** `#FF6B9D` / `hsl(344, 100%, 71%)`
  - Use EVERYWHERE - Koko loves color!
  - Headlines, accents, gradients, highlights

- **Secondary Palette (Mix freely!):**
  - Coral: `#FF8A80`
  - Purple: `#B388FF`
  - Yellow: `#FFD54F`
  - Teal: `#4DD0E1`

- **Background Philosophy:**
  - **EXPANSIVE:** Full-screen images, bold gradients
  - **COLORFUL:** Never just white - always add color
  - **LAYERED:** Glass morphism, overlays, depth

### Typography
**Primary Font:** Inter (Google Fonts)
- Headlines: `900` weight, `48-72px` - BOLD, energetic
- Subheadlines: `600` weight, `24-32px` - Clear but punchy
- Body: `400` weight, `18-20px` - Easy to read

**Font Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap" rel="stylesheet">
<style>
  body {
    font-family: 'Inter', -apple-system, sans-serif;
  }
</style>
```

---

## 📐 Layout Principles

### Background Philosophy
**EMBRACE COLOR AND IMAGERY. Koko is VIBRANT and VISUAL.**

✅ **DO USE:**
- Full-screen gradient backgrounds: `linear-gradient(135deg, #FF6B9D 0%, #B388FF 100%)`
- High-quality lifestyle images (with colored overlays)
- Multiple gradients per slide (mix 3+ colors)
- Animated gradient shifts
- Textures and patterns

❌ **DON'T USE:**
- Plain white backgrounds (boring!)
- Muted/gray tones
- Corporate-looking designs
- Too much minimalism (Koko is BOLD)

### Glass Morphism (Signature Style)
```css
.koko-glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.koko-glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Spacing & Rhythm
- **Bold spacing** - Big gaps between elements
- **Asymmetric layouts** - Not everything centered
- **Overlapping elements** - Cards can overlap backgrounds
- **Variable gaps:** `20px`, `32px`, `48px`, `64px`

---

## 🎬 Animation Standards

### Timing & Easing
- **Duration:** `0.3-0.4s` (FASTER than Jumper - energetic!)
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` - Slight bounce/spring
- **Stagger delays:** `0.15s` (quicker reveals)

### Animation Types
**Preferred:** Scale + Fade (explosive reveals)
```css
@keyframes koko-pop-in {
  from {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}
```

**Also Great:**
- Slide from sides (left/right)
- Rotation animations (subtle 5-10deg)
- Color gradient shifts
- Glow effects on hover

### Background Animations
```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-bg {
  background: linear-gradient(270deg, #FF6B9D, #B388FF, #FFD54F);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
```

---

## 📊 Dashboard-Specific Styling

### Metric Cards (Fun & Colorful)
```html
<div class="koko-metric-card" style="
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8A80 100%);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 12px 48px rgba(255, 107, 157, 0.3);
">
  <div style="color: #FFFFFF; font-size: 72px; font-weight: 900;">
    +128%
  </div>
  <div style="color: rgba(255, 255, 255, 0.9); font-size: 20px;">
    Crescimento ROAS
  </div>
</div>
```

### Performance Badges (Colorful!)
```html
<!-- Excellent (Green but vibrant) -->
<span class="koko-badge-excellent" style="
  background: linear-gradient(135deg, #4DD0E1, #26C6DA);
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(77, 208, 225, 0.4);
">🎉 Incrível!</span>

<!-- Warning (Still fun!) -->
<span class="koko-badge-warning" style="
  background: linear-gradient(135deg, #FFD54F, #FFCA28);
  color: #333;
">⚡ Atenção</span>
```

---

## 📋 Content Types & Templates

### 1. REPORTS (Sales, Traffic, Engagement)

**Structure:**
1. **Cover Slide:** Full-screen gradient + bold account name
2. **Celebration Metrics:** Giant numbers with emoji/icons
3. **Visual Charts:** Colorful graphs (not boring gray)
4. **Story Slides:** Image + text overlays (Instagram-style)
5. **Next Steps:** Energetic CTA with illustrations

**Tone:** Celebratory, optimistic, visual storytelling
**Visual Style:** Bold gradients, glass cards, emoji accents, icon illustrations

---

### 2. MEDIA PLANS (Launch, Optimization)

**Structure:**
1. **Cover:** Campaign name with lifestyle image background
2. **Strategy Board:** Colorful cards like Kanban board
3. **Budget:** Fun infographic style (not dry tables)
4. **Creative Mockups:** Large, prominent ad previews
5. **Timeline:** Calendar with colored milestones

**Tone:** Exciting, creative, collaborative
**Visual Style:** Kanban boards, colorful timelines, big imagery

---

### 3. PITCHES (New Clients, Upsells)

**Structure:**
1. **Hook:** Bold problem statement with dramatic visual
2. **Solution:** Before/after with vibrant colors
3. **Social Proof:** Instagram-style testimonial cards
4. **Portfolio:** Grid of work samples
5. **Let's Go!:** Energetic CTA (not boring "Contact Us")

**Tone:** Exciting, confident, let's-do-this energy
**Visual Style:** Bold contrasts, portfolio grids, energetic CTAs

---

## 🎯 How to Apply This Identity to Neutral Examples

When you receive a **neutral HTML example**, transform it into Koko style:

### Step 1: Add Vibrant Backgrounds
```css
/* Replace neutral backgrounds with: */
body, .slide {
  background: linear-gradient(135deg, #FF6B9D 0%, #B388FF 50%, #4DD0E1 100%);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}

/* OR add background image with overlay: */
.slide {
  background-image: url('../assets/backgrounds/lifestyle-01.jpg');
  background-size: cover;
  position: relative;
}

.slide::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.85), rgba(179, 136, 255, 0.85));
}
```

### Step 2: Apply Glass Morphism
```css
/* Wrap content in glass containers: */
.content-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Step 3: Colorize Everything
```css
/* Headlines with gradients: */
h1 {
  background: linear-gradient(90deg, #FF6B9D, #FFD54F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
}

/* Colored shadows: */
.card {
  box-shadow: 0 12px 48px rgba(255, 107, 157, 0.3);
}
```

### Step 4: Add Icons & Emoji
```html
<!-- Metrics with emoji: -->
<div class="metric-hero">
  🚀 <span>+128%</span>
</div>

<!-- Icons for sections: -->
<h2>📊 Resultados do Mês</h2>
<h2>🎯 Próximos Passos</h2>
```

### Step 5: Energize Animations
```css
/* Replace subtle animations with energetic ones: */
@keyframes koko-entrance {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.animate-in {
  animation: koko-entrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Step 6: Add Koko Logo
```html
<img src="../assets/logos/koko-logo.svg" alt="Koko Creative" style="
  width: 140px;
  filter: drop-shadow(0 4px 12px rgba(255, 107, 157, 0.4));
">
```

---

## ✅ Final Checklist

Before delivering a Koko-branded deck, verify:

- [ ] **Backgrounds:** Vibrant gradients or images (NO plain white!)
- [ ] **Glass Morphism:** Content in frosted glass containers
- [ ] **Colors:** Pink/purple/coral/yellow palette throughout
- [ ] **Typography:** Inter font, bold weights (900 for headlines)
- [ ] **Animations:** Energetic, springy (not too subtle)
- [ ] **Icons/Emoji:** Used generously for personality
- [ ] **Shadows:** Colored shadows (not just gray)
- [ ] **Logo:** Koko logo visible with glow effect
- [ ] **Mobile:** Still works on small screens
- [ ] **Energy Level:** Feels FUN (not corporate)

---

## 🚫 Common Mistakes to Avoid

❌ **Too Minimal:** Koko is NOT minimalist - add more color!
❌ **Corporate Look:** Avoid stiff, formal designs
❌ **Boring Backgrounds:** Never use plain white/gray
❌ **Subtle Animations:** Go bolder! Koko has energy
❌ **Grayscale Charts:** Everything should have color
❌ **Generic Icons:** Use fun, illustrated style
❌ **No Personality:** Add emoji, playful copy, energy

---

## 💡 Inspiration Keywords

When designing for Koko, think:
- **Instagram Stories** (not PowerPoint)
- **Startup Pitch Decks** (not corporate reports)
- **Music Festival Posters** (not business cards)
- **Y2K Aesthetics** (bright, fun, nostalgic)
- **Glassmorphism UI** (Dribbble trending)

---

## 📞 Brand Contact

If unsure about any design decision, default to:
- **More colorful is better**
- **Bolder is better**
- **More fun is better**
- **More visual is better**

---

**Remember:** Koko decks should feel like **Instagram Stories meets Startup Pitch Deck** - colorful, energetic, inspiring, fun!
