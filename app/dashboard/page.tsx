import { UserButton } from "@clerk/nextjs";
import { PlayerTagForm } from "@/components/account-sync/PlayerTagForm";

// 1B adds account sync here. Recommendations/overlay/dashboard charts are
// still out of scope until their own BUILD_PLAN.md steps land.
export default function DashboardPage() {
  return (
    <main className="flex min-h-[80vh] flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-lg text-text-primary">Pathory</span>
        <UserButton />
      </header>
      <div className="flex flex-1 flex-col items-center gap-8 px-6 py-12">
        <div className="w-full max-w-sm">
          <PlayerTagForm />
        </div>
      </div>
    </main>
  );
}
