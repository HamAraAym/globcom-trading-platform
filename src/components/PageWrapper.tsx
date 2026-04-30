"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

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

  // 2. MAIN APPLICATION: Render Sidebar/TopBar and apply margin logic matching the new w-72 Sidebar
  return (
    <>
      <Sidebar />
      <main 
        className="flex-1 min-h-screen flex flex-col bg-slate-50 transition-all duration-300 ease-in-out ml-72 w-[calc(100%-18rem)]"
      >
        <TopBar />
        
        {/* The w-[calc(100%-18rem)] ensures that the main content doesn't overflow horizontally 
          when the 72-width (18rem) sidebar is active.
        */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </>
  );
}