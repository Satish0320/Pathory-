import { TargetIcon, UserIcon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "#profile", label: "Profile", icon: UserIcon },
  { href: "#base-reader", label: "Base Reader", icon: TargetIcon },
] as const;

// In-page anchor nav, not routes -- both sections already exist on the
// dashboard, so these are real jumps, not the dead links
// .claude/skills/interface-states/SKILL.md warns against. Add a real route
// here only once a screen (e.g. 1E's attack-plan page) actually exists.
export function Sidebar() {
  return (
    <nav className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-20 shrink-0 flex-col items-center gap-2 border-r border-white/10 py-6 lg:flex">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          title={label}
          className="flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-xl text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </nav>
  );
}
