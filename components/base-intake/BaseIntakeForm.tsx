"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/loaders/Spinner";
import { Card } from "@/components/ui/Card";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";

interface LinkCheck {
  townHallLevel: number;
  baseType: "warBase" | "homeVillage";
  layoutSlot: number;
}

interface CvDetection {
  className: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface CvReading {
  detections: CvDetection[];
  coverageGaps: string[];
  overallConfidence: number;
}

type FieldResult<T> = { ok: true; data: T } | { ok: false; error: UserFacingError };

interface IntakeResponse {
  linkResult: FieldResult<LinkCheck> | null;
  cvResult: FieldResult<CvReading> | null;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: UserFacingError }
  | { status: "success"; result: IntakeResponse };

const LOW_CONFIDENCE_THRESHOLD = 0.5;

function ErrorNote({ error }: { error: UserFacingError }) {
  return (
    <div className="rounded-md border border-semantic-errorSystem/40 bg-background-surface p-3 text-sm">
      <p className="text-text-primary">{error.what}</p>
      <p className="mt-1 text-text-secondary">{error.why}</p>
      <p className="mt-1 text-accent-primary">{error.action}</p>
    </div>
  );
}

// Groups repeated detections by class (e.g. 6 Canons) into one scannable
// row with a count and average confidence, rather than a flat list of
// near-duplicate lines.
function groupDetections(detections: CvDetection[]) {
  const groups = new Map<string, { count: number; totalConfidence: number }>();
  for (const d of detections) {
    const existing = groups.get(d.className) ?? { count: 0, totalConfidence: 0 };
    groups.set(d.className, {
      count: existing.count + 1,
      totalConfidence: existing.totalConfidence + d.confidence,
    });
  }
  return Array.from(groups.entries())
    .map(([className, { count, totalConfidence }]) => ({
      className,
      count,
      avgConfidence: totalConfidence / count,
    }))
    .sort((a, b) => b.count - a.count);
}

// 1C's base-intake UI: link is a fast TH/type sanity check, CV is the real
// building-position source. Two-column layout per user-provided wireframe --
// input/preview on the left, analysis result on the right, rather than a
// single stacked flow. Coverage gaps and low confidence are always
// rendered, never silently dropped, per .claude/skills/error-states/SKILL.md.
export function BaseIntakeForm() {
  const [baseLink, setBaseLink] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });

  // Derived from screenshot, not separate state -- avoids the effect just
  // to sync one value from another. Cleanup (revoking the blob URL) still
  // needs an effect, but it no longer calls setState in its body.
  const previewUrl = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : null),
    [screenshot]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasInput = baseLink.trim().length > 0 || screenshot !== null;
  const isSubmitDisabled = state.status === "loading" || !hasInput;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });

    const formData = new FormData();
    if (baseLink.trim()) formData.append("baseLink", baseLink.trim());
    if (screenshot) formData.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/base-intake", { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        setState({ status: "error", error: body.error as UserFacingError });
        return;
      }
      setState({ status: "success", result: body as IntakeResponse });
    } catch {
      setState({
        status: "error",
        error: {
          what: "You seem to be offline.",
          why: "We can't reach our servers right now.",
          action: "Check your connection and try again.",
          recoverable: true,
        },
      });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="baseLink" className="text-sm text-text-secondary">
            Base copy-link <span className="text-text-disabled">(quick TH/type check)</span>
          </label>
          <input
            id="baseLink"
            type="text"
            value={baseLink}
            onChange={(e) => setBaseLink(e.target.value)}
            placeholder="https://link.clashofclans.com/..."
            className="rounded-md border border-white/10 bg-background-surface px-3 py-2 text-text-primary placeholder:text-text-disabled transition-colors focus:border-accent-primary focus:outline-none"
          />

          <label htmlFor="screenshot" className="text-sm text-text-secondary">
            Base screenshot <span className="text-text-disabled">(primary source)</span>
          </label>
          <input
            id="screenshot"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            className="text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-background-surface file:px-3 file:py-2 file:text-text-primary file:transition-colors hover:file:bg-white/5"
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-medium text-background-base transition hover:bg-accent-primaryHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "loading" && <Spinner className="h-4 w-4" />}
            {state.status === "loading" ? "Reading base…" : "Read base"}
          </button>
        </form>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied blob URL, not an optimizable static asset
          <img
            src={previewUrl}
            alt="Uploaded base screenshot preview"
            className="max-h-80 w-full rounded-lg border border-white/10 object-cover"
          />
        )}

        {state.status === "success" && state.result.linkResult && (
          <div className="rounded-md border border-white/10 bg-background-surface p-3 text-sm">
            {state.result.linkResult.ok ? (
              <p className="text-text-primary">
                <span className="font-display font-semibold">
                  TH{state.result.linkResult.data.townHallLevel}
                </span>{" "}
                ·{" "}
                {state.result.linkResult.data.baseType === "warBase"
                  ? "War base"
                  : "Home village"}{" "}
                · slot {state.result.linkResult.data.layoutSlot}
              </p>
            ) : (
              <ErrorNote error={state.result.linkResult.error} />
            )}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          AI analysis
        </h3>

        {state.status === "idle" && (
          <p className="flex flex-1 items-center justify-center text-center text-sm text-text-disabled">
            Add a link or screenshot and read a base to see the analysis here.
          </p>
        )}

        {state.status === "error" && <ErrorNote error={state.error} />}

        {state.status === "success" &&
          state.result.cvResult &&
          (state.result.cvResult.ok ? (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <p className="font-display text-2xl text-text-primary">
                  {state.result.cvResult.data.detections.length}
                </p>
                <p className="text-sm text-text-secondary">buildings detected</p>
              </div>

              {state.result.cvResult.data.overallConfidence < LOW_CONFIDENCE_THRESHOLD && (
                <p className="rounded-md bg-semantic-warningRecoverable/10 px-3 py-2 text-sm text-semantic-warningRecoverable">
                  Low-confidence read — verify building positions manually.
                </p>
              )}
              {state.result.cvResult.data.coverageGaps.length > 0 && (
                <p className="rounded-md bg-semantic-warningRecoverable/10 px-3 py-2 text-sm text-semantic-warningRecoverable">
                  Not detected yet: {state.result.cvResult.data.coverageGaps.join(", ")} —
                  verify these manually.
                </p>
              )}

              <ul className="flex max-h-72 flex-col divide-y divide-white/5 overflow-y-auto">
                {groupDetections(state.result.cvResult.data.detections).map((g) => (
                  <li
                    key={g.className}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-text-primary">
                      {g.className}
                      {g.count > 1 && <span className="text-text-secondary"> ×{g.count}</span>}
                    </span>
                    <span className="text-text-secondary">
                      {Math.round(g.avgConfidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ErrorNote error={state.result.cvResult.error} />
          ))}
      </Card>
    </div>
  );
}
