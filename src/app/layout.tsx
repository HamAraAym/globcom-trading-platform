import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

// @ts-ignore - Bypasses the strict Next.js CSS module declaration warning
import "./globals.css";

import { Providers } from "@/components/Providers";
import PageWrapper from "@/components/PageWrapper";

// Using Inter for clean, professional, high-density readability
const inter = Inter({ subsets: ["latin"], display: "swap" });

// Upgraded Corporate Metadata for rich link unfurling and PWA support
export const metadata: Metadata = {
  title: {
    template: "%s | GlobCom ERP",
    default: "Command Center | GlobCom ERP",
  },
  description: "Secure Internal Trading & Commodity Management Platform for GlobCom International FZE.",
  applicationName: "GlobCom ERP",
  authors: [{ name: "GlobCom International FZE" }],
  generator: "Next.js",
  keywords: ["Commodity Trading", "ERP", "GlobCom", "CRM", "Logistics", "Hamriyah Free Zone"],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Controls the browser window frame color on mobile devices
export const viewport: Viewport = {
  themeColor: "#0f172a", // slate-900 to match the sidebar
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
    <html lang="en" className="scroll-smooth">
      <head>
        {/* GOOGLE PLACES API SCRIPT - Loads before interactive elements */}
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          strategy="beforeInteractive" 
        />
      </head>
      <body 
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600/20 selection:text-indigo-900`}
      >
        <Providers>
          {/* The PageWrapper handles the Sidebar, TopBar, and Login screen logic */}
          <PageWrapper>
            {children}
          </PageWrapper>
        </Providers>
      </body>
    </html>
  );
}