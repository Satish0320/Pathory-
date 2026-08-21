import { db } from "@/lib/db";
import { getPlayer } from "./client";
import type { Player } from "@prisma/client";

export class PlayerTagAlreadyLinkedError extends Error {
  constructor() {
    super("This player tag is already linked to a different account");
    this.name = "PlayerTagAlreadyLinkedError";
  }
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
): Promise<Player> {
  const cocPlayer = await getPlayer(playerTag);

  const existing = await db.player.findUnique({
    where: { playerTag: cocPlayer.tag },
  });

  if (existing && existing.userId !== userId) {
    throw new PlayerTagAlreadyLinkedError();
  }

  if (existing) {
    return db.player.update({
      where: { id: existing.id },
      data: { name: cocPlayer.name, townHallLvl: cocPlayer.townHallLevel },
    });
  }

  const isFirstPlayer = (await db.player.count({ where: { userId } })) === 0;

  return db.player.create({
    data: {
      playerTag: cocPlayer.tag,
      name: cocPlayer.name,
      townHallLvl: cocPlayer.townHallLevel,
      userId,
      isPrimary: isFirstPlayer,
    },
  });
}
