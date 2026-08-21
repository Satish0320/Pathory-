---
name: coc-api-integration
description: Use this skill when writing or modifying the Clash of Clans / Clash Royale API client, caching layer, or anything in lib/coc-api or lib/cr-api. Provides implementation patterns, not policy — see .claude/rules/api.md for the mandatory rules this skill implements.
---

# Building the Supercell API client layer

This skill covers *how* to implement what `.claude/rules/api.md` requires. Read that file first — it's policy; this is pattern.

## Client structure

```
lib/coc-api/
  client.ts          -- single fetch wrapper: auth header, retry/backoff, rate-limit tracking
  cache.ts            -- TTL-based cache (Redis in prod, in-memory Map in dev is fine for Phase 1)
  types.ts             -- typed responses for player, clan, war, warlog endpoints
  base-link-decoder.ts -- isolated, independently testable
  errors.ts            -- typed error classes: RateLimitError, InvalidTagError, TokenIPMismatchError, SupercellMaintenanceError
```

Every route handler or server action calls `client.ts` functions — never raw `fetch("https://api.clashofclans.com/...")` scattered across the codebase. This is the single point where rate-limit compliance and caching are guaranteed to apply.

## Retry/backoff pattern

```ts
// Pseudocode shape, not literal — adapt to actual client
async function fetchWithBackoff(url: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 429 && attempt <= 3) {
    const retryAfter = res.headers.get("retry-after");
    await sleep(retryAfter ? Number(retryAfter) * 1000 : attempt * 500);
    return fetchWithBackoff(url, attempt + 1);
  }
  if (res.status === 403) throw new TokenIPMismatchError();
  if (res.status === 503) throw new SupercellMaintenanceError();
  return res;
}
```

## Caching guidance by endpoint type

| Data | Suggested TTL | Why |
|---|---|---|
| Player profile (troop/hero levels) | 10–15 min | Changes only on upgrade completion, which is hours/days apart |
| Clan info / roster | 10 min | Roster changes aren't second-to-second |
| Current war state | 2–5 min | Needs to feel current during an active war without hammering the API |
| War log (historical) | 1 hour+ | Immutable once a war ends |

Cache invalidation on write isn't applicable here — this is a read-only external API, so TTL expiry is the only invalidation mechanism. Don't over-engineer this.

## Batch-syncing multiple accounts for one user

The API token is shared across every user of the app, not per-user — a single person syncing many accounts at once is a real load spike against a budget everyone else also depends on. This is a common case here, not an edge case: see `.claude/skills/authentication/SKILL.md`'s multi-account section for why (competitive players commonly hold a dozen or more accounts).

- Queue and stagger a multi-account sync (small delay between each account's fetch) rather than firing every account's request concurrently the moment a user opens their account list.
- Use the same per-endpoint TTLs above for every account, including alts — don't shorten caching just because a user has many accounts; if anything, alt accounts checked less frequently can tolerate the existing TTLs fine.
- Expose per-account sync status (queued/syncing/done/stale) to the UI so a 14-account sync reads as visible, incremental progress — not one long blocking wait. This pairs directly with the account-switcher UX in `.claude/skills/authentication/SKILL.md`.

## Testing the client

Mock the Supercell API at the HTTP layer (msw or similar), not by stubbing your own client functions — this catches real response-shape mismatches. Required test cases:
- Happy path player fetch
- 429 triggers backoff and eventually succeeds
- 403 raises `TokenIPMismatchError` distinctly (not a generic error) so the UI/ops layer can alert on token issues specifically
- 404 (bad tag) surfaces a user-facing "check the tag" message, not a raw stack trace
- Player with loot counters at the 2B cap doesn't break downstream calculations that assume the number is still incrementing accurately

## Base-link decoder

Keep this as a pure function: `decodeBaseLink(link: string) => DecodedBaseLink | null`. No API calls inside it, no side effects — this makes it trivially unit-testable against a fixture set of known-good links across several Town Hall levels. When Supercell ships a new building or the link format shifts (it has happened before), this is the one function that needs updating, and isolation means that update doesn't ripple through the rest of the app.

**Scope correction (see `.claude/rules/api.md`'s 2026-08-21 entry):** this function only recovers TH level, base type (`WB`/`HV`), and layout slot from the link string — it cannot and must not claim to extract building positions, since those aren't locally encoded in the link at all. Use it as a cheap validity/TH-match check alongside CV-derived building data, not as an alternative source of the same data.
