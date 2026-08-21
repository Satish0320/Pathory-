"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { CrownIcon, ShieldIcon, StarIcon, SwordIcon, TrophyIcon } from "@/components/ui/icons";

interface UnitLevel {
  name: string;
  level: number;
  maxLevel: number;
  village: "home" | "builderBase";
}

interface Achievement {
  name: string;
  stars: number;
  value: number;
  target: number;
  info: string;
}

export interface PlayerProfile {
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
  heroes: UnitLevel[];
  troops: UnitLevel[];
  spells: { name: string; level: number; maxLevel: number }[];
  achievements: Achievement[];
}

const COLLAPSED_UNIT_COUNT = 6;

// A unit is "maxed" when it's already at the highest level this Town Hall
// allows -- shown with the accent color instead of the neutral tone so a
// player can scan for what still needs upgrading at a glance.
function UnitChip({ name, level, maxLevel }: { name: string; level: number; maxLevel: number }) {
  const isMaxed = level >= maxLevel && maxLevel > 0;
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
        isMaxed
          ? "border-accent-primary/30 bg-accent-primary/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <span className="truncate text-text-secondary">{name}</span>
      <span className={isMaxed ? "font-semibold text-accent-primary" : "text-text-primary"}>
        {level}
        <span className="text-text-disabled">/{maxLevel}</span>
      </span>
    </div>
  );
}

// Collapsible by default -- a 44-troop wall of chips is exactly the "dense
// table as primary interface" .claude/skills/ui-ux-pro-max/SKILL.md warns
// against. Shows the strongest few plus a summary "power score" up front;
// full list is one click away, not a scroll marathon.
function UnitSection({ title, units }: { title: string; units: UnitLevel[] }) {
  const [expanded, setExpanded] = useState(false);
  if (units.length === 0) return null;

  const avgReadiness = Math.round(
    (units.reduce((sum, u) => sum + (u.maxLevel > 0 ? u.level / u.maxLevel : 0), 0) /
      units.length) *
      100
  );
  const sorted = [...units].sort((a, b) => b.level / b.maxLevel - a.level / a.maxLevel);
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_UNIT_COUNT);

  return (
    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {title} <span className="text-text-disabled">({units.length})</span>
        </h3>
        <span className="text-xs text-text-secondary">{avgReadiness}% ready</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((u) => (
          <UnitChip key={u.name} name={u.name} level={u.level} maxLevel={u.maxLevel} />
        ))}
      </div>
      {units.length > COLLAPSED_UNIT_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-medium text-accent-primary transition hover:text-accent-primaryHover"
        >
          {expanded ? "Show less" : `Show all ${units.length}`}
        </button>
      )}
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const progress = Math.min(100, Math.round((achievement.value / achievement.target) * 100));
  return (
    <div className="flex w-40 shrink-0 flex-col gap-2 rounded-lg border border-accentSecondary/20 bg-accentSecondary/[0.06] p-3">
      <div className="flex items-center justify-between">
        <span className="truncate text-xs font-medium text-text-primary">{achievement.name}</span>
        <span className="text-xs text-accentSecondary">{"★".repeat(achievement.stars)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accentSecondary"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[11px] text-text-disabled">
        {achievement.value.toLocaleString()} / {achievement.target.toLocaleString()}
      </p>
    </div>
  );
}

// The full synced account view -- shows everything Pathory pulled from the
// Supercell API, per the explicit product requirement that a user should
// see exactly where their account stands before any recommendation layers
// on top. Text/badge-based throughout, never Supercell's own troop/hero
// artwork (.claude/rules/legal-compliance.md).
export function AccountProfileCard({ profile }: { profile: PlayerProfile }) {
  const homeHeroes = profile.heroes.filter((h) => h.village === "home");
  const homeTroops = profile.troops.filter((t) => t.village === "home");
  const notableAchievements = [...profile.achievements]
    .sort((a, b) => b.value / b.target - a.value / a.target)
    .slice(0, 10);

  return (
    <Card className="flex flex-col gap-5 motion-safe:animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-accent-primary/30 bg-gradient-to-br from-accent-primary/20 to-transparent font-display text-lg font-bold text-accent-primary">
          TH{profile.townHallLevel}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-xl text-text-primary">{profile.name}</p>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <ShieldIcon className="h-3.5 w-3.5" />
            {profile.clan ? `${profile.clan.name} · Lv${profile.clan.clanLevel}` : "No clan"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<CrownIcon />} label="XP Level" value={profile.expLevel} />
        <StatCard
          icon={<TrophyIcon />}
          label={profile.league?.name ?? "Trophies"}
          value={profile.trophies.toLocaleString()}
          accent="secondary"
        />
        <StatCard icon={<StarIcon />} label="War Stars" value={profile.warStars.toLocaleString()} />
        <StatCard
          icon={<SwordIcon />}
          label="Donated"
          value={profile.donations.toLocaleString()}
          accent="secondary"
        />
      </div>

      {notableAchievements.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Achievements
          </h3>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {notableAchievements.map((a) => (
              <AchievementBadge key={a.name} achievement={a} />
            ))}
          </div>
        </div>
      )}

      <UnitSection title="Heroes" units={homeHeroes} />
      <UnitSection title="Troops" units={homeTroops} />
      <UnitSection
        title="Spells"
        units={profile.spells.map((s) => ({ ...s, village: "home" as const }))}
      />
    </Card>
  );
}
