import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

// @ts-ignore - Bypasses the strict Next.js CSS module declaration warning
import "./globals.css";

import { Providers } from "@/components/Providers";
import PageWrapper from "@/components/PageWrapper";
import GlobalAIAssistant from "@/components/GlobalAIAssistant"; // NEW: Import the Assistant

// Using Inter for clean, professional, high-density readability
const inter = Inter({ subsets: ["latin"], display: "swap" });

// Upgraded Corporate Metadata for rich link unfurling and PWA support
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
  manifest: "/manifest.json", // Links your PWA Manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GlobCom",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/globe.svg", 
  },
};

// Controls the browser window frame color on mobile devices
export const viewport: Viewport = {
  themeColor: "#0f172a", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // FIXED: Added suppressHydrationWarning to combat browser extension injections
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* GOOGLE PLACES API SCRIPT - Loads before interactive elements */}
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          strategy="beforeInteractive" 
        />
      </head>
      <body 
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600/20 selection:text-indigo-900`}
        suppressHydrationWarning // Protects against extensions like Grammarly
      >
        <Providers>
          {/* The PageWrapper handles the Sidebar, TopBar, and Login screen logic */}
          <PageWrapper>
            {children}
          </PageWrapper>
          
          {/* GLOBCOM AI: Globally injected floating assistant */}
          <GlobalAIAssistant />
          
        </Providers>
      </body>
    </html>
  );
}