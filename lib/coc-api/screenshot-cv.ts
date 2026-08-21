// Screenshot CV client — the primary source of building-position data per
// the 2026-08-21 correction in .claude/rules/api.md (base copy-links can't
// provide this; see base-link-decoder.ts). Calls a Roboflow-hosted model,
// never trains one from scratch.
//
// v0 known gap: the model this points at (find-this-base/clash-of-clans-vop4y,
// forked into this project's own Roboflow workspace so it can be fine-tuned)
// detects defense buildings only — no Traps, no Walls. `coverageGaps` below
// exists specifically so that gap is a first-class part of the data shape,
// not something the UI has to remember to caveat. Never remove a class from
// coverageGaps until the deployed model version actually detects it.

const COVERAGE_GAPS_V0 = ["traps", "walls"] as const;

export interface CvDetection {
  className: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface CvBaseReading {
  source: "screenshot_cv";
  detections: CvDetection[];
  // Classes this model version structurally cannot detect — always
  // non-empty until the model is fine-tuned to cover them. See
  // .claude/rules/error-states/SKILL.md's low-confidence-read guidance:
  // this must reach the UI, never just live in a code comment.
  coverageGaps: readonly string[];
  overallConfidence: number;
}

interface RoboflowPrediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoboflowResponse {
  predictions: RoboflowPrediction[];
}

function requireConfig() {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const modelEndpoint = process.env.ROBOFLOW_MODEL_ENDPOINT;
  if (!apiKey || !modelEndpoint) {
    throw new Error(
      "ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ENDPOINT must be set — see .env.example and .claude/rules/api.md"
    );
  }
  return { apiKey, modelEndpoint };
}

function averageConfidence(predictions: RoboflowPrediction[]): number {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, p) => acc + p.confidence, 0);
  return sum / predictions.length;
}

// image is a base64-encoded JPEG/PNG (no data: URL prefix) — the caller
// (the base-intake upload route, once built) owns getting the screenshot
// into that shape.
export async function analyzeBaseScreenshot(
  imageBase64: string
): Promise<CvBaseReading> {
  const { apiKey, modelEndpoint } = requireConfig();

  const res = await fetch(`${modelEndpoint}?api_key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: imageBase64,
  });

  if (!res.ok) {
    throw new Error(`Roboflow inference request failed with status ${res.status}`);
  }

  const data = (await res.json()) as RoboflowResponse;

  return {
    source: "screenshot_cv",
    detections: data.predictions.map((p) => ({
      className: p.class,
      confidence: p.confidence,
      boundingBox: { x: p.x, y: p.y, width: p.width, height: p.height },
    })),
    coverageGaps: COVERAGE_GAPS_V0,
    overallConfidence: averageConfidence(data.predictions),
  };
}
