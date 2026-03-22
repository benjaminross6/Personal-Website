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
          Put your resume PDF in <code className="font-mono">public/</code> and
          set <code className="font-mono">resumePdfPath</code> in{" "}
          <code className="font-mono">src/lib/site.ts</code> (currently{" "}
          <code className="font-mono">benjamin-ross-resume.pdf</code>).
        </p>
      </header>

      <section className="mt-10 max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <p className="text-sm leading-6 text-foreground/70">
          Download:
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
          Prefer an in-page resume? You can replace this page with sections and
          keep the PDF as a download.
        </p>
      </section>
    </div>
  );
}
