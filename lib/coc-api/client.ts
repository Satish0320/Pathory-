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

async function fetchWithBackoff(
  url: string,
  attempt = 1
): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders() });

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
