# CLAUDE.md

This file is the first thing you read in every session. It is the source of truth for what Pathory is, what phase we're in, and how to build it. If anything in a conversation conflicts with this file, this file wins unless the person explicitly tells you to update it — and if they do, update it, don't just follow the one-off instruction silently.

---

## 1. What this project is

**Pathory** is an AI coaching and clan-intelligence platform for Clash of Clans (and later Clash Royale). The core idea: existing tools (stat trackers, base-link libraries) tell players what happened. Pathory tells them what to do next, why, and whether they're actually improving.

The full product vision — every feature, every persona, every phase — lives in `/docs/Pathory_Product_Blueprint.docx`. Read it once at project start. **Do not build from your own idea of what a "Clash of Clans app" should have.** Build from the blueprint and this file only.

**`BUILD_PLAN.md` is the actual build order for Phase 1** — sub-phases 1A through 1J, each with a completion gate, sequenced by real dependency (auth before data, data before recommendations, recommendations before UI polish, polish before compliance/deploy hardening). Check it before starting new work to confirm you're not building something whose dependency hasn't landed yet.

The core loop, restated because it drives every architecture decision:
`Base intake → Account-aware reasoning → Attack plan with explanation → Post-attack self-report → Skill profile update → Sharper next recommendation`

---

## 2. Current phase — read this before writing any code

We are in **Phase 1** of the blueprint's 5-phase roadmap. Phase 1 is the entire scope right now.

**In scope for Phase 1:**
- Base intake via copy-link decoding (primary) with screenshot CV as fallback
- Player account sync via official Clash of Clans API
- Attack recommendation engine with plain-English reasoning + confidence score
- Visual deployment overlay on the base image
- Post-attack self-report (3 quick questions, not video/replay analysis)
- Personal skill profile + mistake log that updates from self-reports

**Explicitly out of scope until Phase 1 is proven with real returning users — do not build these even if they seem easy or fun to add:**
- Clan War Room, shareable debrief cards (Phase 2)
- Builder/upgrade tracker, freebie notifications, TH-normalized rankings, rivalry memory, training mode (Phase 3)
- Anything Clash Royale (Phase 4)
- Community features, global leaderboards, Discord bot, creator tools (Phase 5)
- **Any form of automated video/replay analysis.** There is no official replay data feed for Clash of Clans. Frame-by-frame attack analysis from screen recordings is a hard, unsolved computer-vision problem — do not attempt it, do not stub it out "for later" in a way that implies it's coming soon. The post-attack loop is self-report only. See `.claude/rules/api.md`.

**If you notice an opportunity to add a Phase 2+ feature "while you're in there":** don't. Flag it as a suggestion in your response instead. Scope discipline is a first-class requirement of this project, not a nice-to-have — the person building this has a documented pattern of generating ambitious scope quickly, so your job is to be the thing that holds the line, not the thing that agrees with the next exciting idea.

