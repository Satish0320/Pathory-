---
name: authentication
description: Use this skill for anything touching sign-in, sign-up, session handling, or the User/Player relationship. Auth is decided — Clerk, on both web and the future mobile app — this skill covers how to implement it correctly and consistently across both, not whether to use it.
---

# Authentication — Clerk, web and mobile

## The decision, and why it isn't open for reconsideration mid-build

Clerk, via `@clerk/nextjs` on web (now) and `@clerk/expo` on mobile (Phase 2). This was chosen specifically because it's the only evaluated option with genuine first-class support for exactly this app's shape: a Next.js web app today, an Expo/React Native app on both iOS and Android later, sharing one identity system rather than two. See `CLAUDE.md` §3 for the comparison reasoning. Don't reopen this choice without a concrete reason the current approach is failing — see `CLAUDE.md` §3's general rule about not introducing new major dependencies without justification.

## User identity vs. game identity — never conflate these

- **`User`** (in `prisma/schema.prisma`) is the authenticated account, keyed directly by Clerk's user ID. This is what actually gates access to the app.
- **`Player`** is an in-game Clash of Clans account, keyed by the public player tag. A player tag is public data — anyone can query it via the official API — so it must never function as a credential or prove identity on its own.
- **One `User` can have multiple `Player` rows — plan for this at real scale, not just as an edge case.** Alts and multiple accounts are the norm among competitive players, not a rare exception: someone actively playing at a high level can reasonably have a dozen or more accounts across war, farming, and pushing purposes. Design every screen and query with this in mind: "the current player" is a selection within a signed-in user's account, never assumed to be singular, and never hardcoded to "the first one" or "the most recently synced one."
- When a player links a new in-game account, verify they actually control it in some lightweight way appropriate to the stakes involved (this app reads public game data, it doesn't need bank-grade verification — but don't let User A silently attach and view analytics framed around a Player tag that's actually User B's without at least confirming intent, since attack history and skill profile are the personal data `.claude/rules/legal-compliance.md` §3 cares about).

### Account switcher UX

- `Player.label` (a user-set nickname, e.g. "War Main", "Farm #3") exists specifically because `playerTag`/in-game `name` alone stop being distinguishable once someone has more than 2-3 accounts — never build a switcher UI keyed only on the raw tag or in-game name.
- `Player.isPrimary` determines what loads by default on sign-in (dashboard, attack planner) — exactly one `Player` per `User` should be primary. Enforce this in application logic when setting a new primary (unset the previous one in the same transaction), not as a database constraint — see the schema comment for why.
- The switcher itself is a standard pattern, not a novel one: a compact account-picker (avatar/TH-badge + label) accessible from a consistent place in the nav, not buried in settings — someone managing a dozen accounts will use this constantly, closer to how a browser's multi-profile switcher behaves than a rarely-touched settings toggle.
- Loading/switching state per `.claude/skills/interface-states/SKILL.md`'s `InlineLoader` pattern — switching the active account shouldn't trigger a full-page reload/skeleton if the target `Player`'s data is already cached from a recent sync.

### Never blend data across a User's multiple Player accounts

Every recommendation, skill profile, and dashboard chart is scoped to a single `Player`, never aggregated across a `User`'s accounts unless a feature is deliberately, explicitly built to do that (not in Phase 1 — see `CLAUDE.md` §2). A war-alt's poor funnel score must never silently drag down or blend into a main account's skill profile, and vice versa. `.claude/skills/recommendation-engine/SKILL.md` and `.claude/skills/dashboard-reporting/SKILL.md` both operate on `playerId`, not `userId`, for exactly this reason — if a query or calculation is written against `userId` anywhere in those modules, that's very likely a bug, not a shortcut.

### Syncing many accounts without burning the shared rate-limit budget

A single Supercell API token is shared across every user of the app (see `.claude/rules/api.md`). A user with 12-14 accounts refreshing all of them at once is a real, foreseeable load spike against a budget every other user also depends on — this needs explicit handling, not just "the cache will absorb it":

