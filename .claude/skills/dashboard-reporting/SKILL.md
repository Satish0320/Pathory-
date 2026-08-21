---
name: dashboard-reporting
description: Use this skill when building the skill-profile dashboard, any chart, or any "report" screen — on web now, and on mobile once Phase 2 starts. Covers chart type selection, how trends are computed from existing data without new tables, loading/empty states specific to charts, accessibility, and structuring the code so mobile reuses the same logic instead of rebuilding it.
---

# Dashboards & reports

## The one dashboard that exists in Phase 1 — don't build more than this

Per `CLAUDE.md` §2, Phase 1's only dashboard is the **personal skill profile**: funnel/timing/cleanup/overall scores, recent mistake pattern, and confidence trend over time. Clan-level dashboards (War Room) and any cross-player reporting are Phase 2+ — this skill's guidance applies to those later too, but don't build their UI now.

**Scoped to one `Player` at a time, always.** Per `.claude/skills/authentication/SKILL.md`'s multi-account section, a `User` can have many `Player` accounts — the dashboard shows the currently-selected account's data only, never a blended view across accounts, unless a feature is deliberately built for that later. Switching the active account (the switcher UX described in that skill) re-scopes the whole dashboard, not just part of it.

## Chart type — match the shape of the question, not visual preference

**Library: [Recharts](https://recharts.org) v3 for web (Phase 1).** Chosen for solid TypeScript support, composability with Tailwind/React without fighting either, and because its declarative API keeps chart components small and readable per `.claude/rules/code-quality.md`. When Phase 2's mobile app is built, the equivalent will be a React Native-native charting library (e.g. Victory Native) — this is exactly why `lib/reporting/` (see below) stays free of any Recharts-specific types, so swapping the rendering layer later doesn't touch the data logic at all.

| What the player wants to know | Chart type | Why |
|---|---|---|
| "How is my funnel/timing/cleanup/spell-timing balance right now?" | Radar/spider chart | Multi-factor comparison at a single point in time — this is the natural shape for the four `SkillProfile` scores together |
| "Is my funnel score improving?" | Line chart, single metric over time | Trend is the point; don't multi-line this with all four scores at once, it becomes unreadable |
| "What are my most common mistakes?" | Horizontal bar, ranked | Categorical comparison (`mistakeCategory` frequency) — ranked bars read faster than a pie chart for this |
| "How many attacks have I logged, and what's my star distribution?" | Stacked or grouped bar | Volume + breakdown together |

Avoid: pie/donut charts for anything with more than 3–4 categories (the mistake-category breakdown can easily have 6), 3D chart effects, or any chart style that prioritizes looking impressive over being read in under 3 seconds on a phone screen.

## Computing trends — derive, don't duplicate

`prisma/schema.prisma`'s `SkillProfile` stores only the *current* aggregate scores — there is deliberately no historical snapshot table. Trend charts ("your funnel dropped from 79% to 62% this month") are computed on read by aggregating `Attack` rows over time (`createdAt`, `mistakeCategory`, `confidenceScore` are all already there per attack). Do not add a snapshot/history table to store this redundantly — it's a second source of truth that can drift from the underlying attack log, and the aggregation query is cheap at the data volumes this product will have for a long time. If a real performance need arises later (query getting slow at scale), that's a caching problem to solve with `.claude/skills/performance-optimization/SKILL.md`, not a schema-duplication problem to solve preemptively now.

## Loading, empty, and error states specific to charts — named components, not just prose

Per `.claude/skills/interface-states/SKILL.md`'s general rule (match the indicator to wait time), charts specifically need their own treatment because a generic spinner over empty axes looks broken, not loading:

- **`ChartSkeleton`** — a static placeholder shaped like the real chart (bars/lines at plausible-but-fake heights, low-opacity) shown while data fetches. Use for any chart expected to take 300ms+.
- **`InlineSpinner`** — small, for sub-chart elements (e.g., a single stat refreshing) where a full skeleton would be visually heavier than the thing it's replacing.
- **`ChartEmptyState`** — distinct from `ChartSkeleton`. Used when the query genuinely returned no data (cold-start player, filtered range with nothing in it) — not a loading treatment, an honest "not enough attacks logged yet to show a trend" message with a next action, per `.claude/skills/error-states/SKILL.md` and `.claude/skills/interface-states/SKILL.md`'s cold-start guidance.
- **`ChartErrorState`** — the query itself failed (not "no data," an actual fetch/compute error) — routes through the standard error-states mapping table, rendered in the chart's footprint rather than collapsing the whole dashboard.

Name and build these as actual shared components (`components/charts/ChartSkeleton.tsx` etc.) reused across every chart in the app, not redefined per-screen — this is what makes "loaders, spinners, etc." consistent instead of every screen inventing its own.

## Accessibility for charts

Per `.claude/skills/accessibility/SKILL.md`'s general rule (never color-only signal, always a text equivalent): every chart needs a data-table or plain-text summary alternative reachable by a screen reader, and the radar chart's four axes need distinguishable labels/patterns, not just four similarly-hued fills.

## Building once for web, reused on mobile (Phase 2)

Per `CLAUDE.md` §2, mobile is Phase 2 — but the data-shaping work for dashboards is worth structuring correctly now so it isn't rebuilt from scratch later:

- Keep **data aggregation logic** (the queries and calculations that turn raw `Attack` rows into chart-ready series) in `lib/reporting/`, completely separate from the chart-rendering components in `components/charts/`. `lib/reporting/` should be plain TypeScript with no React or web-only APIs — Phase 2's React Native app calls the same functions and only needs to swap the rendering layer (e.g. Victory Native or React Native SVG instead of a web charting library).
- Don't build this abstraction elaborately in Phase 1 — a clean function boundary (`getSkillTrend(playerId, dateRange) -> ChartSeries`) is enough. Over-engineering a cross-platform charting abstraction before there's a second platform to prove it against is exactly the kind of premature complexity `CLAUDE.md` §2 warns against.

## "Innovative" means legible and specific, not decorative

The most differentiated thing this dashboard can do isn't a fancier chart style — it's the same discipline as the recommendation engine: turn a number into a specific, actionable sentence. A radar chart showing "funnel: 62%" is a fact; "funnel: 62%, down from 79% last month — this tracks with 3 of your last 5 attacks being flagged as `poor_funnel`" is a report. Pull the sentence-generation pattern directly from `.claude/skills/recommendation-engine/SKILL.md`'s structured-reasoning approach rather than inventing a separate one for the dashboard.
