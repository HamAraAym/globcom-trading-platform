"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import CommandPalette from "@/components/CommandPalette";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  // 1. LOGIN SCREEN: Completely clean, full width, no navigation components
  if (isLogin) {
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
        
        {/* SCROLLABLE CONTENT AREA: 
            pb-24 adds padding at the bottom of the phone so the MobileNav doesn't block content.
            lg:pb-0 removes that padding on desktop.
            FIX: Removed 'relative z-0' so modals can freely render over the TopBar.
        */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 lg:pb-0">
          {children}
        </div>

        {/* MOBILE BOTTOM NAVIGATION: Hidden on desktop */}
        <MobileNav />
      </main>

    </div>
  );
}