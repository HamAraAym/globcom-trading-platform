import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;

      // 1. VIP GUEST LIST: Always allow unauthenticated users on these paths
      if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/accept-invite") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".") // Allows static assets like images and favicons
      ) {
        return true; // Bypass authentication
      }

      // 2. EVERYWHERE ELSE: Require a valid login token
      return !!token;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// Run this middleware on absolutely every page request
export const config = {
  matcher: ["/:path*"],
};