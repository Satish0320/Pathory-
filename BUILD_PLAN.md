# Build Plan — Phase 1 execution sequence

This is the order Phase 1 (per `CLAUDE.md` §2) actually gets built in, and why that order. The product-level phases (1 through 5) in `docs/Pathory_Product_Blueprint.docx` describe *what* eventually gets built. This file describes *how Phase 1 itself gets sequenced* — each step below only starts once the one before it has a working, tested gate passed, because each genuinely depends on the data or infrastructure the previous step produced.

Check items off as they're completed. If a step is being started out of order, stop and ask why — it usually means a real dependency was missed, not that skipping ahead is fine this once.

---

## 1A — Foundation

Nothing else can be built on top of an app that doesn't have a working skeleton, auth, and a real deploy path.

- [x] Next.js project scaffolded matching `package.json` / `tsconfig.json`
- [x] Clerk wired per `.claude/skills/authentication/SKILL.md` — sign-up, sign-in, session middleware, `user.created` webhook creating the `User` row
- [x] `prisma/schema.prisma` migrated against a real Postgres instance (Neon)
- [x] Empty authenticated shell deployed to Vercel (per `.claude/skills/deployment-devops/SKILL.md`'s earliest-stage guidance)

**Gate:** a real person can sign up, sign in, and land on an empty authenticated screen — in production, not just localhost. Don't proceed to 1B until this is true; every later step assumes auth and deploy already work.

## 1B — Supercell API integration

- [x] `lib/coc-api/client.ts` built per `.claude/skills/coc-api-integration/SKILL.md` (retry/backoff, caching, typed errors)
- [x] Account sync: player tag input → fetch → store as a `Player` row linked to the signed-in `User`
- [x] Integration tests per `CLAUDE.md` §7 and the skill's testing section
- [x] Error states for every failure mode in `.claude/skills/error-states/SKILL.md`'s Supercell table

**Gate:** a real player tag syncs real troop/hero/Town Hall data into the database, and the known failure modes (rate limit, IP mismatch, bad tag, maintenance window) all produce the correct designed error state, not a crash.

## 1C — Base intake

- [ ] `lib/coc-api/base-link-decoder.ts` — pure function, tested against `fixtures/base-links/`
- [ ] Screenshot CV fallback wired to Roboflow per `.claude/rules/api.md`
- [ ] Low-confidence CV reads visibly flagged in the data shape (not just the UI later) per the same rule

**Gate:** a real base copy-link decodes to structured building data; a screenshot with no link available correctly falls back to CV and the result carries a confidence/source marker.

## 1D — Recommendation engine v0

- [ ] Rule-based reasoning engine per `.claude/skills/recommendation-engine/SKILL.md` — structured factors, not prose strings
- [ ] Confidence scoring that responds honestly to how much personal attack history exists
- [ ] Cold-start behavior (zero attacks logged) handled explicitly, not just left to produce a low number silently
- [ ] Unit tests covering every case listed in the skill's testing section

**Gate:** given a fixed account and a fixed base, the engine produces a deterministic, explainable recommendation with a confidence score that visibly reflects data volume.

## 1E — Attack plan screen

- [ ] Base overlay component, with `Skeleton`/loading treatment per `.claude/skills/interface-states/SKILL.md`
- [ ] Structured reasoning rendered as a readable list, not a wall of text
- [ ] Full pass against `.claude/skills/ui-ux-pro-max/SKILL.md` and `design/tokens.json` — this is the screen that most needs to not look like the existing competitor tools
- [ ] Accessibility pass per `.claude/skills/accessibility/SKILL.md` — text equivalent for the overlay, contrast, keyboard nav

**Gate:** the full attack-plan flow (paste base → see reasoned recommendation → view overlay) works end-to-end on a real phone screen, not just desktop, and passes an accessibility spot-check.

## 1F — Post-attack loop & skill profile

- [ ] Three-question self-report UI, optimistic submission per `.claude/skills/interface-states/SKILL.md`
- [ ] Mistake categorization feeding `SkillProfile` updates
- [ ] Dashboard (radar/trend charts) per `.claude/skills/dashboard-reporting/SKILL.md`, with `lib/reporting/` kept platform-agnostic

**Gate:** logging a real attack updates the skill profile and is visibly reflected on the dashboard within the same session — this is the loop that makes the app worth opening a second time.

## 1G — State & quality hardening pass

- [ ] Every screen built in 1A–1F checked against `.claude/skills/error-states/SKILL.md` and `.claude/skills/interface-states/SKILL.md` — loading, empty, error, success, disabled, all deliberate
- [ ] Full pass against `.claude/rules/code-quality.md`
- [ ] `code-reviewer` agent run against the accumulated diff, not just individual PRs

**Gate:** `code-reviewer` has no outstanding blockers across the whole Phase 1 surface.

## 1H — Compliance & security pass

- [ ] Fan Content Policy disclaimer present on every page per `.claude/rules/legal-compliance.md`
- [ ] Privacy Policy / ToS drafted and flagged for actual legal review — not shipped without one
- [ ] `security-auditor` and `compliance-reviewer` agents both run clean

**Gate:** `compliance-reviewer`'s pre-release checklist (see `.claude/agents/compliance-reviewer.md`) passes in full. This is a launch blocker per `CLAUDE.md` §9, not optional polish.

## 1I — Deployment hardening

- [ ] CI pipeline (lint, test, typecheck) per `.claude/skills/deployment-devops/SKILL.md`
- [ ] Staging environment with its own Supercell API token (never shared with production)
- [ ] Observability on the three signals that matter most here: Supercell 403 rate, base-decode failure rate, recommendation confidence distribution
- [ ] Resolve production 403s from Vercel's non-static outbound IP — the COC token is IP-locked (`.claude/rules/api.md` point 3) but Vercel's Hobby-tier egress IP changes per deployment, confirmed by hitting a diagnostic endpoint twice and getting two different IPs. A static-IP proxy (e.g. QuotaGuard, ~$19/mo, no free tier) is the standard fix; deferred until real usage justifies the cost — see BUILD_PLAN.md 1B's completion notes. Until resolved, account sync only reliably works against `localhost` (home IP), not production.

**Gate:** a bad deploy can be rolled back in one step, and the team (even a team of one) would actually find out if the Supercell token broke or the decoder started failing silently.

## 1J — Real-user validation

- [ ] Soft launch to your own clan first — the people most likely to give honest, immediate feedback
- [ ] Watch for actual weekly return usage, not just signups
- [ ] Only after this shows real, repeated use: revisit the blueprint's Phase 2 (War Room)

**This is the actual point of Phase 1.** Everything above exists to get here honestly. If people don't come back to it after a war, that's the signal to dig into why before building anything else — not a signal to add more features per `CLAUDE.md` §2.
