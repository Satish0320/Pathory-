---
name: deployment-devops
description: Use this skill once Phase 1 is functionally working and needs to move from local dev to a real, reliable deployment — CI/CD, containerization if needed, observability, and rollback safety. Not needed for early feature-building; relevant once the app has real users to not let down.
---

# Deployment & operations for Pathory

## Sequencing — don't reach for this too early

Phase 1's whole point is proving the core loop works and people return. Don't spend the first weeks building a Kubernetes cluster for an app with zero users. Start simple, add operational rigor as real usage demands it:

1. **Earliest stage:** Vercel deploy straight from `main` (or a `deploy` branch), managed Postgres (Vercel Postgres, Supabase, or RDS). This is enough for the first real users.
2. **Once there's a real user base and Phase 2 (War Room) is underway:** add CI (see below), staging environment, and basic observability.
3. **Only if genuinely outgrowing Vercel** (background job needs, cost, or specific AWS integration needs): consider containerizing the API layer for AWS App Runner/ECS — this matches existing AWS familiarity, but it's a step up in operational complexity that should be justified by an actual need, not defaulted to because it's familiar.

## CI (GitHub Actions) — add once the codebase has more than one contributor or more than a few weeks of history

Minimum useful pipeline on every PR:
- `npm run lint`
- `npm run test` (per `CLAUDE.md` §7 — this must not be skippable for changes touching `lib/recommendation-engine/` or `lib/coc-api/`)
- `npx tsc --noEmit` (typecheck without emitting, catches type errors CI-side that a fast local edit might miss)
- `npx prisma validate` if the schema changed

Don't add deploy-on-merge automation until there's a rollback plan (see below) — automating deployment before automating safe rollback is how a bad merge becomes a bad Saturday.

## Environment separation

- `dev` (local), `staging` (mirrors prod, used for testing against a real but non-production Supercell API token and database), `production`.
- **Never share a Supercell API token between staging and production.** Rate limits are per-token; a staging load test can eat production's rate-limit budget if they share a key.
- Secrets live in the hosting platform's secret manager (Vercel env vars, AWS Secrets Manager), never in a committed file — see `.gitignore` and `.env.example`.

## Observability — what actually matters for this product

Generic "add Sentry and call it done" advice undersells what this app specifically needs to watch:

- **Supercell API health**: rate-limit proximity (are we close to the ceiling?), 403 rate (token/IP issues), 503 rate (Supercell maintenance windows). Alert on sustained 403s specifically — that's the IP-lock issue in `.claude/rules/api.md`, and it will silently break every recommendation if unnoticed.
- **Recommendation engine confidence distribution** — if average confidence scores drift sharply, that's a signal something in the reasoning weights or input data changed, not just a metrics curiosity.
- **Base-link decode failure rate** — a spike here likely means Supercell changed the link format (see `.claude/skills/coc-api-integration/SKILL.md`) and the decoder needs an update, not a generic bug hunt.
- Standard stuff too (error rates, latency, uptime) — but the three above are the ones generic dashboards won't surface for you automatically.

## Rollback safety

- Database migrations must be written to be reversible where practical (Prisma migrate supports this) — a bad migration on `Attack` or `SkillProfile` data is expensive to unwind by hand.
- Keep the previous deployment one click away from re-promotion (Vercel does this by default) before adding any deploy automation that removes that safety net.
