"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Users, FileBox, Box, Menu, 
  ArrowRightLeft, UserCog, ShieldCheck, Settings, LogOut, X 
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const userRole = (session?.user as any)?.role || "GUEST";

  // 1. Primary Bottom Bar Links (Max 4 slots + 1 Menu Button)
  const primaryLinks = [
    { name: "Home", href: "/", icon: LayoutDashboard, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
    { name: "Demands", href: "/demands", icon: FileBox, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP"] },
    { name: "Supplies", href: "/supplies", icon: Box, allowedRoles: ["ADMIN", "TRADING_REP", "SUPPLIER_REP"] },
    { name: "CRM", href: "/buyers", icon: Users, allowedRoles: ["ADMIN"] },
  ].filter(link => link.allowedRoles.includes(userRole)).slice(0, 4);

  // 2. Secondary Menu Links (Slide-Up Drawer)
  const secondaryLinks = [
    { name: "Trading Hub", href: "/trading", icon: ArrowRightLeft, allowedRoles: ["ADMIN", "TRADING_REP"] },
    { name: "Team Access", href: "/users", icon: UserCog, allowedRoles: ["ADMIN"] },
    { name: "Audit Log", href: "/audit", icon: ShieldCheck, allowedRoles: ["ADMIN"] },
    { name: "Settings", href: "/settings", icon: Settings, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
  ].filter(link => link.allowedRoles.includes(userRole));

  return (
    <>
      {/* MORE MENU DRAWER */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-t-3xl p-6 pb-24 animate-in slide-in-from-bottom-8 duration-300 shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Main Menu</h3>
              <button onClick={() => setIsMoreOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {secondaryLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    <Icon size={20} className="text-slate-400" />
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="h-px bg-slate-100 my-4"></div>
              
              <button 
                onClick={() => {
                  setIsMoreOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-600 font-bold hover:bg-rose-50 transition-colors"
              >
                <LogOut size={20} className="text-rose-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryLinks.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            const Icon = item.icon;

            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMoreOpen(false)}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive ? "text-blue-800" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-0.5 ${isActive ? "bg-blue-50" : "bg-transparent"}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? "text-blue-800" : "text-slate-500"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* MORE BUTTON */}
          <button 
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              isMoreOpen ? "text-blue-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-0.5 ${isMoreOpen ? "bg-blue-50" : "bg-transparent"}`}>
              <Menu size={18} strokeWidth={isMoreOpen ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${isMoreOpen ? "text-blue-800" : "text-slate-500"}`}>
              Menu
            </span>
          </button>
        </div>
      </div>
    </>
  );
}