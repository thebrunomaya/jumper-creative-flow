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
   - Path to content file in `/public/decks/input/[filename].md`
   - Example: `atulado.md`

4. **Template Inspiration** (optional):
   - Choose from `/public/decks/examples/[template].html`
   - Recommended for reports: `apple-minimal.html`, `jumper-stats-focus.html`
   - Recommended for plans: `jumper-dark-premium.html`, `modern-tech-startup.html`
   - Recommended for pitches: `cluely-3d-style.html`, `modern-saas-dark.html`
   - Default: `apple-minimal.html`

### Step 2: Generation Process

**MANDATORY ORDER:**

1. ✅ Read `/public/decks/identities/[identity]/design-system.md` (source of truth for brand)
2. ✅ Read `/public/decks/input/[filename].md` (content to present)
3. ✅ Read `/public/decks/examples/[template].html` (inspiration only, if specified)
4. ✅ Read `/public/decks/decks.md` (presentation creation guidelines)
5. ✅ Generate presentation following all guidelines
6. ✅ **Determine output filename** (see Step 2.1 below)
7. ✅ Save to `/public/decks/output/[generated-filename].html`

#### Step 2.1: Output Filename Generation (MANDATORY)

**NAMING PATTERN:**
```
[type]-[client-slug]-[YYYYMMDD][-vN].html
```

**Process:**

1. **Extract client name from markdown content:**
   - Read the first H1 heading (line starting with `#`) from input markdown
   - OR read the title/company name from the content front matter
   - Example from markdown: `# Moldura Minuto - Relatório de Performance` → Extract "Moldura Minuto"
   - Example from markdown: `**Acme Corp | Q4 2025**` → Extract "Acme Corp"

2. **Generate client slug:**
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters (keep only a-z, 0-9, hyphens)
   - Examples:
     - "Moldura Minuto" → "molduraminuto"
     - "Acme Corp" → "acme-corp"
     - "Startup XYZ!" → "startup-xyz"

3. **Format today's date:**
   - Use YYYYMMDD format (year, month, day with zero-padding)
   - Example: November 3, 2025 → "20251103"
   - Example: January 5, 2026 → "20260105"

4. **Check for duplicates:**
   - Check if `/public/decks/output/[type]-[client-slug]-[YYYYMMDD].html` already exists
   - If exists, try `-v2`, then `-v3`, `-v4`, etc. until finding unique filename
   - Maximum 10 versions (if all taken, ask user for manual name)

5. **Final filename examples:**
   - `report-molduraminuto-20251103.html`
   - `plan-acme-corp-20251215-v2.html`
   - `pitch-startup-xyz-20260110.html`

**Validation:**
- ✅ Filename must be all lowercase
- ✅ No spaces or special characters (only a-z, 0-9, hyphens, dots)
- ✅ Must match pattern: `[type]-[client]-[date][-vN].html`
- ✅ Confirm filename to user before saving

### Step 3: Quality Checklist

Before finalizing, verify:

- [ ] All colors/fonts from `design-system.md` applied correctly
- [ ] Responsive design (mobile-first, works on all screen sizes)
- [ ] Sequential animations (parent first, then children)
- [ ] Safe zone rules (padding limits, no content cutoff)
- [ ] Typography hierarchy (strict clamp() values)
- [ ] Sufficient slide expansion (10-20 slides for reports, not compressed)
- [ ] Color psychology applied (red=problems, green=solutions, cyan=technology)

### Step 3: Output

Confirm completion with:
- File path: `/public/decks/output/[type]-[client]-[YYYYMMDD].html` (e.g., `report-molduraminuto-20251103.html`)
- Slide count
- Key features applied (gradients used, animations, visualizations)
- Next steps (open in browser, iterate if needed)

## Example Usage

```
/deck report jumper molduraminuto.md apple-minimal.html
```

**Process:**
1. Reads `/public/decks/input/molduraminuto.md`
2. Extracts client name "Moldura Minuto" from markdown
3. Generates slug "molduraminuto"
4. Formats today's date (e.g., "20251103")
5. Checks for duplicates, creates `-v2` if needed
6. **Saves to:** `/public/decks/output/report-molduraminuto-20251103.html`

This generates a report deck using Jumper identity, inspired by apple-minimal.html, with automatic filename generation.

## Notes

- **Generic guide + Brand specifics**: `decks.md` teaches HOW, `design-system.md` defines WHAT
- **Clarity over brevity**: Expand complex data into multiple slides
- **Preserve Zane Cole Formula**: Hook → Validate → Opportunity → Proof → Urgency → Help
- **Identity is mandatory**: ALWAYS read design-system.md FIRST before generating
