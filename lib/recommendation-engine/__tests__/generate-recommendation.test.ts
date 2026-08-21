import { describe, expect, it } from "vitest";
import { generateRecommendation } from "../generate-recommendation";
import type { BaseDefenseReading, PastAttack, PlayerTroopLevels } from "../types";

const airHeavyPlayer: PlayerTroopLevels = {
  townHallLevel: 14,
  troops: [
    { name: "Dragon", level: 9, maxLevel: 9, village: "home" },
    { name: "Balloon", level: 8, maxLevel: 9, village: "home" },
    { name: "Hog Rider", level: 5, maxLevel: 10, village: "home" },
    { name: "Giant", level: 4, maxLevel: 10, village: "home" },
  ],
};

const groundThreatBase: BaseDefenseReading = {
  detections: [
    { className: "Canon", confidence: 0.9 },
    { className: "Canon", confidence: 0.8 },
    { className: "Mortar", confidence: 0.7 },
    { className: "Xbow", confidence: 0.85 },
    { className: "ClanCastle", confidence: 0.6 }, // non-defense, must not count
  ],
};

const noAttacks: PastAttack[] = [];

describe("generateRecommendation", () => {
  it("is deterministic for fixed inputs", () => {
    const a = generateRecommendation(airHeavyPlayer, groundThreatBase, noAttacks);
    const b = generateRecommendation(airHeavyPlayer, groundThreatBase, noAttacks);
    expect(a).toEqual(b);
  });

  it("recommends air for a max-air-troop player against a ground-heavy base", () => {
    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, noAttacks);
    expect(result.strategy).toBe("air");
  });

  it("flags cold start and caps confidence when no attacks are logged", () => {
    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, noAttacks);
    expect(result.isColdStart).toBe(true);
    expect(result.confidenceScore).toBeLessThanOrEqual(0.5);
  });

  it("always returns a runner-up with its own reasoning", () => {
    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, noAttacks);
    expect(result.runnerUp).not.toBeNull();
    expect(result.runnerUp!.strategy).not.toBe(result.strategy);
    expect(result.runnerUp!.reasoningFactors.length).toBeGreaterThan(0);
  });

  it("confidence increases as more personal attacks accumulate for the winning strategy", () => {
    const zeroAttacks = generateRecommendation(airHeavyPlayer, groundThreatBase, []);

    const fewAttacks: PastAttack[] = [
      { recommendedStrategy: "air", starsEarned: 3 },
      { recommendedStrategy: "air", starsEarned: 2 },
    ];
    const withFew = generateRecommendation(airHeavyPlayer, groundThreatBase, fewAttacks);

    const manyAttacks: PastAttack[] = Array.from({ length: 10 }, () => ({
      recommendedStrategy: "air",
      starsEarned: 3,
    }));
    const withMany = generateRecommendation(airHeavyPlayer, groundThreatBase, manyAttacks);

    expect(withFew.confidenceScore).toBeGreaterThan(zeroAttacks.confidenceScore);
    expect(withMany.confidenceScore).toBeGreaterThan(withFew.confidenceScore);
  });

  it("gives a sensible cold-start recommendation with no attack history at all", () => {
    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, []);
    expect(result.strategy).toBeDefined();
    expect(result.reasoningFactors.length).toBeGreaterThan(0);
    const personalHistoryFactor = result.reasoningFactors.find(
      (f) => f.factor === "personal_history"
    );
    expect(personalHistoryFactor?.weight).toBe(0);
  });

  it("reasoning factors with nonzero weight always sum to 1", () => {
    const withHistory: PastAttack[] = [{ recommendedStrategy: "air", starsEarned: 3 }];
    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, withHistory);
    const sum = result.reasoningFactors.reduce((acc, f) => acc + f.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("stays cold-start-capped when history exists only for a different strategy than the one recommended", () => {
    // Regression test for a bug caught in code review: isColdStart was
    // scoped to "any attacks logged at all," so a player with plenty of
    // ground history but zero air history got full confidence on an air
    // recommendation, even though its own reasoning factors said "no
    // attacks logged yet with this strategy."
    const groundOnlyHistory: PastAttack[] = Array.from({ length: 8 }, () => ({
      recommendedStrategy: "ground",
      starsEarned: 3,
    }));

    const result = generateRecommendation(airHeavyPlayer, groundThreatBase, groundOnlyHistory);

    expect(result.strategy).toBe("air");
    expect(result.isColdStart).toBe(true);
    expect(result.confidenceScore).toBeLessThanOrEqual(0.5);
    const personalHistoryFactor = result.reasoningFactors.find(
      (f) => f.factor === "personal_history"
    );
    expect(personalHistoryFactor?.weight).toBe(0);
  });

  it("falls back to a neutral score when neither troop nor base data exists for a strategy", () => {
    const noTroopData: PlayerTroopLevels = { townHallLevel: 10, troops: [] };
    const noBaseData: BaseDefenseReading = { detections: [] };
    const result = generateRecommendation(noTroopData, noBaseData, []);
    expect(result.strategy).toBeDefined();
    expect(result.confidenceScore).toBe(0);
  });
});
