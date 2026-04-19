import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

// @ts-ignore - Bypasses the strict Next.js CSS module declaration warning
import "./globals.css";

import { Providers } from "@/components/Providers";
import PageWrapper from "@/components/PageWrapper";

// Using Inter for a clean, professional, Bloomberg-terminal-like readability
const inter = Inter({ subsets: ["latin"] });

// Upgraded Corporate Metadata
export const metadata: Metadata = {
  title: "GlobCom ERP | Command Center",
  description: "Secure Internal Trading & Commodity Management Platform for GlobCom International FZE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* GOOGLE PLACES API SCRIPT - Loads before interactive elements */}
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          strategy="beforeInteractive" 
        />
      </head>
      <body 
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-blue-600/20 selection:text-blue-900`}
      >
        <Providers>
          {/* The PageWrapper now completely handles the Sidebar, TopBar, and Login screen logic */}
          <PageWrapper>
            {children}
          </PageWrapper>
        </Providers>
      </body>
    </html>
  );
}