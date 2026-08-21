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

  return (
    <div className="flex flex-col gap-5">
      <AccountSwitcher
        players={players}
        activePlayerId={activePlayerId}
        onSwitch={handleSwitch}
        onAdd={handleAdd}
        switching={status === "syncing"}
      />

      {status === "loadingList" && (
        <Card className="flex items-center justify-center py-12">
          <Spinner className="h-5 w-5 text-text-secondary" />
        </Card>
      )}

      {status === "empty" && (
        <Card className="flex flex-col items-center gap-1 py-12 text-center">
          <p className="text-text-primary">No account synced yet.</p>
          <p className="text-sm text-text-secondary">
            Use &quot;Add account&quot; above with your player tag to get started.
          </p>
        </Card>
      )}

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
