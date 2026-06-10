import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
// @ts-ignore - Bypasses strict TS CSS module declaration warning
import "./globals.css";
import { Providers } from "@/components/Providers";
import SplashScreen from "@/components/SplashScreen"; // ⚡ NEW: Import the synthetic splash

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    template: "%s | GlobCom ERP",
    default: "Command Center | GlobCom ERP",
  },
  description: "Internal Trading & Commodity Management Platform for GlobCom International FZE.",
  applicationName: "GlobCom ERP",
  authors: [{ name: "GlobCom International FZE" }],
  generator: "Next.js",
  keywords: ["Commodity Trading", "ERP", "GlobCom", "CRM", "Logistics", "Hamriyah Free Zone"],
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GlobCom",
  },
  icons: {
    icon: "/splash-screens/manifest-icon-192.maskable.png",
    apple: "/splash-screens/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth h-full" suppressHydrationWarning>
      <head>
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          strategy="beforeInteractive" 
        />
        {/* ⚡ All hardcoded Apple splash screen tags REMOVED to cure letterboxing */}
      </head>
      <body 
        className={`${inter.className} h-full overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600/20 selection:text-indigo-900`}
        suppressHydrationWarning 
      >
        {/* ⚡ INJECT SYNTHETIC SPLASH SCREEN: Bypasses iOS bugs completely */}
        <SplashScreen />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}