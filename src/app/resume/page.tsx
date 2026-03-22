import type { Metadata } from "next";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Benjamin Ross' Resume",
  description: "Resume (downloadable PDF).",
};

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Resume</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Here is my resume. Clicking it will open it in another tab.
        </p>
      </header>

      <section className="mt-10 max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <p className="text-sm leading-6 text-foreground/70">
          Resume:
          <a
            className="ml-2 font-semibold text-foreground/80 hover:text-foreground"
            href={site.resumePdfPath}
            target="_blank"
            rel="noreferrer"
          >
            benjamin-ross-resume.pdf
          </a>
        </p>
        <p className="mt-4 text-sm leading-6 text-foreground/70">

        </p>
      </section>
    </div>
  );
}
