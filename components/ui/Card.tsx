import type { ReactNode } from "react";

// Shared elevated-surface treatment per .claude/skills/ui-ux-pro-max/SKILL.md
// -- every card-like section (account status, base intake, later the
// attack-plan reasoning panel) uses this instead of a bespoke bordered div
// per screen, per .claude/rules/code-quality.md's no-repetition rule.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/5 bg-background-surfaceRaised p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.5)] ${className}`}
    >
      {children}
    </div>
  );
}
