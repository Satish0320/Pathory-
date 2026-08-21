// Typed shape of the Supercell player endpoint response — only the fields
// Pathory actually consumes today (account sync, recommendation engine
// inputs). Extend as later phases need more, don't pre-model the whole API.
export interface CocPlayerLeague {
  id: number;
  name: string;
  iconUrls: { small?: string; tiny?: string; medium?: string };
}

export interface CocPlayerHero {
  name: string;
  level: number;
  maxLevel: number;
  village: "home" | "builderBase";
}

export interface CocPlayerTroop {
  name: string;
  level: number;
  maxLevel: number;
  village: "home" | "builderBase";
}

export interface CocPlayerSpell {
  name: string;
  level: number;
  maxLevel: number;
}

export interface CocPlayerClan {
  tag: string;
  name: string;
  clanLevel: number;
}

// Loot counters cap at 2,000,000,000 and stop incrementing past that — see
// .claude/rules/api.md point 5. Any feature that sums or trends these fields
// must account for the cap; the client itself just passes the value through.
export interface CocPlayer {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  donations: number;
  donationsReceived: number;
  goldLooted: number;
  elixirLooted: number;
  darkElixirLooted: number;
  league?: CocPlayerLeague;
  clan?: CocPlayerClan;
  heroes: CocPlayerHero[];
  troops: CocPlayerTroop[];
  spells: CocPlayerSpell[];
}
