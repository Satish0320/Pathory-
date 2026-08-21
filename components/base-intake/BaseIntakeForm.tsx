"use client";

import { useState } from "react";
import { Spinner } from "@/components/loaders/Spinner";
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

// 1C's base-intake UI: link is a fast TH/type sanity check, CV is the real
// building-position source. Coverage gaps and low confidence are always
// rendered, never silently dropped — see .claude/skills/error-states/SKILL.md
// and the 2026-08-21 correction in .claude/rules/api.md.
export function BaseIntakeForm() {
  const [baseLink, setBaseLink] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });

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
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="baseLink" className="text-sm text-text-secondary">
          Base copy-link (optional — quick TH/type check only)
        </label>
        <input
          id="baseLink"
          type="text"
          value={baseLink}
          onChange={(e) => setBaseLink(e.target.value)}
          placeholder="https://link.clashofclans.com/..."
          className="rounded-md border border-text-disabled bg-background-surface px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-accent-primary focus:outline-none"
        />

        <label htmlFor="screenshot" className="text-sm text-text-secondary">
          Base screenshot (primary source of building positions)
        </label>
        <input
          id="screenshot"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          className="text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-background-surface file:px-3 file:py-2 file:text-text-primary"
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

      {state.status === "error" && <ErrorNote error={state.error} />}

      {state.status === "success" && (
        <div className="flex flex-col gap-3">
          {state.result.linkResult && (
            <div className="rounded-md border border-text-disabled bg-background-surface p-3 text-sm">
              {state.result.linkResult.ok ? (
                <p className="text-text-primary">
                  Link check: TH{state.result.linkResult.data.townHallLevel} ·{" "}
                  {state.result.linkResult.data.baseType === "warBase" ? "War base" : "Home village"}{" "}
                  · slot {state.result.linkResult.data.layoutSlot}
                </p>
              ) : (
                <ErrorNote error={state.result.linkResult.error} />
              )}
            </div>
          )}

          {state.result.cvResult &&
            (state.result.cvResult.ok ? (
              <div className="flex flex-col gap-2 rounded-md border border-text-disabled bg-background-surface p-3 text-sm">
                <p className="text-text-primary">
                  {state.result.cvResult.data.detections.length} building
                  {state.result.cvResult.data.detections.length === 1 ? "" : "s"} detected
                </p>
                {state.result.cvResult.data.overallConfidence < LOW_CONFIDENCE_THRESHOLD && (
                  <p className="text-semantic-warningRecoverable">
                    Low-confidence read — verify building positions manually.
                  </p>
                )}
                {state.result.cvResult.data.coverageGaps.length > 0 && (
                  <p className="text-semantic-warningRecoverable">
                    Not detected yet: {state.result.cvResult.data.coverageGaps.join(", ")} —
                    verify these manually.
                  </p>
                )}
                <ul className="flex flex-col gap-1 text-text-secondary">
                  {state.result.cvResult.data.detections.map((d, i) => (
                    <li key={i}>
                      {d.className} — {Math.round(d.confidence * 100)}% confidence
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ErrorNote error={state.result.cvResult.error} />
            ))}
        </div>
      )}
    </div>
  );
}
