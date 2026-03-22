import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

/**
 * Serves the IEOR 198 notebook with Content-Disposition: inline so the browser
 * opens it in a tab instead of downloading (unlike the raw /public file).
 */
export async function GET() {
  const path = join(process.cwd(), "public", "IEOR198_Final.ipynb");
  const buffer = await readFile(path);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'inline; filename="IEOR198_Final.ipynb"',
    },
  });
}
