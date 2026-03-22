import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Prose } from "@/components/Prose";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { markdownToHtml } from "@/lib/markdown";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { meta } = getPostBySlug(slug);
    return {
      title: meta.title,
      description: meta.description,
      openGraph: {
        type: "article",
        title: meta.title,
        description: meta.description,
        url: site.siteUrl?.trim()
          ? `${site.siteUrl.replace(/\/+$/, "")}/blog/${meta.slug}`
          : undefined,
      },
    };
  } catch {
    return { title: "Post not found" };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post: ReturnType<typeof getPostBySlug>;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const html = await markdownToHtml(post.content);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {post.meta.title}
        </h1>
        <p className="mt-3 text-sm text-foreground/60">
          <time>{post.meta.date}</time>
        </p>
        {post.meta.description ? (
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            {post.meta.description}
          </p>
        ) : null}
      </header>

      <article className="mt-10 max-w-3xl">
        <Prose>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Prose>
      </article>
    </div>
  );
}

