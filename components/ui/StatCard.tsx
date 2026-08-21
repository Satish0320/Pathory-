import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  icon,
  label,
  value,
  accent = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: "primary" | "secondary";
}) {
  const accentClass = accent === "primary" ? "text-accent-primary" : "text-accentSecondary";
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className={`flex h-8 w-8 items-center justify-center ${accentClass}`}>{icon}</div>
      <div>
        <p className="font-display text-2xl leading-none text-text-primary">{value}</p>
        <p className="mt-1.5 text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      </div>
    </Card>
  );
}
