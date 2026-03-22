"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

export function FeedbackFab() {
  const pathname = usePathname();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    if (!showThanks) return;
    const t = window.setTimeout(() => setShowThanks(false), 4000);
    return () => window.clearTimeout(t);
  }, [showThanks]);

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const website = fd.get("website")?.toString() ?? "";
      const trimmed = message.trim();
      if (!trimmed) return;

      const payload = {
        message: trimmed,
        pathname: pathname || "/",
        website,
      };

      setOpen(false);
      setMessage("");
      setShowThanks(true);

      void fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          console.error("[feedback]", data.error || res.status);
        }
      });
    },
    [message, pathname],
  );

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 sm:bottom-6 sm:left-6">
      {open ? (
        <form
          id={formId}
          onSubmit={submit}
          className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-black/10 bg-background p-4 shadow-lg dark:border-white/15"
        >
          <p className="text-sm font-semibold">Send feedback</p>
          <p className="mt-1 text-xs text-foreground/55">
            Current page:{" "}
            <code className="font-mono text-[11px] text-foreground/80">
              {pathname || "/"}
            </code>
          </p>

          {/* Honeypot */}
          <label className="sr-only" htmlFor={`${formId}-website`}>
            Leave empty
          </label>
          <input
            id={`${formId}-website`}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="pointer-events-none absolute opacity-0"
            aria-hidden
          />

          <label htmlFor={`${formId}-msg`} className="sr-only">
            Your feedback
          </label>
          <textarea
            id={`${formId}-msg`}
            name="message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What would you change or report?"
            className="mt-3 w-full resize-y rounded-xl border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-foreground/20 focus:ring-2 dark:border-white/15"
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-semibold text-background hover:opacity-90"
            >
              Send
            </button>
          </div>
        </form>
      ) : null}

      {showThanks ? (
        <p
          role="status"
          aria-live="polite"
          className="max-w-[min(100vw-2rem,22rem)] rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-foreground dark:border-emerald-400/25 dark:bg-emerald-500/15"
        >
          Thanks ❤️
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) setShowThanks(false);
            return next;
          });
        }}
        className="rounded-full border border-black/15 bg-background px-4 py-2 text-sm font-semibold shadow-md hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.06]"
        aria-label={open ? "Close feedback form" : "Open feedback form"}
      >
        Feedback
      </button>
    </div>
  );
}
