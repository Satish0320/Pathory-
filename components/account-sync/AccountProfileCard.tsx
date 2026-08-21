import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { CrownIcon, ShieldIcon, StarIcon, SwordIcon, TrophyIcon } from "@/components/ui/icons";

interface UnitLevel {
  name: string;
  level: number;
  maxLevel: number;
  village: "home" | "builderBase";
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
}

// A unit is "maxed" when it's already at the highest level this Town Hall
// allows -- shown with the accent color instead of the neutral tone so a
// player can scan for what still needs upgrading at a glance.
function UnitChip({
  name,
  level,
  maxLevel,
}: {
  name: string;
  level: number;
  maxLevel: number;
}) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </h3>
      {children}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      {homeHeroes.length > 0 && (
        <Section title="Heroes">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {homeHeroes.map((h) => (
              <UnitChip key={h.name} name={h.name} level={h.level} maxLevel={h.maxLevel} />
            ))}
          </div>
        </Section>
      )}

      {homeTroops.length > 0 && (
        <Section title={`Troops (${homeTroops.length})`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {homeTroops.map((t) => (
              <UnitChip key={t.name} name={t.name} level={t.level} maxLevel={t.maxLevel} />
            ))}
          </div>
        </Section>
      )}

      {profile.spells.length > 0 && (
        <Section title={`Spells (${profile.spells.length})`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {profile.spells.map((s) => (
              <UnitChip key={s.name} name={s.name} level={s.level} maxLevel={s.maxLevel} />
            ))}
          </div>
        </Section>
      )}
    </Card>
  );
}
