---
name: recommendation-engine
description: Use this skill when writing or modifying anything in lib/recommendation-engine — attack recommendation logic, confidence scoring, reasoning generation, or skill-profile updates. This is the core value proposition of the product; treat it with more rigor than any other part of the codebase.
---

# Building the recommendation engine

## Scope every calculation to a single Player, never a User

A signed-in `User` can hold many `Player` accounts (see `.claude/skills/authentication/SKILL.md`'s multi-account section — competitive players commonly have a dozen or more). Every recommendation, confidence score, and skill-profile calculation is computed from one `Player`'s `Attack` history, queried by `playerId`. Never query or aggregate by `userId` in this module — that would silently blend one account's mistakes and history into another's recommendation, which is both wrong and undermines the entire personalization premise this module exists for.

## Start rule-based, not ML — and say so honestly

At launch there is no attack-outcome dataset to train anything on. The v0 recommendation engine must be a **transparent, rule-based system**: a set of explicit weighted factors (troop level gaps, base defense density by type, historical success rate for this player against similar layouts once that data exists) that combine into a strategy suggestion and a confidence score. Do not reach for a black-box ML model before there's real outcome data to justify it — an opaque model over a handful of attacks will be both wrong and unexplainable, which defeats the entire "why" premise of the product.

## Reasoning must be structured data, not a pre-written string

Wrong:
```ts
recommendation.reasoning = "Your Dragons are strong, use them.";
```

Right:
```ts
recommendation.reasoningFactors = [
  { factor: "troop_strength_gap", detail: "Dragons at max level, ground troops 4 levels behind average for this TH", weight: 0.4 },
  { factor: "base_defense_distribution", detail: "Ground defenses dense (Infernos, X-Bows clustered center); air coverage weaker on 7 o'clock side", weight: 0.35 },
  { factor: "personal_history", detail: "3-star rate on air strategies: 71% (12 attacks); on ground: 38% (8 attacks)", weight: 0.25 },
];
```
The UI renders this into the plain-English explanation. Keeping it structured means: the "why not this other strategy" feature (blueprint §29 equivalent) can reuse the same factors, the confidence score is traceable to specific inputs instead of a guess, and future recalibration against real outcomes only requires adjusting weights, not rewriting prose generation.

## Confidence score honesty

- A confidence score must be computed from the actual factor weights and the amount of personal history available — **not a flat/default number**. A player with 2 logged attacks and a player with 50 should never produce the same confidence shape from similar inputs; low personal history should visibly pull confidence toward a "based on general strategy fit, not yet your personal data" framing.
- Never let confidence exceed what the underlying data supports. If personal history is thin, the reasoning should say so plainly rather than projecting false certainty — this is a coaching product; overconfident wrong advice is worse than honest uncertainty.

## The "why not X" alternative

For every top recommendation, compute at least one runner-up strategy and store why it scored lower using the same factor structure. This is cheap once reasoning is structured correctly, and it's one of the most differentiating features in the blueprint — don't skip it as a "nice to have," it uses no extra data collection, only extra computation over data already gathered.

## Post-attack feedback loop — how self-reports update the profile

The three self-report questions (stars, where it fell apart, did it split) map to specific, named mistake categories, not free text: `early_deployment`, `poor_funnel`, `late_ability`, `spell_mistiming`, `split_army`, `slow_cleanup`. Store the mistake as a category, not a sentence — this is what makes "your funnel dropped from 79% to 62% this month" possible to compute later, and what makes the training-mode feature (Phase 3) trivial to build off existing data once its time comes.

## Testing this module specifically

Per `CLAUDE.md` §7, this module needs the most rigorous test coverage in the codebase:
- Given a fixed account + fixed base, output is deterministic (no hidden randomness in a system that's supposed to be explainable)
- Confidence score moves in the correct direction as personal history grows
- A player with zero attack history still gets a sensible recommendation (cold start), clearly flagged as general-fit rather than personalized
- Reasoning factors sum/normalize consistently so the UI never shows something that doesn't add up
