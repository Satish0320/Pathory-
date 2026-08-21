# Pathory

AI attack coaching for Clash of Clans. See `CLAUDE.md` for the full project brief and current phase scope, `BUILD_PLAN.md` for the actual build sequence within Phase 1, and `/docs/Pathory_Product_Blueprint.docx` for the complete product vision.

**Status: Phase 1 — core attack recommendation loop. Web app only, no mobile yet.**

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in COC_API_TOKEN and DATABASE_URL at minimum
npx prisma migrate dev
npx prisma generate           # Prisma 7+ no longer runs this automatically after migrate
npm run dev
```

Run `npm test` before considering the recommendation engine or API client done — see `CLAUDE.md` §7 and `fixtures/base-links/README.md` for what's expected.

You'll need:
- A Clash of Clans developer token from https://developer.clashofclans.com — note it's IP-locked, see `.claude/rules/api.md` before you spend time debugging a 403.
- A local Postgres instance (or update `DATABASE_URL` to point at one).

## Project structure

```
CLAUDE.md              -- read this first, always
CLAUDE.local.md         -- your personal notes, gitignored
.claude/
  rules/api.md            -- mandatory Supercell API policy
  rules/legal-compliance.md -- Fan Content Policy, trademark, data privacy
  skills/                 -- how-to guidance: API integration, recommendation engine,
                             UI/UX, dashboards/reports, error & interface states,
                             accessibility, performance, deployment
  agents/                  -- code-reviewer, api-guardian, security-auditor,
                             compliance-reviewer, debugger
  hooks/, commands/, output-styles/, settings.json
design/tokens.json       -- source of truth for color/type/spacing/motion values
prisma/schema.prisma     -- the shared data spine (Players, Attacks, SkillProfiles)
lib/coc-api/              -- the only place that should call the Supercell API
lib/recommendation-engine/ -- the core product logic
lib/reporting/             -- dashboard/chart data-shaping, reused by mobile in Phase 2
```

## Working with Claude Code on this repo

- `CLAUDE.md` §2 defines exactly what's in scope right now. If a suggestion (yours or Claude's) sounds like Phase 2+, it probably is — check before building it.
- Run `/commit` instead of writing commit messages by hand — it also flags scope creep in the diff before committing.
- Invoke the `security-auditor` agent before shipping anything touching auth, the API token, or player data storage.
