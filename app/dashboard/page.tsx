import { UserButton } from "@clerk/nextjs";
import { NavBar } from "@/components/layout/NavBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AccountSection } from "@/components/account-sync/AccountSection";
import { BaseIntakeForm } from "@/components/base-intake/BaseIntakeForm";

// App shell per the user-provided wireframe: sidebar (in-page section nav)
// + main content. Recommendations/overlay (1E) get their own screen once
// the recommendation engine (1D) has a route to sit behind.
export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <NavBar right={<UserButton />} />
      <div className="mx-auto flex max-w-6xl">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-16 px-6 py-10 sm:px-10">
          <section id="profile" className="flex scroll-mt-24 flex-col gap-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Profile
            </h2>
            <AccountSection />
          </section>
          <section id="base-reader" className="flex scroll-mt-24 flex-col gap-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Base Reader
            </h2>
            <BaseIntakeForm />
          </section>
        </main>
      </div>
    </div>
  );
}
