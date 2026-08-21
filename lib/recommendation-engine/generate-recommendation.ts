import { STRATEGY_IDS } from "./strategy-profiles";
import { COLD_START_CONFIDENCE_CAP, scoreStrategy } from "./scoring";
import type { BaseDefenseReading, PastAttack, PlayerTroopLevels, Recommendation } from "./types";

// Entry point for 1D -- see .claude/skills/recommendation-engine/SKILL.md.
// Deterministic: same player + base + attack history always produces the
// same recommendation, no hidden randomness, since this is supposed to be
// explainable end to end.
//
// Scoped to a single Player's data throughout (player, base, pastAttacks
// are all caller-supplied for one Player) -- never aggregate across a
// User's multiple accounts, per the skill's first rule.
export function generateRecommendation(
  player: PlayerTroopLevels,
  base: BaseDefenseReading,
  pastAttacks: PastAttack[]
): Recommendation {
  const scored = STRATEGY_IDS.map((strategy) =>
    scoreStrategy(strategy, player, base, pastAttacks)
  ).sort((a, b) => b.score - a.score);

  const top = scored[0]!;
  const runnerUp = scored[1] ?? null;

  // Cold start is scoped to the *recommended strategy's* personal history,
  // not whether the player has attacks logged at all -- a player with 8
  // ground attacks but 0 air attacks is still cold-start for a recommended
  // air strategy. See code-reviewer's 2026-08-21 catch: checking
  // pastAttacks.length globally let confidence read as 0.75 while the
  // reasoning factors openly said "no attacks logged yet with this
  // strategy," which is exactly the false-certainty the skill forbids.
  const isColdStart = top.personalAttackCount === 0;
  const confidenceScore = isColdStart
    ? Math.min(top.confidenceContribution, COLD_START_CONFIDENCE_CAP)
    : top.confidenceContribution;

  return {
    strategy: top.strategy,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    reasoningFactors: top.reasoningFactors,
    runnerUp: runnerUp
      ? { strategy: runnerUp.strategy, reasoningFactors: runnerUp.reasoningFactors }
      : null,
    isColdStart,
  };
}
