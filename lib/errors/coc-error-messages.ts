import {
  InvalidTagError,
  RateLimitError,
  SupercellMaintenanceError,
  TokenIPMismatchError,
} from "@/lib/coc-api/errors";

// Single source of truth for translating coc-api errors into plain-language
// messages — see .claude/skills/error-states/SKILL.md's mapping table. Every
// surface that can hit these errors (API routes, future UI) reads from here
// instead of re-wording the same failure differently at each call site,
// per .claude/rules/code-quality.md's no-repetition rule.
export interface UserFacingError {
  what: string;
  why: string;
  action: string;
  recoverable: boolean;
}

const NETWORK_ERROR: UserFacingError = {
  what: "You seem to be offline.",
  why: "We can't reach our servers right now.",
  action: "Check your connection and try again.",
  recoverable: true,
};

export function toUserFacingError(error: unknown): UserFacingError {
  if (error instanceof RateLimitError) {
    return {
      what: "We're checking bases too fast right now.",
      why: "This happens when a lot of people use the app at once, not because of anything you did.",
      action: "Wait about a minute and try again.",
      recoverable: true,
    };
  }
  if (error instanceof TokenIPMismatchError) {
    return {
      what: "We're having trouble reaching Clash of Clans right now.",
      why: "This is on our end, not yours.",
      action: "We're on it — try again shortly.",
      recoverable: false,
    };
  }
  if (error instanceof SupercellMaintenanceError) {
    return {
      what: "Clash of Clans' servers are down for maintenance.",
      why: "Supercell does scheduled maintenance periodically.",
      action: "Try again in a little while.",
      recoverable: false,
    };
  }
  if (error instanceof InvalidTagError) {
    return {
      what: "We couldn't find that player tag.",
      why: "It might be mistyped, or missing the # symbol.",
      action: "Double-check the tag and try again.",
      recoverable: false,
    };
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return NETWORK_ERROR;
  }
  return {
    what: "Something went wrong on our end.",
    why: "An unexpected error occurred while processing your request.",
    action: "Try again, and let us know if it keeps happening.",
    recoverable: true,
  };
}
