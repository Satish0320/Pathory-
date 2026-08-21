import type { StrategyId } from "./types";

// v0 strategy set -- deliberately small and named generically (air/ground/
// hybrid) rather than specific army compositions (e.g. "LavaLoon"), since
// picking exact compositions needs real outcome data to justify per
// .claude/skills/recommendation-engine/SKILL.md's "start rule-based, say so
// honestly" rule. Expand this list only once v0 has real attack data to
// calibrate against, not speculatively.
export const STRATEGY_IDS: StrategyId[] = ["air", "ground", "hybrid"];

// Troop name substrings relevant to each strategy's core damage dealers --
// standard Clash of Clans troop categorization, not a guess.
export const STRATEGY_TROOPS: Record<StrategyId, string[]> = {
  air: ["Dragon", "Balloon", "Lava Hound", "Minion", "Baby Dragon", "Electro Dragon"],
  ground: ["Hog Rider", "Miner", "Giant", "Golem", "P.E.K.K.A", "Barbarian", "Archer", "Wizard"],
  hybrid: [
    "Dragon",
    "Balloon",
    "Hog Rider",
    "Miner",
    "Giant",
    "Wizard",
    "Barbarian",
    "Archer",
  ],
};

// Which CV detection classes actually threaten each strategy's approach --
// see lib/coc-api/screenshot-cv.ts's coverageGaps for why this only covers
// what the model detects (defenses), never traps/walls, and
// lib/coc-api/base-link-decoder.ts's scope note for why link data never
// contributes here at all.
const AIR_THREAT_CLASSES = new Set(["AD", "AirSweeper", "Scattershot", "Inferno", "WizzTower", "Eagle", "Xbow"]);
const GROUND_THREAT_CLASSES = new Set(["Canon", "Mortar", "BombTower", "Inferno", "WizzTower", "Eagle", "Xbow"]);

// Non-defense classes the model also detects (hero altars, TH marker) --
// excluded from defense-density scoring entirely, not just weighted at zero,
// so a base with lots of hero altars doesn't read as "heavily defended."
const NON_DEFENSE_CLASSES = new Set(["ClanCastle", "KingPad", "QueenPad", "RcPad", "WardenPad", "TH13"]);

export function isDefenseClass(className: string): boolean {
  return !NON_DEFENSE_CLASSES.has(className);
}

export function threatensStrategy(className: string, strategy: StrategyId): boolean {
  if (strategy === "hybrid") {
    return AIR_THREAT_CLASSES.has(className) || GROUND_THREAT_CLASSES.has(className);
  }
  if (strategy === "air") return AIR_THREAT_CLASSES.has(className);
  return GROUND_THREAT_CLASSES.has(className);
}

export function strategyLabel(strategy: StrategyId): string {
  switch (strategy) {
    case "air":
      return "Air (Dragons/Balloons)";
    case "ground":
      return "Ground (Hogs/Miners)";
    case "hybrid":
      return "Hybrid (mixed air/ground)";
  }
}
