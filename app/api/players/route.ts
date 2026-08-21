import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { syncPlayerAccount, PlayerTagAlreadyLinkedError } from "@/lib/coc-api/player-sync";
import { toUserFacingError } from "@/lib/errors/coc-error-messages";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

// Lists every Player synced to the signed-in User -- backs the account
// switcher in .claude/skills/authentication/SKILL.md's multi-account
// section. Read-only DB query, no Supercell API call, so no rate limit
// needed here (unlike POST, which does hit the shared token's budget).
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const players = await db.player.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ players });
}

const syncRequestSchema = z.object({
  playerTag: z.string().min(3).max(15),
});

// A user syncing many alt accounts is normal (see .claude/skills/
// authentication/SKILL.md's multi-account section), so this is generous
// enough for that — it guards against a scripted loop burning the shared,
// IP-locked COC_API_TOKEN's rate-limit budget, not against a real person
// adding a dozen accounts by hand.
const SYNC_RATE_LIMIT = { maxTokens: 20, refillIntervalMs: 60_000 };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`player-sync:${userId}`, SYNC_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          what: "You're syncing accounts too quickly.",
          why: "This protects the shared Clash of Clans API budget every user depends on.",
          action: "Wait about a minute and try again.",
          recoverable: true,
        },
      },
      { status: 429 }
    );
  }

  const parsed = syncRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          what: "We couldn't find that player tag.",
          why: "It might be mistyped, or missing the # symbol.",
          action: "Double-check the tag and try again.",
          recoverable: false,
        },
      },
      { status: 400 }
    );
  }

  try {
    const { player, profile } = await syncPlayerAccount(userId, parsed.data.playerTag);
    return NextResponse.json({ player, profile });
  } catch (error) {
    if (error instanceof PlayerTagAlreadyLinkedError) {
      return NextResponse.json(
        {
          error: {
            what: "That player is already linked to a different account.",
            why: "Each in-game account can only be linked to one Pathory sign-in.",
            action: "Sign in with the account it's already linked to, or use a different player tag.",
            recoverable: false,
          },
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: toUserFacingError(error) }, { status: 502 });
  }
}
