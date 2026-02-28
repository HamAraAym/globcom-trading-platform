"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <main 
      className={`flex-1 min-h-screen flex flex-col bg-slate-50 transition-all duration-300 ease-in-out ${
        isLogin ? "ml-0" : "ml-64 w-[calc(100%-16rem)]"
      }`}
    >
      {/* The w-[calc...] ensures that the main content doesn't overflow horizontally 
        when the 64-width (16rem) sidebar is active.
      */}
      {children}
    </main>
  );
}