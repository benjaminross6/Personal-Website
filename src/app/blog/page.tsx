import type { Metadata } from "next";

import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing and notes.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Add Markdown posts to <code className="font-mono">content/posts/</code>.
        </p>
      </header>

      <section className="mt-10 grid gap-6">
        {posts.length ? (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        ) : (
          <p className="text-sm text-foreground/70">
            No posts yet. Create one in{" "}
            <code className="font-mono">content/posts/</code>.
          </p>
        )}
      </section>
    </div>
  );
}
