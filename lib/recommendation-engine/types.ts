// Shared types for the recommendation engine. Reasoning is always structured
// data (never a pre-written string) per
// .claude/skills/recommendation-engine/SKILL.md — the UI renders this into
// plain English, and the same factor structure powers the "why not X"
// runner-up without any extra data collection.

export type StrategyId = "air" | "ground" | "hybrid";

export interface ReasoningFactor {
  factor: string;
  detail: string;
  weight: number;
}

export interface StrategyScore {
  strategy: StrategyId;
  score: number;
  reasoningFactors: ReasoningFactor[];
}

export interface Recommendation {
  strategy: StrategyId;
  confidenceScore: number;
  reasoningFactors: ReasoningFactor[];
  runnerUp: {
    strategy: StrategyId;
    reasoningFactors: ReasoningFactor[];
  } | null;
  // True when personalHistory carried zero weight because the player has no
  // logged attacks yet -- see .claude/skills/interface-states/SKILL.md's
  // cold-start empty state, which the UI renders differently, not just a
  // low number with no explanation.
  isColdStart: boolean;
}

// Minimal shape the engine needs from a synced player -- see
// lib/coc-api/types.ts's CocPlayer for the full API response this is drawn
// from.
export interface PlayerTroopLevels {
  townHallLevel: number;
  troops: { name: string; level: number; maxLevel: number; village: "home" | "builderBase" }[];
}

// Minimal shape the engine needs from a base reading -- see
// lib/coc-api/screenshot-cv.ts's CvBaseReading.
export interface BaseDefenseReading {
  detections: { className: string; confidence: number }[];
}

// Minimal shape the engine needs from a player's attack history -- a subset
// of the Attack Prisma model's fields, scoped to one Player per
// .claude/skills/recommendation-engine/SKILL.md's "never query by userId" rule.
export interface PastAttack {
  recommendedStrategy: string;
  starsEarned: number | null;
}
