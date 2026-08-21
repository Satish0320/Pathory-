import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { syncPlayerAccount, PlayerTagAlreadyLinkedError } from "@/lib/coc-api/player-sync";
import { toUserFacingError } from "@/lib/errors/coc-error-messages";

const syncRequestSchema = z.object({
  playerTag: z.string().min(3).max(15),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
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
    const player = await syncPlayerAccount(userId, parsed.data.playerTag);
    return NextResponse.json({ player });
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
