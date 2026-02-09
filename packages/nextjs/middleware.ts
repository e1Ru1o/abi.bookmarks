import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Viem's address regex
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathSegments = pathname.split("/").filter(Boolean);

  if (pathSegments.length === 1 && addressRegex.test(pathSegments[0])) {
    const newURL = new URL(`/explorer?add=1:${pathSegments[0]}`, request.url);
    return NextResponse.redirect(newURL);
  }

  return NextResponse.next();
}

// Strictly limit to paths that look like bare contract addresses.
// This prevents Edge Runtime from bundling unrelated project dependencies.
export const config = {
  matcher: "/:path(0x[a-fA-F0-9]{40})",
};
