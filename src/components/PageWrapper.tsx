"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";

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
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* DESKTOP SIDEBAR: Hidden on mobile screens */}
      <div className="hidden lg:block z-20">
        <Sidebar />
      </div>

      {/* MAIN CONTENT AREA */}
      <main 
        className="flex-1 min-h-screen flex flex-col bg-slate-50 transition-all duration-300 ease-in-out w-full lg:ml-72 lg:w-[calc(100%-18rem)] relative"
      >
        <TopBar />
        
        {/* pb-24 adds padding at the bottom of the phone so the MobileNav doesn't block content */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
          {children}
        </div>

        {/* MOBILE BOTTOM NAVIGATION: Hidden on desktop */}
        <MobileNav />
      </main>

    </div>
  );
}