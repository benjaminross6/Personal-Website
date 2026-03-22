import { site } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 py-10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-sm text-foreground/70">
          © {year} {site.name?.trim() ? site.name.trim() : "Your Name"}
        </p>
      </div>
    </footer>
  );
}
