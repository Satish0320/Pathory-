---
scope: "**/*.ts, **/*.tsx"
---

# Code quality standard

This is the bar every piece of code in this repo is held to, checked by the `code-reviewer` agent and by `BUILD_PLAN.md`'s 1G hardening pass. It expands on `CLAUDE.md` §6 rather than replacing it — that file has the project-specific rules (Supercell client discipline, structured reasoning data); this file has the general engineering discipline that applies everywhere.

## Comments — explain why, not what

- A comment restating what a line of code already says is noise, not documentation. `// increment i` above `i++` teaches nothing.
- Write a comment when the *reason* for a choice isn't obvious from the code itself: why this cache TTL and not another, why this edge case is handled the way it is, why a seemingly-simpler approach was rejected. Several existing skills model this well — `.claude/skills/coc-api-integration/SKILL.md` and `prisma/schema.prisma` both comment the reasoning behind non-obvious decisions, not the mechanics.
- If a piece of code exists *because* of a rule or skill elsewhere in `.claude/` (e.g. why the base-link decoder is a pure function, why an error message is worded a specific way), say so with a reference — `// see .claude/skills/error-states/SKILL.md` — so a future reader (including a future Claude session) knows where the constraint came from instead of assuming it's arbitrary and "cleaning it up."
- No commented-out dead code left in place "just in case." Delete it — git history is the record, not a comment block.
- No apologetic or narrating comments (`// TODO fix this hack`, `// I know this is ugly but`). If something is genuinely a shortcut that needs revisiting, say what specifically is wrong and what the real fix would be, so it's an actionable note, not a confession.

## No repetition — DRY as a default, not an afterthought

- If the same logic appears in two places, it belongs in one shared function, not two copies that will quietly drift apart the first time one gets fixed and the other doesn't.
- This project already has the right shared boundaries — use them rather than reaching around them:
  - Every Supercell API call goes through `lib/coc-api/client.ts` (`.claude/skills/coc-api-integration/SKILL.md`) — never a second, slightly-different fetch wrapper. This is enforced at review time by the `api-guardian` and `code-reviewer` agents, not by an ESLint rule — a `no-restricted-imports` pattern can't reliably catch a URL string inside a `fetch()` call, so don't add one to `eslint.config.mjs` expecting it to actually work; it would give false confidence instead of real enforcement.
  - Every loading/empty/error treatment uses the named components in `components/loaders/` and the chart-specific ones in `.claude/skills/dashboard-reporting/SKILL.md` — never a bespoke spinner invented per screen.
  - Every color/spacing/motion value comes from `design/tokens.json` — never a hardcoded hex or pixel value that duplicates (and can drift from) a token.
  - Every error message is written once, in the mapping tables in `.claude/skills/error-states/SKILL.md`, and referenced — not re-worded slightly differently at each call site.
- Before writing a new utility function, check `lib/` for something that already does this. Before writing a new UI pattern, check `components/` and the relevant skill first.

## Readability — code that doesn't fight the next person reading it

- Formatting is handled automatically by the `format-on-save` hook (Prettier/ESLint) — don't hand-format, don't fight the formatter's output.
- **Naming**: a variable, function, or component name should make its purpose obvious without needing the surrounding code to explain it. `getRecommendation(player, base)` over `process(p, b)`. This matters more than usual here because the recommendation engine's whole premise is explainability — code that mirrors that clarity is easier to trust.
- **Function size**: if a function is doing more than one clearly-nameable thing, split it. As a rough signal (not a hard rule to game): a function running past ~40–50 lines, or a component past the ~200-line guidance in `CLAUDE.md` §6, is usually doing two things that each deserve their own name.
- **Avoid deep nesting**: prefer early returns/guard clauses over pyramids of nested `if` blocks. Three or more levels of nesting is a signal to restructure, not a normal shape for this codebase's logic.
- **No magic numbers**: a bare `300`, `2000`, or hex color in component code should be a named constant or a token from `design/tokens.json` (which already defines the loading thresholds and palette) — not a number whose meaning only exists in the author's head at the time of writing.
- **Consistent patterns over clever ones**: prefer the boring, already-established pattern in this codebase over a novel one that's marginally shorter. A reviewer (human or the `code-reviewer` agent) should rarely be surprised by *how* something is written, even when *what* it does is new.

## Testing — not a separate pass, a property of "done"

`CLAUDE.md` §7 and §9 already set the bar (recommendation engine and API client get the most rigor; UI polish doesn't need blanket coverage). This section is the general discipline underneath that:

- Any new function with non-trivial logic (branching, calculation, parsing) gets a test alongside it in the same PR — not filed as a follow-up.
- Any bug fix adds a regression test that would have caught the bug, in the same PR as the fix. A bug fixed without a test protecting against its return isn't actually closed.
- Tests should read as documentation of intended behavior — a test named `handles player at loot cap without breaking stat display` tells a future reader what edge case matters and why, more than a generic `test case 3` would.
- Don't write tests that just re-assert the implementation (mocking so heavily that the test can't fail even if the logic is wrong) — test the actual behavior and edge cases called out in the relevant skill (see `.claude/skills/recommendation-engine/SKILL.md` and `.claude/skills/coc-api-integration/SKILL.md` for the specific required cases in those modules).

## What "not ugly" actually means here, concretely

"Ugly" isn't a matter of taste in this codebase — it cashes out to specific, checkable things: inconsistent naming across similar pieces of code, logic duplicated instead of shared, deeply nested conditionals, magic numbers instead of named/token values, and comments that explain nothing useful. Fixing those is what makes code "clean," not a subjective final pass.