**Platform for Phase 1: responsive web app.** Not native mobile. Reasoning: works on every device with zero app-store approval friction, updates instantly, and is where AI-assisted coding is strongest right now — this was the person's own conclusion from independent research, not just mine. Mobile (Phase 2, likely React Native/Expo reusing the same API layer) comes only after the web core has real, returning users.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS | Matches existing stack fluency; SSR helps SEO for the eventual public-facing base/strategy pages |
| Backend | Next.js API routes for v1; extract to a separate Fastify service only if/when a background job (API polling, recommendation batch jobs) genuinely needs to run independently of request/response | Don't split services prematurely — one deployable is simpler until proven insufficient |
| Database | PostgreSQL + Prisma | Structured relational data (players, bases, attacks, skill profiles) with clear foreign keys — this is not a document-store shaped problem |
| Auth | **Clerk** — decided, not open. Web via `@clerk/nextjs`, mobile (Phase 2) via `@clerk/expo`. One identity system, native sign-in UI on both iOS and Android, Apple Sign-In built in. Player identity is separate from the in-game player tag; never treat a player tag as an auth credential (it's public data, anyone can query it) | Only auth provider evaluated with genuine first-class support for exactly this combination — Next.js web today, Expo/React Native iOS+Android in Phase 2 — without maintaining two separate auth systems. See `.claude/skills/authentication/SKILL.md` |
| Mobile (Phase 2, not built yet) | React Native via Expo, sharing `lib/reporting/` and other platform-agnostic logic with the web app per §4 | Matches the auth choice above; don't start this until Phase 1 has real returning web users, per §2 |
| Hosting | Vercel for the Next.js app; AWS (RDS/ap-south-1) for Postgres if outgrowing a managed Postgres provider | Consistent with existing AWS familiarity, but don't reach for AWS App Runner/ECR complexity until Vercel + managed Postgres genuinely isn't enough |
| Image/CV work | Roboflow-hosted inference (or a fine-tune of the existing public "Clash of Clans base recognition" model) for the screenshot-fallback path — do not train a base-detection model from scratch | See `.claude/rules/api.md` |

Do not introduce a new major dependency (new database, new framework, new cloud service) without stating in your response why the current stack is insufficient for the specific task. Default to the table above.

The schema in `prisma/schema.prisma` is the current implementation of the data-spine principle in §4 below — check it before assuming a new table or field is needed. Required environment variables are documented in `.env.example`; keep that file in sync whenever a new secret or config value is introduced. Base project config (`next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.mjs`, `.prettierrc`) is already in place — `tailwind.config.ts` derives its theme directly from `design/tokens.json`, so a design change happens in the tokens file, never by hand-editing the Tailwind config.

---

## 4. Architecture principle — the shared data spine

Every feature in the blueprint runs off one data model: **player account, attack history, clan history.** Even though only Phase 1 is being built now, design the database schema so Phase 2/3 features (war room, rivalry memory, rankings) can be built as *read models over this same data* later, not as a schema migration that reshapes Phase 1 tables. Concretely:

- An `attacks` table row must contain everything needed to later compute a war-room rollup (clan_tag, war_tag if applicable, outcome, strategy_used) even though no war-room UI exists yet.
- A `players` table row must be keyed by the official player tag, not an internal-only ID that would need reconciliation later.
- **One signed-in `User` commonly holds many `Player` accounts** — plan for real scale here (competitive players routinely have a dozen or more between war, farming, and pushing accounts), not just two or three as an edge case. Every recommendation, skill profile, and dashboard is scoped to a single `Player`, never blended across a `User`'s accounts. See `.claude/skills/authentication/SKILL.md`.
- Don't build Phase 2+ UI or endpoints. Do keep the schema honest about the data Phase 2+ will need.
- Dashboard/report data-shaping logic lives in `lib/reporting/` as plain TypeScript, separate from `components/charts/` rendering — see `.claude/skills/dashboard-reporting/SKILL.md`. This is what lets the Phase 2 mobile app reuse the same trend calculations instead of rebuilding them.

---

## 5. Before you write code, check these

- `.claude/rules/api.md` — mandatory reading before touching anything that calls the Clash of Clans API or handles base data. This is not optional context; API misuse here can get a token revoked or violate Supercell's Fan Content Policy.
- `.claude/rules/legal-compliance.md` — mandatory reading before touching any user-facing surface, any new data collection, or any monetization. Covers the Fan Content Policy disclaimer requirement, trademark usage, and data privacy obligations. This is the file that determines whether the app is allowed to exist in its current form — treat it with matching seriousness.
- `.claude/rules/code-quality.md` — the enforced standard for comments, avoiding repetition, readability, and testing. Applies to every file, every time — not a separate cleanup pass at the end.
- `.claude/skills/authentication/SKILL.md` — mandatory reading before touching sign-in, sign-up, session handling, or the `User`/`Player` relationship. Auth is decided (Clerk, web and mobile) — this skill covers implementation, not the choice itself.
- `.claude/skills/coc-api-integration/SKILL.md` — implementation patterns for the API client layer (retry/backoff, caching TTLs, testing approach) — read alongside `.claude/rules/api.md`, which is the policy this skill implements.
- `.claude/skills/ui-ux-pro-max/SKILL.md` — design direction. This product should look like a premium sports-analytics tool (think a coaching dashboard), not a fan-site with orange gradients and clashing icon packs. Read before building any screen. Actual values (color, type, spacing, motion) live in `design/tokens.json` — that file is the source of truth, this skill is the reasoning behind it.
- `.claude/skills/recommendation-engine/SKILL.md` — mandatory reading before touching `lib/recommendation-engine/`. This is the core value proposition; it gets more rigor than any other module, including how reasoning must be structured, how confidence scores are computed honestly, and how the post-attack mistake log feeds back in.
- `.claude/skills/dashboard-reporting/SKILL.md` — use for the skill-profile dashboard and any chart or report screen, on web now and mobile later. Covers chart selection, computing trends from existing `Attack` data without new tables, chart-specific loading/empty/error components, and structuring the code so Phase 2's mobile app reuses the same data logic.
- `.claude/skills/accessibility/SKILL.md` — use when building or reviewing any UI component, especially the base overlay, which is a visual-only interface unless deliberately built otherwise.
- `.claude/skills/error-states/SKILL.md` — use for any code that can fail. Every error a person sees must state what happened, why, and one clear next action — never a raw error code, stack trace, or backend detail.
- `.claude/skills/interface-states/SKILL.md` — use for any screen or component. Loading, empty, error, success, and disabled are each a deliberate design decision, not a framework default — check this before considering a screen done. Named shared loading components (`Skeleton`, `Spinner`, `ProgressBar`, `InlineLoader`) live under `components/loaders/` — reuse them, don't reinvent per screen.
- `.claude/skills/performance-optimization/SKILL.md` — use once a feature is functionally complete and being polished, not while first building it.
- `.claude/skills/deployment-devops/SKILL.md` — use once Phase 1 is working locally and needs a real, reliable deployment; not needed for early feature-building.
- `/mnt/skills/public/frontend-design/SKILL.md` if available in your environment — use alongside the project-specific skill above, not instead of it.

**Subagents available — invoke them, don't just simulate their judgment inline:**
- `code-reviewer` — general scope, quality, and design-direction review before considering a feature done
- `api-guardian` — specialist check on anything touching `lib/coc-api/`, rate limiting, caching, or the base-link decoder
- `security-auditor` — invoke before shipping anything touching auth, the Supercell token, or player data storage; this product holds real people's account and performance data, treat it accordingly
- `compliance-reviewer` — invoke before any public release and any time a new user-facing surface, new data collection, or new monetization is added; enforces `.claude/rules/legal-compliance.md`
- `debugger` — invoke when something's broken and the cause isn't obvious, rather than guess-and-check in the main conversation

---

## 6. Code standards

Project-specific rules below. General engineering discipline — comments, avoiding repetition, readability, naming, function size — is in `.claude/rules/code-quality.md` and applies everywhere alongside these.

- TypeScript strict mode. No `any` without a comment explaining why it's unavoidable.
- Every API route that touches the Supercell API must go through the shared client in `lib/coc-api/` — never call `developer.clashofclans.com` directly from a route handler. This is how rate-limiting, caching, and retry logic stay centralized instead of duplicated and inconsistently applied.
- Server-only secrets (API tokens) never appear in client components, `NEXT_PUBLIC_*` env vars, or committed files. See `.gitignore`.
- Prefer small, composable components. If a component file exceeds ~200 lines, it's probably doing two things.
- Write the reasoning behind the attack recommendation as data (a structured list of factors), not as a single pre-baked string — the UI needs to render it, and future features (confidence calibration, "why not X" alternatives) need to query it.

## 7. Testing

General testing discipline (when a test is required, what a good test looks like, the regression-test rule for bug fixes) is in `.claude/rules/code-quality.md`. The project-specific bar:

- Unit tests for anything in `lib/recommendation-engine/` — this is the core value proposition; it must be tested more rigorously than any other part of the codebase. See `.claude/skills/recommendation-engine/SKILL.md` §"Testing this module specifically" for the required cases.
- Integration test for the full Supercell API client covering: rate-limit backoff, IP-lock token failure, malformed player tag, player above the 2B loot-counter cap (see `.claude/rules/api.md`).
- No test coverage requirement for UI polish/styling changes — don't over-test presentation.

## 8. Git conventions

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- No direct commits to `main` — feature branches, even solo. This project is meant to last; build the habit now.
- Never commit `.env`, `CLAUDE.local.md`, or anything under `.claude/settings.local.json`.

## 9. What "done" means for a Phase 1 feature

A feature is done when: it works end-to-end with a real base and a real player tag (not mock data), it's covered by the test standards in §7 where applicable, it has designed loading/empty/error/success states per `.claude/skills/interface-states/SKILL.md` and `.claude/skills/error-states/SKILL.md` — not just a happy-path demo — it does not silently expand scope beyond what §2 lists as in-scope, and — for anything user-facing — it satisfies `.claude/rules/legal-compliance.md` (disclaimer present, no Supercell-asset reuse, no unnecessary data collection). If you're unsure whether something is in scope or compliant, say so in your response rather than building it and asking forgiveness.

Before the first real public release specifically, run through `.claude/agents/compliance-reviewer.md`'s checklist in full — this is a launch blocker, not a nice-to-have polish item.
