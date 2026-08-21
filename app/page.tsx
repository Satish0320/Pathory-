import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Abstract gold/violet glow -- no game artwork or Supercell assets,
          per .claude/rules/legal-compliance.md; purely generated gradients. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 h-[32rem] w-[32rem] rounded-full bg-accent-primary/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-accentSecondary/20 blur-[120px]"
      />

      <div className="relative flex flex-col items-center gap-6">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl">
          Path<span className="text-accent-primary">ory</span>
        </h1>
        <p className="max-w-md text-lg text-text-secondary">
          AI attack coaching for Clash of Clans. Sign in to get a base-aware
          attack plan with plain-English reasoning.
        </p>
        <div className="flex gap-4 pt-2">
          <Link
            href="/sign-in"
            className="rounded-md bg-accent-primary px-6 py-2.5 font-medium text-background-base transition hover:bg-accent-primaryHover"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-white/15 px-6 py-2.5 font-medium text-text-primary transition hover:border-white/30 hover:bg-white/5"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
