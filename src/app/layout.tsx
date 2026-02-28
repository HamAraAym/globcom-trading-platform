import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // <-- IMPORTANT: Imported Next.js Script optimizer
import "./globals.css";
import { Providers } from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import TopBar from "@/components/TopBar"; // NEW: Importing the Global Header

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
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-blue-600/20 selection:text-blue-900 flex h-screen overflow-hidden`}
      >
        <Providers>
          <div className="flex h-screen w-full relative">
            <Sidebar />
            
            {/* The PageWrapper handles layout spacing and conditional rendering */}
            <PageWrapper>
              <div className="flex flex-col h-full w-full overflow-hidden">
                {/* GLOBAL TOP HEADER */}
                <TopBar /> 
                
                {/* MAIN PAGE CONTENT */}
                <main className="flex-1 overflow-auto relative">
                  {children}
                </main>
              </div>
            </PageWrapper>

          </div>
        </Providers>
      </body>
    </html>
  );
}