import { UserButton } from "@clerk/nextjs";
import { NavBar } from "@/components/layout/NavBar";
import { PlayerTagForm } from "@/components/account-sync/PlayerTagForm";
import { BaseIntakeForm } from "@/components/base-intake/BaseIntakeForm";

// 1B adds account sync, 1C adds base intake, below. Recommendations/overlay
// (1E) get their own screen once the recommendation engine (1D) has a route
// to sit behind — this page stays a lightweight hub, not where that UI lives.
export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <NavBar right={<UserButton />} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-12">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Account
          </h2>
          <PlayerTagForm />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Read a base
          </h2>
          <BaseIntakeForm />
        </section>
      </main>
    </div>
  );
}
