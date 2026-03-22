import type { Metadata } from "next";

import { site } from "@/lib/site";
import { toExternalUrl } from "@/lib/socialUrls";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch by email or book a time to meet.",
};

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export default function ContactPage() {
  const email = site.email?.trim();
  const bookingUrl = site.bookingUrl?.trim()
    ? toExternalUrl(site.bookingUrl.trim())
    : "";

  return (
    <div className="relative mx-auto max-w-5xl px-6 py-14">
      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px max-w-2xl bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        aria-hidden
      />

      <header className="relative max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-foreground/45">
          Contact
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          Coffee Chat?
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/65">
          Reach out by email or grab a slot on my calendar—whichever works best
          for you.
        </p>
      </header>

      <section className="mt-12 grid max-w-3xl gap-5 md:grid-cols-2 md:gap-6">
        {/* Email */}
        <div
          className="group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-gradient-to-br from-white to-black/[0.02] p-7 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:from-black dark:to-white/[0.03]"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/80 ring-1 ring-foreground/10 dark:bg-white/5 dark:ring-white/10">
              <MailIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">Email</h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/55">
                Send a message and I&apos;ll get back to you.
              </p>
              {email ? (
                <a
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground/[0.06] px-4 text-center text-sm font-semibold text-foreground transition hover:bg-foreground/[0.1] dark:bg-white/10 dark:hover:bg-white/[0.14]"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-3 text-sm text-foreground/50">
                  Add <code className="font-mono text-xs">email</code> in{" "}
                  <code className="font-mono text-xs">src/lib/site.ts</code>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking */}
        <div
          className="group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-gradient-to-br from-white to-black/[0.02] p-7 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:from-black dark:to-white/[0.03]"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/25">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Book a Google Meet
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/55">
                Pick a time that works for you—meetings are on Google Meet.
              </p>
              {bookingUrl ? (
                <a
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book a time
                </a>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-3 text-sm leading-relaxed text-foreground/50">
                  Add <code className="font-mono text-xs">bookingUrl</code> in{" "}
                  <code className="font-mono text-xs">src/lib/site.ts</code>{" "}
                  (Google Calendar appointment link).
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-foreground/40">
        Prefer something else? Use the LinkedIn, Instagram, or GitHub links in
        the header.
      </p>
    </div>
  );
}
