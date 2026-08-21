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

- **Primary method: base copy-link decoding.** This is not officially documented by Supercell but is a stable, widely-used community-reverse-engineered format. Treat the decoder as an isolated module (`lib/coc-api/base-link-decoder.ts`) with its own tests, because it's the piece most likely to need updates when Supercell ships new buildings or a format change.
- **Fallback method: screenshot computer vision.** Only invoked when no copy-link is available. Use a hosted inference model (Roboflow or equivalent) rather than training from scratch — a pre-trained community model for COC base recognition already exists publicly; fine-tune it rather than starting from zero.
- **Never present CV-derived base data with the same confidence as link-decoded data in the UI.** If the source was CV, the recommendation should visibly note lower certainty (e.g. "building positions estimated from image — verify traps manually"), because CV misreads are possible and link data is exact.

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
