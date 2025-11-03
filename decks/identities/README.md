# Brand Identities Structure

This directory contains brand-specific design systems and components for presentation decks.

## 📂 Standard Identity Structure

Each brand identity should follow this structure:

```
/decks/identities/{brand-name}/
├── design-system.md        # Complete design system documentation
├── fonts/                  # Brand-specific typography files
├── logos/                  # Logo variations (black, white, symbol)
├── gradients/              # Background gradient images
└── sections/               # Reusable slide sections/patterns
    ├── pattern-name-1.html
    ├── pattern-name-2.html
    └── ...
```

### 📋 Folder Purposes

**`/fonts/`**
- Custom typefaces used in presentations
- Variable font files (.ttf, .woff2)

**`/logos/`**
- Logo variations for different backgrounds
- Symbol-only versions
- Multiple formats (PNG, SVG)

**`/gradients/`**
- Background gradient images
- Named as `organic-01.png`, `organic-02.png`, etc.

**`/sections/`** ⭐ **NEW**
- Reusable slide section patterns
- Single-slide HTML demos
- NOT full presentation examples
- Examples: split layouts, text containers, specific components

**`design-system.md`**
- Complete brand guidelines
- Color palette, typography, components
- Usage examples and best practices
- References to files in other folders

---

## 🆚 `/sections/` vs `/decks/examples/`

**Use `/identities/{brand}/sections/`** for:
- ✅ Brand-specific layout patterns
- ✅ Single-slide component demos
- ✅ Implementation references for design system
- ✅ Building blocks for real decks

**Use `/decks/examples/`** for:
- ✅ Complete multi-slide presentation examples
- ✅ Full deck templates showing various styles
- ✅ Inspiration galleries (Brutalist, Cyberpunk, Apple-style, etc.)
- ✅ NOT brand-specific, more about aesthetic styles

---

## 🎨 Example: Jumper Identity

```
/decks/identities/jumper/
├── design-system.md
├── fonts/
│   ├── HafferVF.ttf
│   ├── HafferUprightVF.ttf
│   └── HafferItalicVF.ttf
├── logos/
│   ├── jumper-black.png
│   ├── jumper-white.png
│   ├── x-black.png
│   └── X-White.png
├── gradients/
│   ├── organic-01.png (4.2MB)
│   ├── organic-02.png (1.4MB)
│   ├── organic-03.png (392KB)
│   ├── organic-04.png (571KB)
│   ├── organic-05.png (693KB)
│   └── organic-06.png (615KB)
└── sections/
    ├── split-layout-gradient-right.html   # Cover slide pattern
    ├── split-layout-gradient-left.html    # Closing slide pattern
    └── text-containers-on-gradient.html   # Timeline/data pattern
```

---

## ➕ Adding New Sections

When creating new reusable patterns for a brand:

1. **Create HTML file** in `/identities/{brand}/sections/`
2. **Name descriptively:** `{pattern-purpose}-{variant}.html`
3. **Self-contained CSS:** No external dependencies except brand assets
4. **Include info panel:** Explain when/how to use
5. **Reference in design-system.md:** If part of official guidelines

**Example naming:**
- `hero-centered-text.html`
- `data-comparison-cards.html`
- `timeline-vertical.html`
- `quote-testimonial.html`

---

## 🔗 Related Documentation

- `/decks/examples/` - Full presentation examples (not brand-specific)
- `/decks/identities/{brand}/design-system.md` - Brand guidelines
- `/decks/README.md` - Overall decks system documentation

---

**Last Updated:** November 2025
