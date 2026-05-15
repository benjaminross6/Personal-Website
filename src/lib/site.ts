export type SocialLinks = {
  linkedin?: string;
  instagram?: string;
  github?: string;
  x?: string;
  website?: string;
};

export type ProjectLinkSet = {
  live?: string;
  repo?: string;
  /** Notebook URL (use a route like /notebook/... for inline open vs download) */
  notebook?: string;
  /** Extra labeled links rendered after the standard ones */
  extras?: { label: string; href: string }[];
};

export type Project = {
  title: string;
  description: string;
  stack?: string[];
  links?: ProjectLinkSet;
  featured?: boolean;
};

export type SiteConfig = {
  siteUrl: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  email: string;
  /** Google Calendar appointment / booking link (opens in new tab). */
  bookingUrl: string;
  socials: SocialLinks;
  resumePdfPath: string;
  projects: Project[];
};

/** Personal site content — edit here, not scattered across components. */
export const site: SiteConfig = {
  siteUrl: "https://iambenross.com",
  name: "Benjamin Ross",
  headline: "Student",
  bio: "Welcome to my website! I'm Ben, a Berkeley native. Currently I'm at UC Berkeley studying Applied Math. I love playing games, learning cool things, and being involved in various communities.",
  location: "",
  email: "benjaminross@berkeley.edu",
  bookingUrl: "https://calendar.app.google/Vu8xPpBZLk1Znqft6",
  socials: {
    linkedin: "https://www.linkedin.com/in/benjaminross6",
    instagram: "https://www.instagram.com/beenjaminss/",
    github: "https://github.com/benjaminross6",
  },
  resumePdfPath: "/benjamin-ross-resume.pdf",
  projects: [
    {
      title: "Pairs trading backtest (IEOR 198 final)",
      description:
        "Final project for the IEOR 198 DeCal at UC Berkeley: a z-score–based pairs trading strategy on four correlated stock pairs (KO/PEP, MS/GS, NFLX/DIS, V/MA), with full backtesting and a 2024 out-of-sample evaluation using Yahoo Finance data.",
      stack: ["Python", "Jupyter", "pandas", "NumPy", "yfinance"],
      links: {
        repo: "https://github.com/benjaminross6/IEOR-198",
        notebook: "https://github.com/benjaminross6/IEOR-198/blob/main/Pairs%20Trading%20Research.ipynb",
      },
      featured: true,
    },
    {
      title: "Abstract algebra concept map (Math 113)",
      description:
        "Final-prep concept map for UC Berkeley Math 113 (Abstract Algebra) — groups, rings, fields, and morphisms with how they relate. Pan and zoom enabled.",
      stack: ["Mermaid", "HTML", "JavaScript"],
      links: {
        live: "/projects/math113-map.html",
      },
      featured: true,
    },
    {
      title: "Data 100 finals study guide",
      description:
        "Personal finals study guide for UC Berkeley Data 100 (Spring 2026) — a single-page reference covering the full course, plus a companion page of interactive clustering visualizations (K-Means step-through, K-Means++ vs random init, agglomerative linkage comparison, the elbow method, and where K-Means fails).",
      stack: ["HTML", "CSS", "JavaScript", "Canvas", "KaTeX"],
      links: {
        live: "/projects/data100-study-guide.html",
        extras: [
          {
            label: "Clustering visualizations",
            href: "/projects/data100-clustering.html",
          },
        ],
      },
      featured: true,
    },
    {
      title: "Econ 101A final study guide",
      description:
        "Personal final study guide for UC Berkeley Econ 101A (Intermediate Microeconomic Theory, Spring 2026) — a single-page reference covering consumer and producer theory, general equilibrium, game theory, and information economics, plus a companion flashcard deck for the key formulas.",
      stack: ["HTML", "CSS", "JavaScript", "KaTeX", "MathJax"],
      links: {
        live: "/projects/econ101a-study-guide.html",
        extras: [
          {
            label: "Formula flashcards",
            href: "/projects/flashcards.html",
          },
        ],
      },
      featured: true,
    },
  ],
};

