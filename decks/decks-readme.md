# Jumper Presentation Builder

AI-powered presentation creation system for **Jumper Studio clients**, transforming reports, plans, and pitches into beautiful, Apple-inspired HTML presentations.

---

## 🎯 Overview

This system creates professional, data-driven presentations for Jumper Studio clients by combining:
- **Content** (performance reports, marketing plans, sales pitches)
- **Identity** (Jumper or Koko brand design systems)
- **Inspiration** (30+ template styles)

**Result:** Stunning HTML presentations with animations, responsive design, and strategic visual storytelling.

---

## 📁 Project Structure

```
decks/
├── input/                      # 📥 INPUT: Your content goes here
│   ├── report-oct.md           # Performance reports
│   ├── plan-q4-2025.md         # Marketing plans
│   └── pitch-new-client.md     # Sales pitches
│
├── output/                     # 📤 OUTPUT: Generated presentations
│   ├── google-ads-report-oct24-30.html
│   ├── marketing-plan-black-friday.html
│   └── pitch-ecommerce-client.html
│
├── examples/                   # 🎨 TEMPLATES: Style inspirations
│   ├── apple-minimal.html      # Clean, professional (RECOMMENDED)
│   ├── jumper-dark-premium.html
│   ├── modern-saas-dark.html
│   └── [30+ other styles]
│
├── identities/                 # 🎨 BRANDS: Design systems
│   ├── jumper/
│   │   ├── design-system.md    # Jumper brand guidelines
│   │   ├── fonts/              # Haffer VF
│   │   ├── logos/              # Black/White variants
│   │   └── gradients/          # 7 organic backgrounds
│   └── koko/
│       └── design-system.md    # Koko brand guidelines
│
├── decks.md                    # 🤖 Claude's design instructions
└── decks-readme.md             # 📖 This file (user guide)
```

---

## 🚀 Quick Start

### **Step 1: Prepare Your Content**

Place your content in the `input/` folder:

```markdown
# WEEKLY REPORT - GOOGLE ADS
**Period: October 24 to October 30, 2025**

## Consolidated Results
- Spend: $318.43 (+114% vs previous)
- Conversions: 750 (+174%)
- Cost/conversion: $0.42 (↓22%)
...
```

**Save as:** `input/report-oct.md`

---

### **Step 2: Choose Deck Type**

Select based on your objective:

| Deck Type | Purpose | Typical Use Case |
|-----------|---------|------------------|
| **report** | Performance reviews | Weekly/monthly client updates |
| **plan** | Marketing plans | Budget approval, quarterly planning |
| **pitch** | Sales presentations | New business, RFP responses |

---

### **Step 3: Choose Identity**

| Identity | Use For | Assets |
|----------|---------|--------|
| **jumper** | All Jumper client deliverables | Orange #FA4721, Haffer font, organic gradients |
| **koko** | [Check with team] | TBD |

---

### **Step 4: Choose Template Inspiration**

Browse `examples/` folder for style inspiration:

**For Reports:**
- `apple-minimal.html` - Clean, professional ⭐ RECOMMENDED
- `jumper-stats-focus.html` - Metrics-heavy
- `modern-saas-dark.html` - Dark mode, tech-forward

**For Plans:**
- `jumper-dark-premium.html` - High-end, strategic
- `modern-tech-startup.html` - Forward-looking
- `apple-minimal.html` - Content-focused

**For Pitches:**
- `cluely-3d-style.html` - Bold, attention-grabbing
- `modern-saas-dark.html` - Professional, tech-savvy
- `brutalist.html` - Edgy, memorable (use with caution)

---

### **Step 5: Generate Presentation**

Open Claude Code and use this command:

```
Create a report deck using Jumper identity, inspired by apple-minimal.html, from atulado.md
```

**Command Template:**
```
Create a [report|plan|pitch] deck using [Jumper|Koko] identity, inspired by [template].html, from [input-file].md
```

**Result:** HTML presentation saved to `output/[descriptive-name].html`

---

## 📊 Deck Types Explained

### **1. Reports (Performance Reviews)**

**What it is:** Weekly/monthly performance updates showing results, insights, and next steps

