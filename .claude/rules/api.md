---
scope: "lib/coc-api/**, lib/cr-api/**, app/api/**, lib/recommendation-engine/**"
---

# Supercell API rules — Clash of Clans & Clash Royale

This rule loads automatically for any file touching the API layer. It exists because getting this wrong has real consequences: a revoked token, a rate-limit ban, or a feature built on data that doesn't actually exist.

## Hard facts about the official API — do not assume otherwise

1. **No replay or battle-event data exists for Clash of Clans.** The API exposes player/clan/war metadata (stars, destruction %, hero levels, war logs) — nothing about what happened during an attack frame-by-frame. Never write code, a schema, or a UI element that implies this data is available or "coming soon." The post-attack loop is self-report, permanently, until proven otherwise by an actual API change.
2. **Clash Royale's API does expose a battle log** — this is a genuine difference from COC, don't assume feature parity between the two games' data availability when Phase 4 (CR) starts.
3. **Tokens are IP-locked.** A token generated for one IP will fail (403) if requests originate from a different IP. This matters a lot on serverless/edge deployments where the outbound IP can rotate. Either pin a static outbound IP (NAT gateway / fixed egress) or build token-refresh handling into the client — don't just retry blindly on 403, because retrying won't fix an IP mismatch.
4. **Rate limits are real and enforced.** Every client call must respect the `x-ratelimit-*` response headers and back off accordingly. Never poll faster than the data actually changes — war state, player stats, and clan rosters do not need sub-minute polling. Cache aggressively; a 5–15 minute cache window is appropriate for most reads.
5. **Loot counters cap at 2 billion.** Once a player crosses this, gold/elixir-looted figures stop incrementing in the API. Don't build a feature (e.g. a "most loot earned" stat) that silently breaks for high-level accounts without accounting for this.
6. **No live push/webhook mechanism.** The only way to detect a change is polling and diffing against the last known state. Design background jobs around this — a scheduled poll-and-diff worker, not a naive "check on every page load."

## Base data — link decoding vs. computer vision

**Corrected 2026-08-21 (BUILD_PLAN.md 1C investigation) — this reverses the original primary/fallback framing below.** A base copy-link (`link.clashofclans.com/...&id=TH14:WB:<32-char-base64-payload>`) does **not** locally encode building positions. Verified against a real link and cross-checked against an existing open-source project ([nschmeller/clash-bases](https://github.com/nschmeller/clash-bases)) that works with these links: the payload is an opaque 24-byte reference — only the Town Hall level, base type (`WB`/`HV`), and a layout-slot number (bytes 4–8, big-endian) are recoverable from the string itself. The actual building-by-building layout is resolved by the game client talking to Supercell's servers when the link is opened — a connection this project does not make, per the "no unofficial game-server connections" rule below.

- **Primary source of actual building positions: screenshot computer vision.** Use a hosted inference model (Roboflow) rather than training from scratch.
  - **v0 gap, found during 1C (2026-08-21):** the best available public model ([find-this-base/clash-of-clans-vop4y](https://universe.roboflow.com/find-this-base/clash-of-clans-vop4y), 75.6% precision) detects 16 defense classes but **no Traps and no Walls** — arguably the two things a player most needs from an attack plan. The other public option (23 training images, mAP 44.4%, junk labels) isn't usable at all. "Fine-tune an existing model" per the original wording undersold this: it means fine-tuning with self-labeled trap/wall images, not a small tweak.
  - **Plan:** ship v0 against defenses only, with the CV result's data shape explicitly marking which classes weren't detected (never silently omit — see `lib/coc-api/screenshot-cv.ts`'s `DecodedBase["coverageGaps"]`), then fine-tune with real trap/wall-labeled screenshots as a near-term follow-up once a labeling workflow exists. Don't present v0 as feature-complete base intake anywhere in the UI.
- **Link decoding is still useful, just narrower than originally scoped.** `lib/coc-api/base-link-decoder.ts` extracts TH level, base type, and layout slot as a pure function, no API calls — a fast, exact sanity check (e.g. confirming a pasted link is actually a war base at the player's TH) but not a building-data source. Don't build any feature that assumes it returns trap/defense positions.
- **Never present CV-derived base data with the same confidence as a would-be "exact" source.** CV misreads are possible — the recommendation should visibly note this (e.g. "building positions estimated from image — verify traps manually") per the UI guidance below, which still applies even though CV is now the primary path, not a fallback.

## Compliance

- Every user-facing surface must include Supercell's required fan-content disclaimer: *"This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell. For more information see Supercell's Fan Content Policy."*
- Do not build any feature that could be read as pay-to-win — e.g., never sell an advantage that affects in-game mechanics directly (that's what Supercell's own monetization is; ours is coaching/analytics on top, not game manipulation).
- Do not scrape or use unofficial/reverse-engineered game-server connections for anything beyond the base-link decoding already covered above. Player and clan data comes from the official API only.

## Client implementation checklist

Every function that calls the Supercell API must:
- [ ] Go through the shared client (`lib/coc-api/client.ts`), never a raw `fetch` in a route handler
- [ ] Respect and log rate-limit headers
- [ ] Cache reads with an appropriate TTL (see point 4 above)
- [ ] Handle and distinguish: 403 (bad/IP-mismatched token), 404 (invalid tag), 429 (rate limited), 503 (Supercell maintenance — this happens during their scheduled maintenance windows, handle gracefully, don't alarm the user)
- [ ] Never expose the raw API token to the client bundle
