---
inclusion: manual
---

# Impeccable Design System v3.7.1

## Color
- Verify contrast. Body text ≥4.5:1; large text ≥3:1. Placeholder text same 4.5:1.
- Gray text on colored background looks washed out — use darker shade of bg's own hue.

## Typography
- Cap body line length at 65–75ch.
- Don't pair similar fonts. Pair on contrast axis (serif + sans, geometric + humanist).
- Hero heading max: clamp() ≤ 6rem. Letter-spacing floor: ≥ -0.04em.
- Use `text-wrap: balance` on h1–h3; `text-wrap: pretty` on long prose.

## Layout
- Vary spacing for rhythm.
- Cards only when truly best affordance. Nested cards = always wrong.
- Flexbox for 1D, Grid for 2D.
- Semantic z-index scale: dropdown → sticky → modal-backdrop → modal → toast → tooltip.

## Motion
- Intentional, not afterthought.
- Don't animate CSS layout properties unless needed.
- Ease out with exponential curves. No bounce, no elastic.
- Every animation needs `@media (prefers-reduced-motion: reduce)` alternative.
- Don't gate content visibility on class-triggered transitions.

## Interaction
- Dropdowns inside `overflow: hidden` will be clipped → use `<dialog>`, popover API, `position: fixed`, or portal.

## Absolute Bans
- **Side-stripe borders** — `border-left/right` > 1px as colored accent. Never.
- **Gradient text** — `background-clip: text` with gradient. Never.
- **Glassmorphism as default** — blur/glass decoratively. Rare and purposeful only.
- **Hero-metric template** — big number + small label + gradient accent. SaaS cliché.
- **Identical card grids** — same-sized icon+heading+text cards repeated.
- **Tiny uppercase tracked eyebrow above every section** — AI grammar, not voice.
- **Numbered section markers as default scaffolding** — 01/02/03 as reflex.
- **Text overflowing container** — test headings at every breakpoint.

## AI Slop Test
If someone could say "AI made that" without doubt → failed.
Run category-reflex check at two altitudes before shipping any design.

## KAT Journey Context
- App UI / product register (design SERVES the product)
- Vietnamese language
- Travel planning PWA — mobile-first, Fold-aware
- Existing brand: `#030D2E` ink, `#FFFDF8` warm bg, indigo-600 primary, emerald accents
- Tailwind CSS + HugeIcons + custom motion classes
