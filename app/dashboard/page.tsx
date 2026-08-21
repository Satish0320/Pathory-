import { UserButton } from "@clerk/nextjs";

// 1A's gate is just this: a signed-in person lands here, in production.
// No Player data, recommendations, or charts belong on this page yet —
// those are 1B onward per BUILD_PLAN.md.
export default function DashboardPage() {
  return (
    <main className="flex min-h-[80vh] flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-lg text-text-primary">Pathory</span>
        <UserButton />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-text-secondary">
          You&apos;re signed in. Account sync and attack recommendations land
          next.
        </p>
      </div>
    </main>
  );
}
