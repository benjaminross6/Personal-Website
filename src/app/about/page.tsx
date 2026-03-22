import type { Metadata } from "next";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "A little about me, my skills, and what I’m looking for.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">About</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Fill this in later in <code className="font-mono">src/lib/site.ts</code>
          .
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <h2 className="text-sm font-semibold text-foreground/80">Bio</h2>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            {site.bio?.trim()
              ? site.bio
              : "Write 3–6 sentences about what you do, what you care about, and the kind of work you want to do next."}
          </p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <h2 className="text-sm font-semibold text-foreground/80">
            Details (placeholders)
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-6">
              <dt className="text-foreground/60">Location</dt>
              <dd className="text-right text-foreground/80">
                {site.location?.trim() ? site.location : "City, Country"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-6">
              <dt className="text-foreground/60">Headline</dt>
              <dd className="text-right text-foreground/80">
                {site.headline?.trim() ? site.headline : "Role / Specialty"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
