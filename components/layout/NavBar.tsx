import type { ReactNode } from "react";

// Shared top nav shell for both the public landing page and the signed-in
// app -- avoids duplicating the wordmark/border treatment per
// .claude/rules/code-quality.md. Deliberately doesn't add nav links to
// screens that don't exist yet (attack plan, history) -- a dead link is
// worse than no link, per .claude/skills/interface-states/SKILL.md's
// disabled/unavailable-state guidance.
export function NavBar({ right }: { right: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-background-base/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
          Path<span className="text-accent-primary">ory</span>
        </span>
        {right}
      </div>
    </header>
  );
}
