import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = 'mediagen_access';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has(ACCESS_COOKIE);
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith("/dashboard");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isProtected && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuth && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
