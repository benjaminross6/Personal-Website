import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { FeedbackFab } from "@/components/FeedbackFab";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: site.name?.trim() ? `%s · ${site.name.trim()}` : "%s · Portfolio",
    default: site.name?.trim() ? site.name.trim() : "Portfolio",
  },
  description:
    site.bio?.trim() ||
    "Personal portfolio website with projects, blog posts, and resume.",
  metadataBase: site.siteUrl?.trim() ? new URL(site.siteUrl.trim()) : undefined,
  openGraph: {
    type: "website",
    title: site.name?.trim() ? site.name.trim() : "Portfolio",
    description:
      site.bio?.trim() ||
      "Personal portfolio website with projects, blog posts, and resume.",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name?.trim() ? site.name.trim() : "Portfolio",
    description:
      site.bio?.trim() ||
      "Personal portfolio website with projects, blog posts, and resume.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <FeedbackFab />
        </div>
      </body>
    </html>
  );
}
