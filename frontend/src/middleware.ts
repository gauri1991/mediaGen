import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = 'mediagen_access';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has(ACCESS_COOKIE);
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith("/dashboard");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuth && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
