import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      {children}
    </div>
  );
}

