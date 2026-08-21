---
name: performance-optimization
description: Use this skill when a feature is functionally complete and being polished, or when real usage surfaces slowness. Not a pre-optimization checklist to apply while first building a feature — premature optimization here works against the "ship Phase 1, learn from real users" priority in CLAUDE.md.
---

# Performance for Pathory

## Where performance actually matters for this specific product

- **The attack-plan screen is used live, during an active war**, often with a countdown pressure the player feels. Slow-loading recommendations here directly undermine the product's value proposition — this is the one screen where perceived speed matters most, more than it does for, say, the skill-profile history view.
- **The base overlay image + annotation render** is the heaviest visual payload in the app. Optimize the base screenshot/image (compression, appropriate sizing, lazy-loading anything below the fold) before optimizing anything else visual.

## Practical guidance

- **Cache the Supercell API response, not just the UI.** Per `.claude/skills/coc-api-integration/SKILL.md`, most reads have a sensible TTL — this is a performance win as much as an API-courtesy one. A recommendation screen that has to wait on a live Supercell API round-trip on every load is both slower and closer to rate-limit trouble than one serving from a warm cache.
- **Recommendation computation should be fast enough to feel instant** (sub-second) once account and base data are already fetched — since it's rule-based in Phase 1 (per `.claude/skills/recommendation-engine/SKILL.md`), this should not require special optimization work; if it's slow, the likely cause is redundant data fetching, not the reasoning logic itself.
- **Next.js image optimization** (`next/image`) for the base screenshot and any overlay assets — don't ship unoptimized raster images to a screen most people load on mobile data during a war.
- **Don't block the UI on the CV fallback path.** Screenshot-based base analysis (the fallback, not the primary link-decoding path) is slower and calls an external inference service — show a clear loading state, and consider it acceptable for this path specifically to take a few seconds, since link-decoding should be the common case per `.claude/rules/api.md`.

## What not to over-invest in during Phase 1
- Don't build a CDN/edge-caching strategy for a pre-launch product with no real traffic yet — Vercel's defaults are enough until proven otherwise (see `.claude/skills/deployment-devops/SKILL.md`).
- Don't hand-optimize bundle size beyond standard Next.js practices (dynamic imports for genuinely heavy, rarely-used components) before there's a real Lighthouse/Core Web Vitals number showing it's a problem.
