import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";

const CAPABILITIES = [
  {
    number: "01",
    title: "Sync your account",
    detail:
      "Pull real troop, hero, and Town Hall data straight from the Supercell API — not a form you fill in by hand.",
  },
  {
    number: "02",
    title: "Read the base",
    detail:
      "A screenshot gets analyzed for real defense positions; a copy-link confirms Town Hall and base type instantly.",
  },
  {
    number: "03",
    title: "Get the reasoning",
    detail:
      "A strategy recommendation with the actual factors behind it — troop readiness, base layout, your own history — not a black box.",
  },
  {
    number: "04",
    title: "Report back, get sharper",
    detail:
      "Three quick questions after every attack tune your skill profile, so the next recommendation knows more than the last.",
  },
] as const;

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        right={
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-text-primary px-5 py-2.5 text-sm font-semibold text-background-base transition hover:bg-accent-primary"
            >
              Get started
            </Link>
          </div>
        }
      />

      <main className="flex flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          AI coaching for Clash of Clans
        </span>

        <h1 className="mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2 font-display text-4xl font-medium leading-[1.08] tracking-tight text-text-primary sm:text-6xl md:text-7xl">
          <span>Know your attack</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="hidden h-8 w-8 shrink-0 fill-accent-primary sm:block sm:h-11 sm:w-11 md:h-14 md:w-14"
          >
            <path d="M12 2l3.5 7.5L23 12l-7.5 2.5L13 22l-2.5-7.5L3 12l7.5-2.5z" />
          </svg>
          <span>before you throw it</span>
        </h1>

        <p className="mt-8 max-w-lg text-base text-text-secondary sm:text-lg">
          Sync your account, read a base, get a strategy with the reasoning
          behind it — not a guess.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/sign-up"
            className="rounded-full bg-text-primary px-8 py-3.5 text-center font-semibold text-background-base transition hover:bg-accent-primary"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-white/15 px-8 py-3.5 text-center font-semibold text-text-primary transition hover:border-white/30"
          >
            Sign in
          </Link>
        </div>
      </main>

      <section className="border-t border-white/10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                How it works
              </p>
              <h2 className="mt-4 max-w-lg font-display text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">
                One loop, sharper every time.
              </h2>
            </div>
          </div>
          <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.number} className="flex flex-col gap-3 border-t border-white/10 pt-6">
                <span className="font-display text-sm text-text-secondary">{c.number}</span>
                <h3 className="font-display text-xl font-medium text-text-primary">{c.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
