import withPWAInit from "@ducanh2912/next-pwa";

// Initialize the PWA Wrapper
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // We disable the PWA service worker in development so it doesn't mess with hot-reloading.
  // It will automatically activate when you push to Vercel (Production).
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you had any previous Next.js config rules (like images domains), they stay here!
  reactStrictMode: true,
};

export default withPWA(nextConfig);