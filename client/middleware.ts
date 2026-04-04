import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getRoleFromToken } from "./lib/auth";

const protectedRoutes = ["/dashboard", "/evaluator", "/join", "/admin"];
const guestOnlyRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const role = getRoleFromToken(token);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isGuestOnlyRoute = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isGuestOnlyRoute && token) {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/dashboard", request.url)
    );
  }

  if (
    token &&
    role === "admin" &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/join"))
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (token && role === "candidate" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/evaluator/:path*", "/join", "/admin/:path*", "/login", "/signup"]
};