**Structure (7 slides):**
1. Cover (period, account name)
2. Executive Summary (hero metrics with badges)
3. Strategic Context (major decisions, changes)
4. Performance Deep Dive (charts, comparisons, trends)
5. Key Insights (what worked, what didn't)
6. Areas to Monitor (challenges, warnings)
7. Next Steps (actionable recommendations)

**Data to Include:**
- Metrics with comparisons (vs previous, vs goal)
- Performance color coding (excellent/good/warning/critical)
- 5-week trajectories showing progress
- Market/campaign breakdowns
- Conversion rates, cost metrics

**Example Content File:**
```markdown
# WEEKLY REPORT - CLIENT NAME
Period: Oct 1-7, 2025

## Results
- Conversions: 750 (+174%)
- Cost/conv: $0.42 (↓22%)

## Top Markets
- Colombia: 172 conv (23%)
- Panama: 130 conv (17%) ⭐ Best efficiency
...
```

---

### **2. Plans (Marketing Plans)**

**What it is:** Strategic proposals for budget approval, campaign launches, quarterly planning

**Structure (7 slides):**
1. Cover (plan name, objectives)
2. Strategic Overview (market context, approach)
3. Timeline (phases, milestones, Gantt-style)
4. Budget Breakdown (channel allocation tables)
5. Tactical Execution (campaigns, creative themes)
6. Success Metrics (KPIs, targets)
7. Next Steps (approval timeline, kick-off)

**Data to Include:**
- Budget tables (channel × period matrix)
- Timeline with dependencies
- Target projections (based on benchmarks)
- Resource allocation (team, tools, partners)
- Historical performance context

**Example Content File:**
```markdown
# Q4 MARKETING PLAN - CLIENT NAME
Period: Oct-Dec 2025

## Strategic Overview
- Objective: 3x pipeline in Q4
- Budget: $50K reallocated from Display to Search
- Timeline: 12 weeks (3 phases)

## Budget Breakdown
| Channel | Oct | Nov | Dec | Total |
|---------|-----|-----|-----|-------|
| Search  | $15K| $18K| $17K| $50K  |
| Display | $8K | $7K | $5K | $20K  |
...
```

---

### **3. Pitches (Sales Presentations)**

**What it is:** New business proposals demonstrating Jumper's value to win clients

**Structure (7 slides):**
1. Cover (prospect company name)
2. Problem Statement (client's challenge)
3. Solution (how Jumper solves uniquely)
4. Our Process (methodology, tech, team)
5. Social Proof (case studies with numbers)
6. Proposal (pricing, deliverables, timeline)
7. CTA (schedule strategy call)

**Data to Include:**
- Before/after case study results
- Client testimonials (verified, specific)
- Pricing tables (transparent breakdown)
- Industry benchmarks (positioning)
- Team credentials (if relevant)

**Example Content File:**
```markdown
# PARTNERSHIP PROPOSAL - PROSPECT NAME
Date: Nov 2, 2025

## Your Challenge
You're stuck between expensive agencies ($10K/mo) and inexperienced freelancers.

## Our Solution
Data-driven optimization delivers consistent 20%+ improvements.

## Proven Results
- Client A: 79% efficiency gain in 5 weeks
- Client B: 3x conversions with same budget
...
```

---

## 🎨 Identity Selection Guide

### **Jumper Studio**

**When to Use:** All Jumper client deliverables (default choice)

**Brand Assets:**
- **Colors:** Orange #FA4721 (strategic highlights), Grays (dominant)
- **Font:** Haffer VF (variable font, 400-900 weights)
- **Gradients:** 7 organic backgrounds (use sparingly)
- **Logos:** Black for light backgrounds, White for dark

**Design System:** `/identities/jumper/design-system.md`

**Tone:** Sophisticated minimalism, data-driven, honest about challenges

---

### **Koko**

**When to Use:** [Check with team - TBD]

**Brand Assets:** [See `/identities/koko/design-system.md`]

---

## 📚 Template Examples Catalog

Browse `examples/` folder for 30+ styles. Here are the top picks:

### **Clean & Professional (Reports)**
- `apple-minimal.html` ⭐ Most popular
- `minimalist-clean.html`
- `jumper-minimal.html`

### **Data-Heavy (Reports with Lots of Charts)**
- `jumper-stats-focus.html`
- `modern-saas-dark.html`

### **Strategic & Premium (Plans)**
- `jumper-dark-premium.html`
- `modern-tech-startup.html`

### **Bold & Attention-Grabbing (Pitches)**
- `cluely-3d-style.html`
- `brutalist.html` (use with caution)
- `cyberpunk-neon.html` (not corporate)

### **Colorful & Vibrant**
- `simple-colors-style.html`
- `white-with-pops-of-color.html`

### **Dark Mode**
- `dark-mode-pro.html`
- `dark-glowing-style.html`

### **Experimental (Fun, Not Corporate)**
- `retro-synthwave.html`
- `old-video-game.html`
- `memphis-design.html`

---

## 🎯 Best Practices

### **Content Writing**

**Reports:**
- Start with hero metrics (big wins upfront)
- Be honest about challenges (builds trust)
- Use 5-week trajectories to show progress
- End with concrete action items (not generic)

**Plans:**
- Lead with strategic context (why this approach?)
- Show budget allocation visually (tables + charts)
- Include realistic timelines with dependencies
- Address potential objections proactively

**Pitches:**
- Research prospect's challenges beforehand
- Lead with their problem, not your solution
- Use real case studies with specific numbers
- Price transparently (builds trust)
- CTA should feel natural, not pushy

---

### **Style Selection**

| Content Mood | Recommended Templates |
|--------------|----------------------|
| **Professional & Clean** | apple-minimal, minimalist-clean |
| **Data-Heavy** | jumper-stats-focus, modern-saas-dark |
| **Strategic & Premium** | jumper-dark-premium, modern-tech-startup |
| **Bold & Modern** | cluely-3d-style, brutalist |
| **Dark & Tech-Forward** | dark-mode-pro, dark-glowing-style |

**Match style to:**
- Content mood (urgent, educational, opportunity-focused)
- Audience (conservative vs innovative clients)
- Brand identity (Jumper vs Koko)

---

### **Iteration**

1. Generate presentation using Claude
2. Review in browser (use arrow keys to navigate)
3. Note what to adjust (too dense? Wrong colors?)
4. Update `decks.md` with specific refinements
5. Regenerate with adjustments

**Pro Tip:** Build a library of your favorite examples over time.

---

## 📋 Presentation Features

Each generated presentation includes:

- ✅ **Responsive Design:** Works on desktop, tablet, mobile
- ✅ **Keyboard Navigation:** Arrow keys (←/→) and spacebar
- ✅ **Sequential Animations:** Content reveals step-by-step
- ✅ **Professional Typography:** Apple-inspired, clean hierarchy
- ✅ **Color Psychology:** Strategic use of red (problems), green (solutions), orange (highlights)
- ✅ **Performance Indicators:** Color-coded badges (excellent/good/warning/critical)
- ✅ **Actionable CTAs:** Closing slides drive next steps

---

## 🔧 Technical Details

Presentations are built with:
- **Pure HTML/CSS/JavaScript** (no dependencies, no build step)
- **CSS animations** with cubic-bezier easing
- **Flexbox and Grid** layouts (responsive, mobile-first)
- **Custom animation sequencing** (user-controlled with spacebar)
- **Touch/swipe support** for mobile presentations

**File Size:** Typically 20-50KB per presentation (fast loading)

---

## 💡 Pro Tips

### **For Complex Data**
- Use "dense" slide layouts (automatically applied)
- Split into multiple slides if >12 elements
- Leverage comparison grids (side-by-side)

### **For Storytelling**
- Use progressive reveals (builds anticipation)
- Animate charts and numbers (visual interest)
- Color-code timeline events (positive/negative)

### **For Performance**
- Use gradients sparingly (2-3 per deck)
- Compress images before adding to identities
- Test on multiple devices (1920x1080, 1440x900, mobile)

### **For Branding**
- Always read identity's design-system.md first
- Match colors to performance context (green=wins, amber=warnings)
- Use identity-specific assets (fonts, logos, gradients)

---

## 🤝 Need Help?

**Common Issues:**

1. **"Content is cut off"**
   - Reduce elements per slide (<12 items)
   - Use dense typography (automatic for heavy slides)
   - Split into multiple slides

2. **"Colors don't match Jumper brand"**
   - Verify reading `/identities/jumper/design-system.md`
   - Check asset paths are correct
   - Orange should be strategic (not overused)

3. **"Animations not working"**
   - Open presentation in modern browser (Chrome, Safari, Firefox)
   - Use spacebar or arrow keys to trigger
   - Check JavaScript console for errors

4. **"Template style not applying"**
   - Verify template filename in command
   - Check `examples/` folder for available templates
   - Try `apple-minimal.html` as baseline

---

## 📖 Additional Resources

- **Design Guidelines:** `/decks.md` (Claude's full instructions)
- **Jumper Design System:** `/identities/jumper/design-system.md`
- **Koko Design System:** `/identities/koko/design-system.md`
- **Template Gallery:** Browse `/examples/` folder

---

## 📝 Version History

**v2.0 (November 2025)** - Jumper Studio Integration
- Added identity system (Jumper/Koko)
- Defined 3 deck types (reports/plans/pitches)
- Restructured folders (input/output)
- B2B client focus (not YouTube)

**v1.0 (October 2024)** - Initial YouTube Presentation Builder
- Original system by Zane Schulberg

---

**Maintained by:** Jumper Studio Design Team
**Powered by:** Claude Code + Anthropic AI
**License:** Internal use for Jumper Studio clients

---

## 🎯 Quick Reference Card

**Workflow:**
1. Content → `input/[name].md`
2. Choose: Type (report|plan|pitch) + Identity (jumper|koko) + Template (examples/)
3. Command: "Create a [type] deck using [identity] identity, inspired by [template].html"
4. Result → `output/[name].html`

**Deck Types:**
- **report** = Performance reviews (weekly/monthly)
- **plan** = Marketing plans (budget approval, quarterly)
- **pitch** = Sales presentations (new business, RFPs)

**Identities:**
- **jumper** = Jumper Studio brand (orange, Haffer font, organic gradients)
- **koko** = [Check design-system.md]

**Top Templates:**
- Reports: `apple-minimal.html`, `jumper-stats-focus.html`
- Plans: `jumper-dark-premium.html`, `modern-tech-startup.html`
- Pitches: `cluely-3d-style.html`, `modern-saas-dark.html`
