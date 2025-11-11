# General Design System

## Overview

Generic design system for brand-neutral presentations. This design system provides minimal guidelines to ensure templates remain self-contained and versatile.

---

## Typography

### Font Stack
- **Primary:** System fonts for maximum compatibility
- **Fallback:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Mono:** `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace`

### Font Weights
- **Light:** 300
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Black:** 900

### Type Scale
Templates define their own responsive typography using `clamp()` for fluid scaling.

**Recommended scale:**
- **Hero:** `clamp(48px, 8vw, 72px)`
- **H1:** `clamp(36px, 5vw, 54px)`
- **H2:** `clamp(28px, 4vw, 40px)`
- **H3:** `clamp(22px, 3vw, 32px)`
- **Body:** `clamp(16px, 2vw, 20px)`
- **Small:** `clamp(14px, 1.5vw, 16px)`

---

## Colors

### Philosophy
Templates are self-contained and define their own color palettes. No mandatory brand colors.

### Recommended Practices
- Use semantic color names (success, warning, danger, info)
- Ensure WCAG AA contrast ratios (4.5:1 for text)
- Consider dark mode compatibility
- Use CSS custom properties for theming

### Common Semantic Colors
```css
--color-success: #10b981;    /* Green */
--color-warning: #f59e0b;    /* Amber */
--color-danger:  #ef4444;    /* Red */
--color-info:    #3b82f6;    /* Blue */
```

---

## Layout

### Safe Zones
- **Minimum padding:** `40px` on all sides
- **Maximum content width:** `1200px`
- **Slide aspect ratio:** 16:9 (1920x1080)

### Grid System
Templates may use any grid system:
- CSS Grid (recommended)
- Flexbox
- Custom layouts

### Responsive Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

---

## Components

### Slide Structure
Each template defines its own slide patterns. Common patterns include:
- Cover slides
- Section headers
- Content slides (text, images, data)
- Comparison slides
- Timeline slides
- Closing slides

### Navigation
- **Scroll-based navigation** (recommended)
- **Keyboard shortcuts:** Arrow keys, Space
- **Touch gestures:** Swipe up/down

### Animations
Templates may include animations following these principles:
- **Duration:** 0.3s - 0.8s
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out)
- **Stagger:** 0.1s - 0.2s between elements
- **Reduce motion:** Respect `prefers-reduced-motion`

---

## Assets

### Logos
No mandatory logos for general identity. Templates are brand-neutral.

### Images
Templates may include:
- Background images
- Decorative graphics
- Icons
- Illustrations

All images should use absolute URLs for portability.

### Fonts
Templates use system fonts by default. Custom fonts are optional and should be embedded via:
```css
@font-face {
  font-family: 'CustomFont';
  src: url('https://example.com/font.woff2') format('woff2');
  font-display: swap;
}
```

---

## Best Practices

### Accessibility
- Maintain 4.5:1 contrast ratio for body text
- Maintain 3:1 contrast ratio for large text (18px+)
- Use semantic HTML (`<h1>`, `<h2>`, `<p>`, etc.)
- Provide alt text for images
- Ensure keyboard navigation works

### Performance
- Optimize images (use WebP when possible)
- Minimize CSS/JS file sizes
- Use CSS animations over JavaScript when possible
- Lazy load off-screen content

### Mobile Responsiveness
- Test on mobile devices (320px - 768px)
- Use responsive typography (clamp, viewport units)
- Ensure touch targets are at least 44x44px
- Stack content vertically on small screens

---

## Template Guidelines

### Self-Contained Templates
General templates should be completely self-contained:
- All styles embedded in `<style>` tag
- No external CSS dependencies
- Absolute URLs for any assets
- Works offline once loaded

### Naming Convention
General templates use prefix `general-`:
- `general-apple-minimal.html`
- `general-brutalist.html`
- `general-glassmorphism.html`

### File Structure
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation Title</title>
  <style>
    /* All styles here */
  </style>
</head>
<body>
  <!-- Presentation content -->
  <script>
    /* Navigation logic */
  </script>
</body>
</html>
```

---

## Usage Notes

### When to Use General Identity
- Brand-neutral presentations
- Internal documents
- Client-facing decks where brand flexibility is needed
- Multi-brand agencies

### Customization
Templates in the general category offer maximum creative freedom. Users can:
- Modify colors to match their brand
- Add custom logos via AI instructions
- Adjust typography in markdown content
- Override any template style via markdown metadata

---

## Support

For questions about general templates or design system:
- Check template documentation in `/templates/` directory
- Review individual template HTML for embedded guidelines
- Contact development team for custom template requests

---

**Last Updated:** 2025-01-11
**Version:** 1.0.0
