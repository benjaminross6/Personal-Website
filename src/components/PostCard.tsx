import Link from "next/link";

import type { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
      <div className="flex items-start justify-between gap-6">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link className="hover:underline" href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        <time className="shrink-0 text-xs text-foreground/60">{post.date}</time>
      </div>
      {post.description ? (
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          {post.description}
        </p>
      ) : null}
      {post.tags?.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs text-foreground/80 dark:border-white/10 dark:bg-white/[0.03]"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

