import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getPlayer } from "../client";
import {
  InvalidTagError,
  RateLimitError,
  SupercellMaintenanceError,
  TokenIPMismatchError,
} from "../errors";
import type { CocPlayer } from "../types";

// Mocks at the HTTP layer per .claude/skills/coc-api-integration/SKILL.md's
// testing guidance — this catches real response-shape mismatches, unlike
// stubbing the client's own functions.
const server = setupServer();

beforeAll(() => {
  process.env.COC_API_TOKEN = "test-token";
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const basePlayer: CocPlayer = {
  tag: "#ABC123",
  name: "TestPlayer",
  townHallLevel: 14,
  expLevel: 150,
  trophies: 4200,
  bestTrophies: 4500,
  warStars: 800,
  attackWins: 50,
  defenseWins: 20,
  donations: 1000,
  donationsReceived: 800,
  goldLooted: 5_000_000,
  elixirLooted: 5_000_000,
  darkElixirLooted: 50_000,
  heroes: [],
  troops: [],
  spells: [],
  achievements: [],
};

describe("getPlayer", () => {
  it("returns the player on a happy-path fetch", async () => {
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        HttpResponse.json(basePlayer)
      )
    );

    const player = await getPlayer("#ABC123");
    expect(player.name).toBe("TestPlayer");
    expect(player.townHallLevel).toBe(14);
  });

  it("retries on 429 and eventually succeeds", async () => {
    let attempts = 0;
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () => {
        attempts += 1;
        if (attempts < 2) {
          return new HttpResponse(null, {
            status: 429,
            headers: { "retry-after": "0" },
          });
        }
        return HttpResponse.json(basePlayer);
      })
    );

    const player = await getPlayer("#RETRY1");
    expect(attempts).toBe(2);
    expect(player.name).toBe("TestPlayer");
  });

  it("raises RateLimitError distinctly after exhausting retries", async () => {
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        new HttpResponse(null, { status: 429, headers: { "retry-after": "0" } })
      )
    );

    await expect(getPlayer("#ALWAYS429")).rejects.toBeInstanceOf(RateLimitError);
  });

  it("raises TokenIPMismatchError distinctly on 403, not a generic error", async () => {
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        new HttpResponse(null, { status: 403 })
      )
    );

    await expect(getPlayer("#IPMISMATCH")).rejects.toBeInstanceOf(TokenIPMismatchError);
  });

  it("raises InvalidTagError on 404 for a bad tag", async () => {
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    await expect(getPlayer("#NOTREAL")).rejects.toBeInstanceOf(InvalidTagError);
  });

  it("raises SupercellMaintenanceError on 503", async () => {
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        new HttpResponse(null, { status: 503 })
      )
    );

    await expect(getPlayer("#MAINTENANCE")).rejects.toBeInstanceOf(
      SupercellMaintenanceError
    );
  });

  it("passes through a player at the 2B loot-counter cap without breaking", async () => {
    const cappedPlayer: CocPlayer = {
      ...basePlayer,
      tag: "#CAPPED1",
      goldLooted: 2_000_000_000,
      elixirLooted: 2_000_000_000,
    };
    server.use(
      http.get("https://api.clashofclans.com/v1/players/:tag", () =>
        HttpResponse.json(cappedPlayer)
      )
    );

    const player = await getPlayer("#CAPPED1");
    expect(player.goldLooted).toBe(2_000_000_000);
    expect(Number.isFinite(player.goldLooted)).toBe(true);
  });
});
