import type { Metadata } from "next";

import { ProjectCard } from "@/components/ProjectCard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects and case studies.",
};

export default function ProjectsPage() {
  const projects = site.projects ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Here you&apos;ll find some of the projects I&apos;ve done.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </section>
    </div>
  );
}
