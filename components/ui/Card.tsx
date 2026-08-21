import type { ReactNode } from "react";

// Shared elevated-surface treatment per .claude/skills/ui-ux-pro-max/SKILL.md
// -- flat, high-contrast, restrained: a visible border on a slightly
// lighter fill, no glow/gradient decoration. Contrast and typography carry
// the premium feel here, not color washes.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-background-surfaceRaised p-6 ${className}`}
    >
      {children}
    </div>
  );
}
