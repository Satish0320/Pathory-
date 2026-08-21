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
    <Card className="flex flex-col gap-2 p-3">
      <div className={`flex h-5 w-5 items-center justify-center ${accentClass}`}>{icon}</div>
      <div>
        <p className="font-display text-lg leading-none text-text-primary">{value}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-text-secondary">{label}</p>
      </div>
    </Card>
  );
}
