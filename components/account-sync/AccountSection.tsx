"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/loaders/Spinner";
import { AccountSwitcher, type SyncedPlayerSummary } from "./AccountSwitcher";
import { AccountProfileCard, type PlayerProfile } from "./AccountProfileCard";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";

type Status = "loadingList" | "empty" | "syncing" | "ready" | "error";

const OFFLINE_ERROR: UserFacingError = {
  what: "You seem to be offline.",
  why: "We can't reach our servers right now.",
  action: "Check your connection and try again.",
  recoverable: true,
};

type SyncResult =
  | { ok: true; player: SyncedPlayerSummary; profile: PlayerProfile }
  | { ok: false; error: UserFacingError };

async function syncTag(tag: string): Promise<SyncResult> {
  try {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerTag: tag }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body.error as UserFacingError };
    return { ok: true, player: body.player as SyncedPlayerSummary, profile: body.profile as PlayerProfile };
  } catch {
    return { ok: false, error: OFFLINE_ERROR };
  }
}

// First-sync form: always visible when no account is linked yet, not
// hidden behind a toggle. A brand-new user landing here right after
// sign-up needs an obvious next action, not a small "+" pill to notice --
// that gap read as "nothing happens after login" in practice.
function FirstSyncForm({ onAdd }: { onAdd: (tag: string) => Promise<UserFacingError | null> }) {
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<UserFacingError | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await onAdd(tag.trim());
    setSubmitting(false);
    if (result) setError(result);
  }

  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <div>
        <p className="font-display text-lg text-text-primary">Sync your account</p>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your player tag to pull your account into Pathory.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#ABC123"
          className="rounded-md border border-white/10 bg-background-surface px-3 py-2 text-center text-text-primary placeholder:text-text-disabled focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || tag.trim().length < 3}
          className="flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-medium text-background-base transition hover:bg-accent-primaryHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Syncing…" : "Sync account"}
        </button>
      </form>
      {error && (
        <div className="w-full max-w-xs rounded-md border border-semantic-errorSystem/40 bg-background-surface p-3 text-left text-sm">
          <p className="text-text-primary">{error.what}</p>
          <p className="mt-1 text-text-secondary">{error.why}</p>
          <p className="mt-1 text-accent-primary">{error.action}</p>
        </div>
      )}
    </Card>
  );
}

// Orchestrates the account switcher + synced profile per the user-provided
// wireframe: a top bar of account chips, and the active account's full
// profile below. Switching re-syncs that account (fresh data on every
// switch, not a stale cache), reusing the same POST /api/players endpoint
// the initial sync and "add account" flows already use.
export function AccountSection() {
  const [players, setPlayers] = useState<SyncedPlayerSummary[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [status, setStatus] = useState<Status>("loadingList");
  const [error, setError] = useState<UserFacingError | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/players");
        const body = await res.json();
        const list = (body.players ?? []) as SyncedPlayerSummary[];
        setPlayers(list);

        if (list.length === 0) {
          setStatus("empty");
          return;
        }

        const primary = list.find((p) => p.isPrimary) ?? list[0]!;
        setActivePlayerId(primary.id);
        setStatus("syncing");
        const result = await syncTag(primary.playerTag);
        if (!result.ok) {
          setError(result.error);
          setStatus("error");
          return;
        }
        setProfile(result.profile);
        setStatus("ready");
      } catch {
        setError(OFFLINE_ERROR);
        setStatus("error");
      }
    })();
  }, []);

  const handleSwitch = useCallback(
    async (playerId: string) => {
      const target = players.find((p) => p.id === playerId);
      if (!target) return;
      setActivePlayerId(playerId);
      setStatus("syncing");
      const result = await syncTag(target.playerTag);
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setProfile(result.profile);
      setStatus("ready");
    },
    [players]
  );

  const handleAdd = useCallback(async (tag: string): Promise<UserFacingError | null> => {
    const result = await syncTag(tag);
    if (!result.ok) return result.error;

    setPlayers((prev) =>
      prev.some((p) => p.id === result.player.id) ? prev : [...prev, result.player]
    );
    setActivePlayerId(result.player.id);
    setProfile(result.profile);
    setStatus("ready");
    return null;
  }, []);

  if (status === "loadingList") {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner className="h-5 w-5 text-text-secondary" />
      </Card>
    );
  }

  if (status === "empty") {
    return <FirstSyncForm onAdd={handleAdd} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <AccountSwitcher
        players={players}
        activePlayerId={activePlayerId}
        onSwitch={handleSwitch}
        onAdd={handleAdd}
        switching={status === "syncing"}
      />

      {status === "syncing" && !profile && (
        <Card className="flex items-center justify-center py-12">
          <Spinner className="h-5 w-5 text-text-secondary" />
        </Card>
      )}

      {status === "error" && error && (
        <Card>
          <p className="text-text-primary">{error.what}</p>
          <p className="mt-1 text-sm text-text-secondary">{error.why}</p>
          <p className="mt-1 text-sm text-accent-primary">{error.action}</p>
        </Card>
      )}

      {profile && (status === "ready" || status === "syncing") && (
        <AccountProfileCard profile={profile} />
      )}
    </div>
  );
}
