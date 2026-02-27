// middleware.ts - Simplified version
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only protect guest-only routes in middleware
// Let client-side layouts handle auth checks for better reliability
const GUEST_ONLY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/products",
];

function isAuthenticated(req: NextRequest): boolean {
  try {
    const authCookie = req.cookies.get("sbw-auth");

    if (!authCookie?.value) {
      return false;
    }

    const decodedValue = decodeURIComponent(authCookie.value);
    const auth = JSON.parse(decodedValue);
    const state = auth?.state || auth;

    return !!state?.isAuthenticated && !!state?.user;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authenticated = isAuthenticated(req);

  // Redirect authenticated users away from guest-only pages
  if (GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r)) && authenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|fonts).*)",
  ],
};
