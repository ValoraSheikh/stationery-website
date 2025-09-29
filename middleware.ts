import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // protected routes
  const protectedPaths = ["/dashboard", "/booking", "/bookings", "/wishlist"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/booking/:path*",
    "/bookings/:path*",
    "/wishlist/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
