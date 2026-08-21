import type { ReactNode } from "react";

// Shared elevated-surface treatment per .claude/skills/ui-ux-pro-max/SKILL.md
// -- every card-like section uses this instead of a bespoke bordered div per
// screen, per .claude/rules/code-quality.md's no-repetition rule. Uses a
// visible lighter fill + top-edge highlight + real shadow so it reads as
// elevated against the near-black background, not just a faint outline.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent bg-background-surfaceRaised p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_16px_40px_-16px_rgba(0,0,0,0.7)] ${className}`}
    >
      {children}
    </div>
  );
}
