import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function Home() {
  const displayName = site.name?.trim() ? site.name.trim() : "Benjamin Ross";
  const headline = site.headline?.trim() ? site.headline.trim() : "Student";
  const bio = site.bio?.trim()
    ? site.bio.trim()
    : "Add a one or two sentence intro in src/lib/site.ts.";

  const featuredProjects = (site.projects ?? []).filter((p) => p.featured);
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div className="space-y-5">
          <p className="text-sm text-foreground/60">Personal portfolio</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {displayName}
          </h1>
          <p className="text-base font-semibold text-foreground/70">{headline}</p>
          <p className="text-lg leading-7 text-foreground/70">
            {bio}{" "}
            {!site.bio?.trim() ? (
              <>
                <span className="text-foreground/50">
                  (edit <code className="font-mono">src/lib/site.ts</code>)
                </span>
              </>
            ) : null}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90"
              href="/projects"
            >
              View projects
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-semibold text-foreground hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              href="/blog"
            >
              Read the blog
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-sm font-semibold">Quick links</p>
          <div className="mt-4 grid gap-2 text-sm text-foreground/80">
            <a
              className="hover:text-foreground"
              href={site.resumePdfPath}
              target="_blank"
              rel="noreferrer"
            >
              Resume
            </a>
            <Link className="hover:text-foreground" href="/contact">
              Contact
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Featured projects
          </h2>
          <Link className="text-sm font-semibold hover:underline" href="/projects">
            All projects →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {(featuredProjects.length ? featuredProjects : site.projects ?? [])
            .slice(0, 4)
            .map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="text-xl font-semibold tracking-tight">Recent posts</h2>
          <Link className="text-sm font-semibold hover:underline" href="/blog">
            All posts →
          </Link>
        </div>
        <div className="mt-6 grid gap-6">
          {recentPosts.length ? (
            recentPosts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-sm text-foreground/70">
              No posts yet. Add Markdown posts to{" "}
              <code className="font-mono">content/posts/</code>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
