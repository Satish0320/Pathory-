import { db } from "@/lib/db";
import { getPlayer } from "./client";
import type { Player } from "@prisma/client";
import type { CocPlayer } from "./types";

export class PlayerTagAlreadyLinkedError extends Error {
  constructor() {
    super("This player tag is already linked to a different account");
    this.name = "PlayerTagAlreadyLinkedError";
  }
}

export interface SyncedPlayerAccount {
  player: Player;
  // Full Supercell profile at sync time -- only townHallLvl/name persist to
  // the Player row (see prisma/schema.prisma), but the UI wants to show a
  // real account snapshot (trophies, league, clan, heroes) right after
  // sync, so this is returned alongside rather than re-fetched by the caller.
  profile: CocPlayer;
}

// Fetches a player from the Supercell API and upserts it as a Player row
// scoped to the signed-in User. See .claude/skills/authentication/SKILL.md:
// a playerTag is public data, never a credential, but it must still resolve
// to exactly one owning User — silently letting a second User "steal" an
// already-linked tag would corrupt that account's attack history and skill
// profile, so a conflict here is a hard error, not a silent reassignment.
export async function syncPlayerAccount(
  userId: string,
  playerTag: string
): Promise<SyncedPlayerAccount> {
  const cocPlayer = await getPlayer(playerTag);

  const existing = await db.player.findUnique({
    where: { playerTag: cocPlayer.tag },
  });

  if (existing && existing.userId !== userId) {
    throw new PlayerTagAlreadyLinkedError();
  }

  if (existing) {
    const player = await db.player.update({
      where: { id: existing.id },
      data: { name: cocPlayer.name, townHallLvl: cocPlayer.townHallLevel },
    });
    return { player, profile: cocPlayer };
  }

  const isFirstPlayer = (await db.player.count({ where: { userId } })) === 0;

  const player = await db.player.create({
    data: {
      playerTag: cocPlayer.tag,
      name: cocPlayer.name,
      townHallLvl: cocPlayer.townHallLevel,
      userId,
      isPrimary: isFirstPlayer,
    },
  });
  return { player, profile: cocPlayer };
}
