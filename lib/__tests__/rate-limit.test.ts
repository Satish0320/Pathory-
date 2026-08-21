import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the bucket's max tokens", () => {
    const key = `test-${Math.random()}`;
    const config = { maxTokens: 3, refillIntervalMs: 60_000 };

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("rejects once the bucket is exhausted", () => {
    const key = `test-${Math.random()}`;
    const config = { maxTokens: 2, refillIntervalMs: 60_000 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("refills over time", () => {
    const key = `test-${Math.random()}`;
    const config = { maxTokens: 1, refillIntervalMs: 60_000 };

    checkRateLimit(key, config);
    expect(checkRateLimit(key, config).allowed).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const config = { maxTokens: 1, refillIntervalMs: 60_000 };
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;

    checkRateLimit(keyA, config);
    expect(checkRateLimit(keyA, config).allowed).toBe(false);
    expect(checkRateLimit(keyB, config).allowed).toBe(true);
  });
});
