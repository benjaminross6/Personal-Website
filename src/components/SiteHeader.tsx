import Link from "next/link";

import { site } from "@/lib/site";
import { toExternalUrl } from "@/lib/socialUrls";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

const socialNav: Array<{ key: keyof typeof site.socials; label: string }> = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "github", label: "GitHub" },
];

export function SiteHeader() {
  const homeLabel = site.name?.trim() ? site.name.trim() : "Your Name";

  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {homeLabel}
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-foreground/80 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {socialNav.map(({ key, label }) => {
            const raw = site.socials[key]?.trim();
            const href = raw ? toExternalUrl(raw) : "";
            return href ? (
              <a
                key={key}
                className="text-sm font-semibold text-foreground/80 hover:text-foreground"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {label}
              </a>
            ) : (
              <span key={key} className="text-sm text-foreground/40">
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
}
