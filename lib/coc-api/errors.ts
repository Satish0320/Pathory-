// Typed error classes so callers (API routes, UI) can distinguish failure
// modes instead of pattern-matching on status codes or message strings.
// See .claude/rules/api.md and .claude/skills/coc-api-integration/SKILL.md.

export class RateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super("Supercell API rate limit exceeded");
    this.name = "RateLimitError";
  }
}

export class InvalidTagError extends Error {
  constructor(readonly tag: string) {
    super(`No player found for tag ${tag}`);
    this.name = "InvalidTagError";
  }
}

// Distinct from a generic auth failure — see .claude/rules/api.md point 3:
// tokens are IP-locked, so a 403 here means the deployment's outbound IP
// doesn't match the token's registered IP, not a bad credential.
export class TokenIPMismatchError extends Error {
  constructor() {
    super("Supercell API token is not authorized for this server's IP");
    this.name = "TokenIPMismatchError";
  }
}

export class SupercellMaintenanceError extends Error {
  constructor() {
    super("Clash of Clans API is in a scheduled maintenance window");
    this.name = "SupercellMaintenanceError";
  }
}
