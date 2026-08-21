"use client";

import { useState } from "react";
import { Spinner } from "@/components/loaders/Spinner";
import { Card } from "@/components/ui/Card";
import { AccountProfileCard, type PlayerProfile } from "./AccountProfileCard";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";

interface SyncedPlayer {
  id: string;
  name: string;
  townHallLvl: number;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: UserFacingError }
  | { status: "success"; player: SyncedPlayer; profile: PlayerProfile };

// 1B's account-sync UI: player tag in, real Player row out, plus the full
// synced profile rendered (AccountProfileCard) so the user can see exactly
// which account and data Pathory has, before the product's own
// recommendations layer on top. Each state below is deliberate per
// .claude/skills/interface-states/SKILL.md, and errors render via the
// shared what/why/action shape from .claude/skills/error-states/SKILL.md.
export function PlayerTagForm() {
  const [tag, setTag] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  const isSubmitDisabled = state.status === "loading" || tag.trim().length < 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerTag: tag.trim() }),
      });
      const body = await res.json();

      if (!res.ok) {
        setState({ status: "error", error: body.error as UserFacingError });
        return;
      }
      setState({
        status: "success",
        player: body.player as SyncedPlayer,
        profile: body.profile as PlayerProfile,
      });
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

  if (state.status === "success") {
    return <AccountProfileCard profile={state.profile} />;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="playerTag" className="text-sm text-text-secondary">
          Player tag
        </label>
        <input
          id="playerTag"
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#ABC123"
          className="rounded-md border border-white/10 bg-background-surface px-3 py-2 text-text-primary placeholder:text-text-disabled transition-colors focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-medium text-background-base transition hover:bg-accent-primaryHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === "loading" && <Spinner className="h-4 w-4" />}
          {state.status === "loading" ? "Syncing…" : "Sync account"}
        </button>
        {state.status === "error" && (
          <div className="rounded-md border border-semantic-errorSystem/40 bg-background-surface p-3 text-sm">
            <p className="text-text-primary">{state.error.what}</p>
            <p className="mt-1 text-text-secondary">{state.error.why}</p>
            <p className="mt-1 text-accent-primary">{state.error.action}</p>
          </div>
        )}
      </form>
    </Card>
  );
}
