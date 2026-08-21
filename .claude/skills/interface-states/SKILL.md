---
name: interface-states
description: Use this skill when building any screen or component. Every piece of UI that fetches, submits, or computes something has at minimum four states — loading, empty, error, and success/populated — and each needs a deliberate design, not a default. Pairs with .claude/skills/error-states/SKILL.md, which covers the error state specifically in depth, and .claude/skills/dashboard-reporting/SKILL.md for chart-specific loading/empty/error components.
---

# Interface states — the full set, not just errors

A screen isn't done when the "happy path" (data loaded, everything worked) looks good. It's done when all of these have been deliberately designed:

## 1. Loading state

- **Match the loading indicator to the wait time.** Sub-300ms: no indicator at all (a flash of a spinner is worse than nothing). 300ms–2s: a lightweight spinner or inline indicator. 2s+: a skeleton screen that mirrors the actual layout about to load — this matters especially for the attack-plan screen, where the base image + overlay + reasoning list have a distinct shape worth previewing.
- **Use named, shared components — not a spinner reinvented per screen.** Build these once in `components/loaders/` and reuse everywhere:
  - `Skeleton` — generic block/text/avatar placeholder shapes, composed to match whatever layout is loading (base overlay skeleton, reasoning-list skeleton, history-row skeleton).
  - `Spinner` — small, for sub-2s waits and inline/button-level loading (e.g. a submit button's own loading state), never full-page.
  - `ProgressBar` — for waits with a knowable duration or step count (e.g. multi-step base analysis: decode → account sync → compute recommendation) — shows real progress, not an indeterminate spin, when the steps are actually known.
  - `InlineLoader` — small text-adjacent indicator for a single value refreshing in place (e.g. a stat updating) without disturbing surrounding layout.
  - Chart-specific loading/empty/error components (`ChartSkeleton`, `ChartEmptyState`, `ChartErrorState`) are covered in `.claude/skills/dashboard-reporting/SKILL.md` — use those for any chart, not the generic `Skeleton`/`Spinner` above.
- **The base overlay specifically** should use `Skeleton` shaped as a placeholder base outline while the recommendation computes — not `Spinner` covering the whole screen and hiding the layout the person is about to use.
- **Never a loading state with no escape.** If a load can hang (external CV inference call, a slow Supercell round-trip), show a timeout and fall back to an error state per `.claude/skills/error-states/SKILL.md` rather than spinning indefinitely.
- **Distinguish "loading fresh data" from "refreshing already-visible data."** Refetching a war status the person is already looking at shouldn't blank the screen and re-show a skeleton — use `InlineLoader` to update in place, not a jarring full reset.

## 2. Empty states — not the same as errors, and there are several distinct kinds

- **True first-use empty** (brand new player, zero attacks logged): this is a cold-start moment, not a failure. Say so plainly — "Log your first attack to start building your skill profile" — and give one clear next action, not a blank list with no explanation.
- **Cold-start recommendation** (per `.claude/skills/recommendation-engine/SKILL.md`): when a recommendation is based on general strategy fit rather than personal history, the empty-personal-data state should be visible in the UI itself, not just in the reasoning text — e.g., a visibly different treatment for "0 attacks logged" vs. "12 attacks logged" confidence framing.
- **Filtered-to-empty** (e.g., a history view filtered to a strategy the player has never used): distinguish this from true first-use — "No Hydra attacks yet" is different from "You haven't logged any attacks."
- **Search/lookup with no result** (invalid tag, base not found): this is closer to an error state — route it through `.claude/skills/error-states/SKILL.md`'s mapping table, not a generic empty state.

## 3. Success / populated state

- The default assumption for most design effort, but still worth being deliberate about **transitions into** this state — the base overlay animating in once the recommendation loads (per the motion guidance in `.claude/skills/ui-ux-pro-max/SKILL.md`) is part of this state's design, not a separate concern.
- **Partial success** is its own state, not success or error: e.g., the base decoded fine but the CV fallback had low confidence on a couple of buildings — show what succeeded clearly, flag the uncertain part specifically (per the "low-confidence read" note in `.claude/skills/error-states/SKILL.md`), don't silently present it as fully certain or fail the whole screen over a partial issue.

## 4. Disabled / not-yet-available state

- A control that can't be used yet (e.g., "Submit attack report" before the three questions are answered) should look and behave distinctly disabled — not just visually greyed with no explanation of what's missing.
- Distinguish "disabled because you haven't done X yet" (actionable, tell them what X is) from "disabled because this feature isn't available for your account" (e.g., a Town Hall level the recommendation engine doesn't support yet) — the second needs its own honest message, not a mysteriously dead button.

## 5. Optimistic UI — where it's appropriate here, and where it's not

- **Appropriate**: the post-attack self-report submission — show it as saved immediately, sync in the background, and only surface an error state if the sync actually fails. This keeps the quick 15-second report feeling instant, which matters for it actually getting used consistently.
- **Not appropriate**: the attack recommendation itself — never show a placeholder recommendation optimistically before the real computation finishes. A wrong-then-corrected strategy suggestion, even briefly, undermines trust in the one thing this product is for.

## State-transition checklist for any new screen

When building or reviewing a screen, confirm all of these have been explicitly considered, not defaulted to whatever the framework does automatically:
- [ ] Loading (with appropriate indicator for expected wait time)
- [ ] Empty (and which *kind* of empty, per above)
- [ ] Error (per `.claude/skills/error-states/SKILL.md`'s mapping table)
- [ ] Success/populated (including the transition into it)
- [ ] Disabled/unavailable, if the screen has any gated actions
- [ ] Partial success, if the screen has any multi-part data fetch (base decode + account sync + recommendation compute all failing independently is a real scenario here)
