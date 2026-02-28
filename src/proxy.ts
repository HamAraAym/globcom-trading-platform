import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// NEW: Exported as 'proxy' to comply with Next.js 16.1+ architecture
export async function proxy(req: NextRequest) {
  // Fetch the session token from the user's browser
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  // 1. If the user is NOT logged in and trying to access a secure page, bounce them to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. If the user IS logged in and tries to go to the login page, bounce them to the dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Otherwise, let them through
  return NextResponse.next();
}

// Keep the matcher to ignore static files and API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};