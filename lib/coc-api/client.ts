import {
  InvalidTagError,
  RateLimitError,
  SupercellMaintenanceError,
  TokenIPMismatchError,
} from "./errors";
import { CACHE_TTL_MS, getCached, setCached } from "./cache";
import type { CocPlayer } from "./types";

// The only place that talks to the Supercell API — see CLAUDE.md §6 and
// .claude/rules/api.md's client implementation checklist. Every other module
// (route handlers, the recommendation engine) goes through the functions
// exported here, never a raw fetch.
const BASE_URL = "https://api.clashofclans.com/v1";
const MAX_RETRY_ATTEMPTS = 3;

function authHeaders(): HeadersInit {
  const token = process.env.COC_API_TOKEN;
  if (!token) {
    throw new Error(
      "COC_API_TOKEN is not set — see .env.example and .claude/rules/api.md"
    );
  }
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

// Supercell tags are commonly typed/pasted without the leading "#", and the
// "#" must be percent-encoded in the URL path — normalize both here so every
// caller can pass a tag however a user typed it.
function normalizeTag(tag: string): string {
  const withHash = tag.startsWith("#") ? tag : `#${tag}`;
  return encodeURIComponent(withHash.toUpperCase());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// api.md's client checklist requires respecting *and logging* rate-limit
// headers on every response, not just reacting after a 429 already happens —
// this is what lets ops notice quota pressure building before it trips.
function logRateLimitHeaders(res: Response): void {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  if (remaining !== null && limit !== null) {
    console.log(`[coc-api] rate limit: ${remaining}/${limit} remaining`);
  }
}

async function fetchWithBackoff(
  url: string,
  attempt = 1
): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders() });
  logRateLimitHeaders(res);

  if (res.status === 429) {
    if (attempt > MAX_RETRY_ATTEMPTS) {
      const retryAfterHeader = res.headers.get("retry-after");
      throw new RateLimitError(
        retryAfterHeader ? Number(retryAfterHeader) * 1000 : attempt * 500
      );
    }
    const retryAfterHeader = res.headers.get("retry-after");
    const delayMs = retryAfterHeader
      ? Number(retryAfterHeader) * 1000
      : attempt * 500;
    await sleep(delayMs);
    return fetchWithBackoff(url, attempt + 1);
  }

  return res;
}

async function handleResponse<T>(res: Response, tag?: string): Promise<T> {
  if (res.ok) {
    return (await res.json()) as T;
  }
  // Distinguish every failure mode CLAUDE.md §6 and api.md's checklist call
  // out — never let a raw status code leak past this layer.
  switch (res.status) {
    case 403:
      // Loud on purpose — an IP-locked token failing in prod (e.g. after a
      // Vercel region change) must be obvious in logs, even though the
      // user-facing message stays calm per error-states/SKILL.md.
      console.error("[coc-api] 403 — token/IP mismatch, see .claude/rules/api.md point 3");
      throw new TokenIPMismatchError();
    case 404:
      throw new InvalidTagError(tag ?? "unknown");
    case 503:
      throw new SupercellMaintenanceError();
    default:
      throw new Error(`Supercell API request failed with status ${res.status}`);
  }
}

export async function getPlayer(tag: string): Promise<CocPlayer> {
  const normalized = normalizeTag(tag);
  const cacheKey = `player:${normalized}`;

  const cached = getCached<CocPlayer>(cacheKey);
  if (cached) return cached;

  const res = await fetchWithBackoff(`${BASE_URL}/players/${normalized}`);
  const player = await handleResponse<CocPlayer>(res, tag);

  setCached(cacheKey, player, CACHE_TTL_MS.playerProfile);
  return player;
}
