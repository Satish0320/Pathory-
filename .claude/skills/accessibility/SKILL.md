---
name: accessibility
description: Use this skill when building or reviewing any UI component, especially the attack-plan screen, base overlay, and forms. Accessibility is a first-class requirement, not a post-launch pass — many competitive players use screen magnification or colorblind-mode assistance, and the base overlay in particular is a visual-only interface by default unless deliberately made otherwise.
---

# Accessibility for Pathory

## Why this matters more than usual for this specific product

The base overlay (arrows, deployment zones, freeze/rage targets drawn on the base image) is the single most visually-dependent screen in the app — and it's also the screen carrying the most critical information a player acts on. A purely visual overlay with no text equivalent locks out anyone with low vision or colorblindness from the app's core value, not a peripheral feature.

## Concrete requirements

- **Color is never the only signal.** Deployment zones, freeze/rage targets, and the funnel path must be distinguishable by shape/label/pattern in addition to color — roughly 1 in 12 men have some form of color vision deficiency, and red/green (a likely palette choice for "danger zone" / "safe entry") is the single most common confusion pair.
- **Every visual instruction has a text equivalent.** The structured reasoning factors from `.claude/skills/recommendation-engine/SKILL.md` already exist as data — render them as an accessible, screen-reader-navigable list alongside the overlay, not only as canvas/SVG annotations a screen reader can't parse.
- **Confidence scores and stats need sufficient contrast** — check against WCAG AA minimums (4.5:1 for normal text, 3:1 for large text/UI components), especially given the dark palette direction in `.claude/skills/ui-ux-pro-max/SKILL.md` — dark themes are easy to accidentally under-contrast.
- **Keyboard navigability** for the full attack-plan flow — base upload, viewing the recommendation, submitting the post-attack self-report. Don't assume touch/mouse-only interaction even though most usage is mobile-web.
- **Form labels, not just placeholders**, on the post-attack self-report inputs — a placeholder that disappears on focus is not an accessible label.
- **Respect `prefers-reduced-motion`** for the "play strategy" animated deployment sequence — offer a static step-through as the alternative, not just a slower animation.

## When to check this skill
Any time a new screen or component is built, not just at a pre-launch audit pass — retrofitting accessibility into a visually-dense screen like the base overlay is significantly harder than building it in from the start.
