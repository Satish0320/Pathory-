import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        right={
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-background-base transition hover:bg-accent-primaryHover"
            >
              Get started
            </Link>
          </div>
        }
      />

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center sm:py-24">
        {/* Abstract gold/violet glow + grain -- no game artwork or Supercell
            assets, per .claude/rules/legal-compliance.md; purely generated
            gradients and an SVG noise filter for editorial depth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-56 h-[40rem] w-[40rem] rounded-full bg-accent-primary/25 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-56 right-1/4 h-[36rem] w-[36rem] rounded-full bg-accentSecondary/25 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Vignette so the hero reads darker/deeper at the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]"
        />

        <div className="relative flex max-w-2xl flex-col items-center gap-7">
          <span className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-accent-primary">
            AI coaching for Clash of Clans
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-6xl sm:leading-[0.95] md:text-7xl">
            Know your attack before you throw it.
          </h1>
          <p className="max-w-md text-base text-text-secondary sm:text-lg">
            Sync your account, read a base, get a strategy with the reasoning
            behind it — not a guess.
          </p>
          <div className="flex w-full flex-col gap-3 pt-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              href="/sign-up"
              className="rounded-md bg-accent-primary px-7 py-3 text-center font-semibold text-background-base transition hover:bg-accent-primaryHover"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-md border border-white/15 px-7 py-3 text-center font-semibold text-text-primary transition hover:border-white/30 hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