- Batch/stagger multi-account syncs (e.g. a queue with a small delay between each account's fetch) rather than firing all requests concurrently when a user opens their account list.
- Respect the existing per-endpoint cache TTLs from `.claude/skills/coc-api-integration/SKILL.md` per account — a 14-account user isn't a reason to shorten those windows; if anything, staleness is more tolerable for alt accounts someone checks less often than their main.
- Surface sync status per account (queued/syncing/done/stale) rather than one blocking spinner over the whole list — this is a natural fit for the account switcher UI, not a separate concern.

## Sign-in methods for Phase 1

- **Email/password** — baseline, works everywhere, carries no extra app-store review requirements.
- **Google OAuth** — low friction, most players already have an account.
- **Apple Sign-In — mandatory on iOS the moment Google (or any third-party/social login) is offered.** This is an actual App Store review requirement, not a suggestion: an app offering social sign-in without an equivalent "Sign in with Apple" option risks rejection. Clerk's `<AuthView />` on `@clerk/expo` handles this natively — don't build a custom OAuth flow that skips it.
- Discord OAuth is a reasonable Phase 2+ addition given how much of this community lives on Discord — not required for Phase 1, don't build it yet per `CLAUDE.md` §2's scope discipline.

## Web implementation pattern (Next.js)

- Wrap the app in `<ClerkProvider>` at the root layout.
- **Protect routes with `clerkMiddleware()` in `proxy.ts` at the project root** (Next.js 16 renamed `middleware.ts` to `proxy.ts` — same `clerkMiddleware()` code, just the filename changed; if this project ever downgrades to Next.js ≤15, it's `middleware.ts` instead). This is the one place route protection should live, mirroring the "one shared client" discipline already used for the Supercell API in `.claude/skills/coc-api-integration/SKILL.md`.
- The Clerk CLI (`npx clerk@latest init`) can scaffold this end-to-end — installs `@clerk/nextjs`, writes `proxy.ts`, wires `ClerkProvider` into the layout, and creates sign-in/sign-up routes — worth using at 1A instead of hand-writing the wiring, then `npx clerk@latest doctor` to validate it before moving on.
- Server-side: use `auth()` from `@clerk/nextjs/server` in route handlers and server components to get the current `User` — never trust a client-supplied user ID for anything that touches the database.
- On first sign-in, create the corresponding `User` row (Clerk ID as the primary key, per the schema) — this sync should happen via a Clerk webhook (`user.created`) landing on a dedicated API route, not inferred lazily on the first authenticated request, so the `User` row reliably exists before anything tries to attach a `Player` to it.

## Mobile implementation pattern (Expo, Phase 2 — don't build yet, but design web auth compatibly now)

- `@clerk/expo`, using the native `<AuthView />` component (SwiftUI on iOS, Jetpack Compose on Android) rather than a hand-rolled RN auth UI — this is what gets Apple Sign-In handled correctly with minimal custom code.
- Session tokens are stored via `expo-secure-store` (iOS Keychain / Android Keystore) — Clerk's Expo SDK handles this, don't build custom token storage.
- The same backend API routes serve both web and mobile — Clerk issues a session token the Expo app attaches to API requests, verified server-side the same way regardless of which client sent it. This is what makes the "one deployable, shared logic" principle in `CLAUDE.md` §3 hold for auth specifically, not just for `lib/reporting/`.

## Error and loading states for auth flows

Auth has its own failure modes that need the same treatment as everything else in the app — route them through the existing skills rather than inventing separate handling:
- Wrong password, expired session, OAuth cancelled/failed, network failure during sign-in — each gets a specific what/why/action message per `.claude/skills/error-states/SKILL.md`'s mapping-table pattern, not a generic "authentication failed."
- Sign-in/sign-up forms need loading and disabled states per `.claude/skills/interface-states/SKILL.md` — a submit button with no loading feedback during an OAuth redirect reads as broken.

## Security checklist

Covered in depth by the `security-auditor` agent, restated here as the auth-specific subset:
- Never expose Clerk's secret/backend API key to the client — only the publishable key is client-safe.
- Verify webhooks (the `user.created` sync above) using Clerk's signing secret — don't accept unsigned webhook payloads as ground truth for creating `User` rows.
- A `User` deletion (via Clerk or an in-app request) must cascade through `Player` → `Attack`/`SkillProfile` cleanly — this is already modeled with `onDelete: Cascade` in `prisma/schema.prisma`; confirm any new relation added later preserves this rather than leaving orphaned rows behind, per `.claude/rules/legal-compliance.md` §3.
