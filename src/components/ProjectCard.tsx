import type { Project } from "@/lib/site";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
      <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/70">
        {project.description}
      </p>

      {project.stack?.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((t) => (
            <li
              key={t}
              className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs text-foreground/80 dark:border-white/10 dark:bg-white/[0.03]"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      {project.links?.live || project.links?.repo || project.links?.notebook ? (
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
          {project.links.live ? (
            <a
              className="text-foreground/80 hover:text-foreground"
              href={project.links.live}
              target="_blank"
              rel="noreferrer"
            >
              Live
            </a>
          ) : null}
          {project.links.repo ? (
            <a
              className="text-foreground/80 hover:text-foreground"
              href={project.links.repo}
              target="_blank"
              rel="noreferrer"
            >
              Repo
            </a>
          ) : null}
          {project.links.notebook ? (
            <a
              className="text-foreground/80 hover:text-foreground"
              href={project.links.notebook}
              target="_blank"
              rel="noreferrer"
            >
              Notebook
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
