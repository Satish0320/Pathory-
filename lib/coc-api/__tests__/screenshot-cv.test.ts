import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { analyzeBaseScreenshot } from "../screenshot-cv";

const server = setupServer();
const MODEL_ENDPOINT = "https://detect.roboflow.com/clash-of-clans-vop4y/5";

beforeAll(() => {
  process.env.ROBOFLOW_API_KEY = "test-key";
  process.env.ROBOFLOW_MODEL_ENDPOINT = MODEL_ENDPOINT;
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("analyzeBaseScreenshot", () => {
  it("maps Roboflow predictions and always reports the v0 coverage gaps", async () => {
    server.use(
      http.post("https://detect.roboflow.com/clash-of-clans-vop4y/5", () =>
        HttpResponse.json({
          predictions: [
            { class: "Xbow", confidence: 0.82, x: 100, y: 120, width: 40, height: 40 },
            { class: "AD", confidence: 0.6, x: 200, y: 80, width: 40, height: 40 },
          ],
        })
      )
    );

    const result = await analyzeBaseScreenshot("base64imagedata");

    expect(result.source).toBe("screenshot_cv");
    expect(result.detections).toHaveLength(2);
    expect(result.detections[0]).toEqual({
      className: "Xbow",
      confidence: 0.82,
      boundingBox: { x: 100, y: 120, width: 40, height: 40 },
    });
    expect(result.overallConfidence).toBeCloseTo(0.71, 2);
    expect(result.coverageGaps).toContain("traps");
    expect(result.coverageGaps).toContain("walls");
  });

  it("reports zero confidence and no detections for an empty prediction set", async () => {
    server.use(
      http.post("https://detect.roboflow.com/clash-of-clans-vop4y/5", () =>
        HttpResponse.json({ predictions: [] })
      )
    );

    const result = await analyzeBaseScreenshot("base64imagedata");
    expect(result.detections).toHaveLength(0);
    expect(result.overallConfidence).toBe(0);
    // Even with zero detections, coverage gaps must still be reported —
    // an empty result must never read as "traps/walls confirmed absent".
    expect(result.coverageGaps.length).toBeGreaterThan(0);
  });

  it("throws when the Roboflow request fails", async () => {
    server.use(
      http.post("https://detect.roboflow.com/clash-of-clans-vop4y/5", () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    await expect(analyzeBaseScreenshot("base64imagedata")).rejects.toThrow();
  });
});
