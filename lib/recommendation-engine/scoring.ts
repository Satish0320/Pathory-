import { isDefenseClass, threatensStrategy, STRATEGY_TROOPS } from "./strategy-profiles";
import type {
  BaseDefenseReading,
  PastAttack,
  PlayerTroopLevels,
  ReasoningFactor,
  StrategyId,
  StrategyScore,
} from "./types";

// Base weights match the worked example in
// .claude/skills/recommendation-engine/SKILL.md exactly -- troop strength
// matters most, base layout second, personal history third (until enough
// personal data exists to justify weighting it higher, which is a
// recalibration decision for later once real outcome data exists).
const BASE_WEIGHTS = {
  troopStrength: 0.4,
  baseDefense: 0.35,
  personalHistory: 0.25,
} as const;

const HISTORY_CONFIDENCE_SATURATION_ATTACKS = 10;
const COLD_START_CONFIDENCE_CAP = 0.5;

interface TroopStrengthResult {
  ratio: number | null; // null = no relevant troop data found
  matchedTroopCount: number;
}

function troopStrengthRatio(
  player: PlayerTroopLevels,
  strategy: StrategyId
): TroopStrengthResult {
  const relevantNames = STRATEGY_TROOPS[strategy];
  const matched = player.troops.filter(
    (t) => t.village === "home" && relevantNames.some((name) => t.name.includes(name))
  );
  if (matched.length === 0) return { ratio: null, matchedTroopCount: 0 };

  const avgRatio =
    matched.reduce((sum, t) => sum + (t.maxLevel > 0 ? t.level / t.maxLevel : 0), 0) /
    matched.length;
  return { ratio: avgRatio, matchedTroopCount: matched.length };
}

interface BaseFitResult {
  fitRatio: number | null; // null = no defense data found
  defenseCount: number;
}

function baseFitRatio(base: BaseDefenseReading, strategy: StrategyId): BaseFitResult {
  const defenses = base.detections.filter((d) => isDefenseClass(d.className));
  if (defenses.length === 0) return { fitRatio: null, defenseCount: 0 };

  const threatCount = defenses.filter((d) => threatensStrategy(d.className, strategy)).length;
  const difficultyRatio = threatCount / defenses.length;
  return { fitRatio: 1 - difficultyRatio, defenseCount: defenses.length };
}

interface PersonalHistoryResult {
  threeStarRate: number | null; // null = no attacks logged with this strategy
  attackCount: number;
}

function personalHistoryRate(
  pastAttacks: PastAttack[],
  strategy: StrategyId
): PersonalHistoryResult {
  const relevant = pastAttacks.filter(
    (a) => a.recommendedStrategy === strategy && a.starsEarned !== null
  );
  if (relevant.length === 0) return { threeStarRate: null, attackCount: 0 };

  const threeStars = relevant.filter((a) => a.starsEarned === 3).length;
  return { threeStarRate: threeStars / relevant.length, attackCount: relevant.length };
}

// Only factors with real data contribute to the score and are weight-
// normalized to sum to 1 -- see .claude/skills/recommendation-engine/
// SKILL.md's "reasoning factors sum/normalize consistently" requirement.
function computeScore(
  troop: TroopStrengthResult,
  defense: BaseFitResult,
  history: PersonalHistoryResult
): { score: number; totalAvailableWeight: number } {
  const available: { key: keyof typeof BASE_WEIGHTS; value: number }[] = [];
  if (troop.ratio !== null) available.push({ key: "troopStrength", value: troop.ratio });
  if (defense.fitRatio !== null) available.push({ key: "baseDefense", value: defense.fitRatio });
  if (history.threeStarRate !== null)
    available.push({ key: "personalHistory", value: history.threeStarRate });

  const totalAvailableWeight = available.reduce((sum, f) => sum + BASE_WEIGHTS[f.key], 0);
  const score =
    totalAvailableWeight === 0
      ? 0.5 // no data at all for this strategy -- neutral, not zero
      : available.reduce(
          (sum, f) => sum + f.value * (BASE_WEIGHTS[f.key] / totalAvailableWeight),
          0
        );

  return { score, totalAvailableWeight };
}

function buildReasoningFactors(
  troop: TroopStrengthResult,
  defense: BaseFitResult,
  history: PersonalHistoryResult,
  totalAvailableWeight: number
): ReasoningFactor[] {
  const factors: ReasoningFactor[] = [];

  if (troop.ratio !== null) {
    factors.push({
      factor: "troop_strength_gap",
      detail: `${troop.matchedTroopCount} relevant troop type(s) averaging ${Math.round(troop.ratio * 100)}% of max level for this Town Hall`,
      weight: BASE_WEIGHTS.troopStrength / totalAvailableWeight,
    });
  }
  if (defense.fitRatio !== null) {
    factors.push({
      factor: "base_defense_distribution",
      detail: `${defense.defenseCount} defense(s) detected; ${Math.round((1 - defense.fitRatio) * 100)}% directly threaten this strategy`,
      weight: BASE_WEIGHTS.baseDefense / totalAvailableWeight,
    });
  }
  if (history.threeStarRate !== null) {
    factors.push({
      factor: "personal_history",
      detail: `${Math.round(history.threeStarRate * 100)}% 3-star rate on this strategy (${history.attackCount} attack(s) logged)`,
      weight: BASE_WEIGHTS.personalHistory / totalAvailableWeight,
    });
  } else {
    // Explicit zero-weight entry rather than silent omission -- matches the
    // coverageGaps pattern in lib/coc-api/screenshot-cv.ts: an absence must
    // be visible, never just missing from the array.
    factors.push({
      factor: "personal_history",
      detail: "No attacks logged yet with this strategy -- based on general fit, not your history.",
      weight: 0,
    });
  }

  return factors;
}

// How much of the *full* weight budget had real data behind it, with
// personal history additionally saturating toward its full weight only as
// enough attacks accumulate -- see .claude/skills/recommendation-engine/
// SKILL.md's "confidence must move in the correct direction as personal
// history grows."
function computeConfidenceContribution(
  troop: TroopStrengthResult,
  defense: BaseFitResult,
  history: PersonalHistoryResult
): number {
  const troopConfidence = troop.ratio !== null ? BASE_WEIGHTS.troopStrength : 0;
  const defenseConfidence = defense.fitRatio !== null ? BASE_WEIGHTS.baseDefense : 0;
  const historyConfidence =
    BASE_WEIGHTS.personalHistory *
    Math.min(1, history.attackCount / HISTORY_CONFIDENCE_SATURATION_ATTACKS);
  return troopConfidence + defenseConfidence + historyConfidence;
}

export function scoreStrategy(
  strategy: StrategyId,
  player: PlayerTroopLevels,
  base: BaseDefenseReading,
  pastAttacks: PastAttack[]
): StrategyScore & { confidenceContribution: number; personalAttackCount: number } {
  const troop = troopStrengthRatio(player, strategy);
  const defense = baseFitRatio(base, strategy);
  const history = personalHistoryRate(pastAttacks, strategy);

  const { score, totalAvailableWeight } = computeScore(troop, defense, history);
  const reasoningFactors = buildReasoningFactors(troop, defense, history, totalAvailableWeight);
  const confidenceContribution = computeConfidenceContribution(troop, defense, history);

  return {
    strategy,
    score,
    reasoningFactors,
    confidenceContribution,
    personalAttackCount: history.attackCount,
  };
}

export { BASE_WEIGHTS, COLD_START_CONFIDENCE_CAP };
