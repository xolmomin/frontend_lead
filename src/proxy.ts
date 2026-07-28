import { NextResponse, type NextRequest } from "next/server";

// Set by the backend alongside the httpOnly refresh cookie; carries no secret.
// The refresh cookie itself is path-scoped to /api/v1/auth and never reaches us.
const SESSION_MARKER_COOKIE = "logged_in";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_MARKER_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
