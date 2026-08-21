"use client";

import { useState } from "react";
import { Spinner } from "@/components/loaders/Spinner";
import { Card } from "@/components/ui/Card";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";

interface SyncedPlayer {
  id: string;
  name: string;
  townHallLvl: number;
}

interface HeroProfile {
  name: string;
  level: number;
  maxLevel: number;
  village: "home" | "builderBase";
}

interface PlayerProfile {
  name: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  donations: number;
  donationsReceived: number;
  league?: { name: string };
  clan?: { name: string; clanLevel: number };
  heroes: HeroProfile[];
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: UserFacingError }
  | { status: "success"; player: SyncedPlayer; profile: PlayerProfile };

// Short, original text initials for hero display -- never Supercell's own
// hero artwork/icons, per .claude/rules/legal-compliance.md's "no extracted
// game assets" rule.
const HERO_INITIALS: Record<string, string> = {
  "Barbarian King": "BK",
  "Archer Queen": "AQ",
  "Minion Prince": "MP",
  "Grand Warden": "GW",
  "Royal Champion": "RC",
};

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-display text-xl text-text-primary">{value}</p>
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
    </div>
  );
}

// 1B's account-sync UI: player tag in, real Player row out, plus the full
// synced profile rendered so the user can see exactly which account and
// data Pathory has, before the product's own recommendations layer on top.
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
    const { profile } = state;
    const homeHeroes = profile.heroes.filter((h) => h.village === "home");

    return (
      <Card className="flex flex-col gap-5 motion-safe:animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-accent-primary/30 bg-accent-primary/10 font-display text-base font-semibold text-accent-primary">
            TH{profile.townHallLevel}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-text-primary">{profile.name}</p>
            <p className="text-sm text-text-secondary">
              {profile.clan ? `${profile.clan.name} · Lv${profile.clan.clanLevel}` : "No clan"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
          <StatTile label="XP Level" value={profile.expLevel} />
          <StatTile
            label={profile.league?.name ?? "Trophies"}
            value={profile.trophies.toLocaleString()}
          />
          <StatTile label="War Stars" value={profile.warStars.toLocaleString()} />
        </div>

        {homeHeroes.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
            {homeHeroes.map((h) => (
              <div
                key={h.name}
                className="flex items-center gap-2 rounded-full border border-accentSecondary/30 bg-accentSecondary/10 px-3 py-1 text-xs"
              >
                <span className="font-semibold text-accentSecondary">
                  {HERO_INITIALS[h.name] ?? h.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-text-secondary">
                  {h.level}/{h.maxLevel}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
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
