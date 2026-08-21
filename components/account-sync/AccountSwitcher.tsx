"use client";

import { useState } from "react";
import { Spinner } from "@/components/loaders/Spinner";
import { PlusIcon } from "@/components/ui/icons";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";

export interface SyncedPlayerSummary {
  id: string;
  playerTag: string;
  name: string;
  townHallLvl: number;
  isPrimary: boolean;
}

// Chip-per-account switcher per .claude/skills/authentication/SKILL.md's
// account-switcher section: "a compact account-picker (avatar/TH-badge +
// label) accessible from a consistent place," closer to a browser
// multi-profile switcher than a buried settings toggle. Includes the add-
// account affordance inline rather than as a separate screen.
export function AccountSwitcher({
  players,
  activePlayerId,
  onSwitch,
  onAdd,
  switching,
}: {
  players: SyncedPlayerSummary[];
  activePlayerId: string | null;
  onSwitch: (playerId: string) => void;
  onAdd: (tag: string) => Promise<UserFacingError | null>;
  switching: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<UserFacingError | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await onAdd(tag.trim());
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    setTag("");
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {players.map((p) => {
        const isActive = p.id === activePlayerId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSwitch(p.id)}
            disabled={switching}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
              isActive
                ? "border-accent-primary/40 bg-accent-primary/10 text-text-primary"
                : "border-white/10 text-text-secondary hover:border-white/25 hover:text-text-primary"
            }`}
          >
            <span className="font-display text-xs font-semibold text-accent-primary">
              TH{p.townHallLvl}
            </span>
            {p.name}
          </button>
        );
      })}

      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="#ABC123"
            className="w-28 rounded-full border border-white/10 bg-background-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || tag.trim().length < 3}
            className="flex items-center gap-1 rounded-full bg-text-primary px-3 py-1.5 text-sm font-medium text-background-base transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Spinner className="h-3.5 w-3.5" />}
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError(null);
            }}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-sm text-text-secondary transition hover:border-white/40 hover:text-text-primary"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add account
        </button>
      )}

      {error && <p className="w-full text-xs text-semantic-errorSystem">{error.what}</p>}
    </div>
  );
}
