import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  tags?: string[];
  draft?: boolean;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
};

const postsDir = path.join(process.cwd(), "content", "posts");

function getSlugFromFilename(filename: string) {
  return filename.replace(/\.md$/, "");
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDir)) return [];

  const files = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => b.localeCompare(a));

  const posts = files.map((filename) => {
    const slug = getSlugFromFilename(filename);
    const fullPath = path.join(postsDir, filename);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);

    const fm = data as Partial<PostFrontmatter>;

    return {
      slug,
      title: fm.title ?? slug,
      date: fm.date ?? "1970-01-01",
      description: fm.description ?? "",
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
      draft: Boolean(fm.draft),
    } satisfies PostMeta;
  });

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
}

export function getPostBySlug(slug: string): {
  meta: PostMeta;
  content: string;
} {
  const fullPath = path.join(postsDir, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Partial<PostFrontmatter>;

  return {
    meta: {
      slug,
      title: fm.title ?? slug,
      date: fm.date ?? "1970-01-01",
      description: fm.description ?? "",
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
      draft: Boolean(fm.draft),
    },
    content,
  };
}

