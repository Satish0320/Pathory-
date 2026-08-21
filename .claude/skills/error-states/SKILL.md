---
name: error-states
description: Use this skill any time you're writing code that can fail — an API call, a form submission, a database write, the base decoder, the recommendation engine, auth. Every failure path needs a designed error state, not a console.log and a blank screen. This is not optional polish; an unhandled or badly-worded error during a live war attack is the worst possible moment for this product to look broken.
---

# Error states

## The three-part rule for every user-facing error message

Every error a person sees must answer, in plain language, in this order:

1. **What happened** — stated plainly, not as a category label. "We couldn't load your base" not "Error: FETCH_FAILED."
2. **Why it happened** — the real reason, in terms a non-technical player understands. "Clash of Clans' servers are temporarily unavailable" not "upstream 503."
3. **What to do next** — one clear, specific action. "Try again in a minute" or "Check the base link and paste it again" — not a generic "please try again later" that could apply to anything.

Bad: `Something went wrong. Error code 429.`
Good: `We're checking bases too fast right now. Wait about a minute and try again — this happens when a lot of people use the app at once, not because of anything you did.`

## Never expose backend logic, stack traces, or internal state to the user

- No raw error objects, stack traces, SQL fragments, file paths, or internal function names in any UI-facing text — ever, including in a collapsed "details" section aimed at end users.
- No raw Supercell API error codes shown verbatim (`403`, `429`, `TokenIPMismatchError`) — translate every error type from `.claude/rules/api.md` and `lib/coc-api/errors.ts` into one of the plain-language messages below before it reaches a component.
- Internal diagnostic detail (stack trace, request ID, raw status code) is fine in **server-side logs and monitoring** (see `.claude/skills/deployment-devops/SKILL.md`) — never in the response body or DOM the user can inspect.
- If a support/contact path exists later, an error can include a short reference code the person can quote ("Error ref: ATK-4471") without that code revealing anything about the underlying system.

## Map every known failure mode to a designed message — don't leave any to a generic catch-all

This app has specific, known failure modes — write the message for each deliberately rather than routing everything through one generic error boundary:

| Failure | What happened | Why | Action |
|---|---|---|---|
| Supercell 429 (rate limited) | "We're checking bases too fast right now." | "This happens when a lot of people use the app at once." | "Wait about a minute and try again." |
| Supercell 403 (token/IP issue — ops problem, not user's fault) | "We're having trouble reaching Clash of Clans right now." | "This is on our end, not yours." | "We're on it — try again shortly." (Also fires an internal alert per `.claude/skills/deployment-devops/SKILL.md` — this specific error should never be silently swallowed on the backend.) |
| Supercell 503 (maintenance) | "Clash of Clans' servers are down for maintenance." | "Supercell does scheduled maintenance periodically." | "Try again in a little while." |
| Invalid/malformed player tag | "We couldn't find that player tag." | "It might be mistyped, or missing the # symbol." | "Double-check the tag and try again." |
| Base link doesn't decode | "We couldn't read that base link." | "The link might be broken, expired, or in a format we don't support yet." | "Try copying the link again, or upload a screenshot instead." |
| Screenshot CV fallback low-confidence read | Not a hard error — see the "uncertain result" pattern below, not a failure state. | | |
| Network offline / request timeout | "You seem to be offline." | "We can't reach our servers right now." | "Check your connection and try again." |
| Recommendation engine has no data for a cold-start player | Not an error — see empty/cold-start state in `.claude/skills/interface-states/SKILL.md`. | | |
| Auth session expired | "You've been signed out." | "Sessions expire after a while for your security." | "Sign back in to continue." |

## Recoverable vs. non-recoverable errors

- **Recoverable** (rate limit, network blip, timeout): offer a direct retry action in the error state itself — a button, not just instructions to refresh the page manually.
- **Non-recoverable within the current flow** (invalid tag, malformed link): guide the person back to fixing the input, don't offer a retry button that will just fail identically.
- **System-side** (403/token issue, 5xx): never blame the user's action, and make sure it's logged/alerted per `.claude/skills/deployment-devops/SKILL.md` — a system error the person can see but you don't know about is the worst version of this.

## Tone

Calm, specific, never alarming. No exclamation points, no red-and-siren visual treatment for a recoverable rate limit — reserve the strongest visual severity for things that actually need it (a failed data-loss-risk action), not for "wait a minute and try again."
