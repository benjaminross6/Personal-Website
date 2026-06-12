import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const FILENAME = "benjamin-ross-resume.pdf";

/**
 * Serves the resume at /resume.pdf while keeping the on-disk name
 * benjamin-ross-resume.pdf so downloads save with a recognizable filename.
 */
export async function GET() {
  const path = join(process.cwd(), "public", FILENAME);
  const buffer = await readFile(path);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${FILENAME}"`,
    },
  });
}
