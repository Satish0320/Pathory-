---
name: ui-ux-pro-max
description: Use this skill for any Pathory screen, component, or visual design decision. Covers the product's design direction, what to avoid, and how the interface should feel across the recommendation flow, base overlay, and skill profile.
---

# Pathory — UI/UX direction

## The one-line brief
This should feel like a **coaching/analytics tool a serious athlete would use** — closer to a sports-performance dashboard than a mobile-game fan site. The person building this has already shipped Awwwards-caliber work (premium animation, kinetic typography, magnetic cursor); hold that same bar here, not the visual language of the existing COC/CR fan tools, which uniformly look like reskinned Bootstrap dashboards with orange gradients and default icon packs.

**`design/tokens.json` is the source of truth for actual color, type, spacing, and motion values** — the direction below explains the *why*; the token file has the real numbers. Tailwind config and any chart theme should derive from that file, not hardcode values that drift from it.

## Concrete direction

- **Palette:** dark, confident, low-saturation base (charcoal/deep navy) with a single sharp accent color used sparingly for calls-to-action and confidence scores — not the orange-on-cream palette every competitor app defaults to. Differentiate on sight.
- **Typography:** a strong, slightly technical display face for headings (numbers, confidence scores, skill percentages should feel like data, not decoration) paired with a clean, highly legible body face. Avoid anything that reads as "gaming font" (blocky, beveled, drop-shadowed) — that's the exact aesthetic every existing tool uses and it reads as amateur.
- **The base overlay is the hero visual.** The attack plan drawn onto the base image (entry arrows, funnel zones, freeze/rage targets) is the single most impressive thing this product does — it deserves the most design attention in the entire app. Treat it like a data visualization, not a doodle: clean vector arrows, a restrained color-coded legend, smooth reveal animation when the plan loads.
- **Confidence and reasoning are typography problems, not decoration problems.** "78% confidence" and the "why" explanation need clear visual hierarchy — the number should be scannable in under a second, the reasoning available on demand (expandable, not a wall of text always visible).
- **Motion:** purposeful, not decorative. The deployment sequence (King → Queen → main push → ability → cleanup) is a genuine use case for a "play strategy" animated sequence — this is where motion earns its place. Elsewhere, keep transitions fast and functional.

## What to avoid — specific, based on direct competitor review
- Orange/red gradient buttons and card borders (the default across nearly every existing COC tool)
- Generic Font Awesome / default icon-pack troop and building icons
- Dense data tables as the primary interface for the recommendation flow — tables are fine for the skill profile/history view, wrong for the moment a player is deciding what to attack
- Cluttered dashboards trying to show everything at once — the attack-plan screen has one job: tell the player what to do and why. Resist adding stats, ads, or unrelated widgets to that screen.

## Mobile-web responsiveness (Phase 1 is web, but must work on phones)
Most usage will happen on a phone during an active war, one-handed, often with limited attention. Design the attack-plan screen mobile-first: the recommendation and the base overlay must be legible and usable on a 6" screen before anything else is considered. Desktop is the enhancement, not the baseline, for this specific screen — even though the codebase is a web app, not a native app.

## Before building any new screen
1. Sketch the one primary action on that screen. If there are two competing primary actions, that's two screens.
2. Check this skill's palette/typography direction against what you're about to build.
3. If it looks like it could be a screenshot from ClashOS, War Report, or Clash of Stats, it's wrong — go back and push the visual language further.
