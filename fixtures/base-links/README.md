# Base-link fixtures

Referenced by `.claude/skills/coc-api-integration/SKILL.md` — the base-link decoder needs a fixture set of known-good copy-links to test against, since the format isn't officially documented and can shift when Supercell ships new buildings.

**Scope note (2026-08-21):** investigation during `BUILD_PLAN.md` 1C found that a copy-link does not locally encode building positions — see `.claude/rules/api.md`'s correction. These fixtures only need to verify the decoder correctly extracts **Town Hall level, base type (`WB`/`HV`), and layout slot** — not building data, since the decoder never claims to produce that.

## What to add here

One `.json` file per Town Hall level you're supporting at launch (start with TH11–TH17, since that's where most active war/CWL players sit), each containing:

```json
{
  "townHall": 14,
  "copyLink": "<a real, current copy-link for a TH14 base you control or have permission to use>",
  "expectedBaseType": "warBase",
  "expectedLayoutSlot": 1,
  "notes": "where this base came from, when it was captured"
}
```

## Where to get real links

- Your own base(s) and alt accounts — the most reliable source, and you know the ground truth.
- Bases shared voluntarily in your own clan for practice/analysis (standard practice, common in competitive clans).
- Do not scrape third-party base-link sites for fixtures — pull a small, deliberate set you can verify by hand instead of importing bulk data you can't confirm is accurate.

## Keep this set small and deliberately maintained

5–10 verified fixtures across TH levels is enough to catch a decoder regression. This isn't meant to be a production base database — that's a different concern (and out of Phase 1 scope per `CLAUDE.md` §2) from having enough ground-truth data to know the decoder still works after a change.
