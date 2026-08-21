import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-display text-text-primary">Pathory</h1>
      <p className="max-w-md text-text-secondary">
        AI attack coaching for Clash of Clans. Sign in to get a base-aware
        attack plan with plain-English reasoning.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md bg-accent-primary px-5 py-2 font-medium text-background-base transition hover:bg-accent-primaryHover"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-text-disabled px-5 py-2 font-medium text-text-primary transition hover:border-text-secondary"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
