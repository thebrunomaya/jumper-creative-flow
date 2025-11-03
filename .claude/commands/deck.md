# /deck - Jumper Presentation Builder

Generate professional HTML presentations for Jumper Studio clients.

## Instructions

You are about to create a presentation using the Jumper Presentation Builder system.

### Step 1: Gather Information

Ask the user for the following (if not already provided in the command arguments):

1. **Deck Type** (required):
   - `report` - Performance reviews (weekly/monthly client updates)
   - `plan` - Marketing plans (budget approval, quarterly planning)
   - `pitch` - Sales presentations (new business, RFP responses)

2. **Identity** (required):
   - `jumper` - Jumper Studio brand (orange, Haffer font, organic gradients)
   - `koko` - Koko brand (check design-system.md)

3. **Input File** (required):
   - Path to content file in `/decks/input/[filename].md`
   - Example: `atulado.md`

4. **Template Inspiration** (optional):
   - Choose from `/decks/examples/[template].html`
   - Recommended for reports: `apple-minimal.html`, `jumper-stats-focus.html`
   - Recommended for plans: `jumper-dark-premium.html`, `modern-tech-startup.html`
   - Recommended for pitches: `cluely-3d-style.html`, `modern-saas-dark.html`
   - Default: `apple-minimal.html`

### Step 2: Generation Process

**MANDATORY ORDER:**

1. ✅ Read `/decks/identities/[identity]/design-system.md` (source of truth for brand)
2. ✅ Read `/decks/input/[filename].md` (content to present)
3. ✅ Read `/decks/examples/[template].html` (inspiration only, if specified)
4. ✅ Read `/decks/decks.md` (presentation creation guidelines)
5. ✅ Generate presentation following all guidelines
6. ✅ Save to `/decks/output/[descriptive-name].html`

### Step 3: Quality Checklist

Before finalizing, verify:

- [ ] All colors/fonts from `design-system.md` applied correctly
- [ ] Responsive design (mobile-first, works on all screen sizes)
- [ ] Sequential animations (parent first, then children)
- [ ] Safe zone rules (padding limits, no content cutoff)
- [ ] Typography hierarchy (strict clamp() values)
- [ ] Sufficient slide expansion (10-20 slides for reports, not compressed)
- [ ] Color psychology applied (red=problems, green=solutions, cyan=technology)

### Step 4: Output

Confirm completion with:
- File path: `/decks/output/[name].html`
- Slide count
- Key features applied (gradients used, animations, visualizations)
- Next steps (open in browser, iterate if needed)

## Example Usage

```
/deck report jumper atulado.md apple-minimal.html
```

This generates a report deck using Jumper identity, inspired by apple-minimal.html, from atulado.md.

## Notes

- **Generic guide + Brand specifics**: `decks.md` teaches HOW, `design-system.md` defines WHAT
- **Clarity over brevity**: Expand complex data into multiple slides
- **Preserve Zane Cole Formula**: Hook → Validate → Opportunity → Proof → Urgency → Help
- **Identity is mandatory**: ALWAYS read design-system.md FIRST before generating
