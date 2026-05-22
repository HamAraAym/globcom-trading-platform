"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import CommandPalette from "@/components/CommandPalette";
import GlobalAIAssistant from "@/components/GlobalAIAssistant";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ⚡ FIX: Add accept-invite to our public page checks
  const isLogin = pathname === "/login";
  const isAcceptInvite = pathname?.startsWith("/accept-invite");

  // 1. PUBLIC SCREENS: Completely clean, full width, no navigation components
  // If they are on the login page OR accepting an invite, don't load the Sidebar/TopBar/AI
  if (isLogin || isAcceptInvite) {
    return (
      <main className="w-full min-h-screen flex flex-col bg-slate-50">
        {children}
      </main>
    );
  }

  // 2. MAIN APPLICATION: Responsive layout
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative w-full">
      
      {/* GLOBAL SEARCH ENGINE: Always mounted, waiting for Cmd+K */}
      <CommandPalette />

      {/* ⚡ GLOBCOM AI: Globally injected floating assistant (Safe to mount here) */}
      <GlobalAIAssistant />

      {/* DESKTOP SIDEBAR: Hidden on mobile screens */}
      <div className="hidden lg:block z-40">
        <Sidebar />
      </div>

      {/* MAIN CONTENT AREA */}
      <main 
        className="flex-1 h-screen flex flex-col bg-slate-50 transition-all duration-300 ease-in-out w-full lg:ml-72 relative"
      >
        {/* TOP BAR: Header & Notifications */}
        <TopBar />
        
        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 lg:pb-0">
          {children}
        </div>

        {/* MOBILE BOTTOM NAVIGATION: Hidden on desktop */}
        <MobileNav />
      </main>

    </div>
  );
}