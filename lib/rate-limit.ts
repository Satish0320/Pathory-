// Per-user token-bucket rate limiting for routes that spend a shared,
// budget-constrained resource (the IP-locked COC_API_TOKEN, or paid
// Roboflow inference calls) -- see .claude/skills/coc-api-integration/
// SKILL.md's multi-account section and the security-auditor's 2026-08-21
// review: without this, one signed-in user looping requests can burn the
// shared Supercell rate-limit budget or run up Roboflow costs for everyone.
//
// In-memory Map, same reasoning as lib/coc-api/cache.ts: fine for Phase 1's
// single-instance deployment, revisit only if that stops holding.
interface Bucket {
  tokens: number;
  lastRefillAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  maxTokens: number;
  refillIntervalMs: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    buckets.set(key, { tokens: config.maxTokens - 1, lastRefillAt: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  const elapsed = now - existing.lastRefillAt;
  const refillCount = Math.floor(elapsed / config.refillIntervalMs);
  if (refillCount > 0) {
    existing.tokens = Math.min(config.maxTokens, existing.tokens + refillCount);
    existing.lastRefillAt = now;
  }

  if (existing.tokens <= 0) {
    const retryAfterMs = config.refillIntervalMs - (elapsed % config.refillIntervalMs);
    return { allowed: false, retryAfterMs };
  }

  existing.tokens -= 1;
  return { allowed: true, retryAfterMs: 0 };
}
