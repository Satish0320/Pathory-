// TTL-based cache for Supercell API reads. In-memory Map is deliberately the
// only backend for Phase 1 dev (see .env.example's REDIS_URL comment and
// .claude/skills/coc-api-integration/SKILL.md) — swap in Redis behind this
// same get/set shape only once a real need (multi-instance prod) shows up,
// per CLAUDE.md §3's rule against introducing infra ahead of an actual
// requirement.
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Endpoint-specific TTLs per .claude/skills/coc-api-integration/SKILL.md's
// caching table — named here so call sites reference intent, not a bare
// millisecond number (see .claude/rules/code-quality.md's no-magic-numbers rule).
export const CACHE_TTL_MS = {
  playerProfile: 10 * 60 * 1000,
} as const;
