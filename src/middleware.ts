import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * The static file under /public would download by default; rewrite to our route
 * handler so we can send Content-Disposition: inline.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/IEOR198_Final.ipynb") {
    const url = request.nextUrl.clone();
    url.pathname = "/notebook/ieor198";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/IEOR198_Final.ipynb"],
};
