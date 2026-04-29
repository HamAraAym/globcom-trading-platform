"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Globe, LayoutDashboard, FileBox, Box, ArrowRightLeft, Users, ShieldCheck, Settings
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userRole = (session?.user as any)?.role || "GUEST";

  const navLinks = [
    { name: "Command Center", href: "/", icon: LayoutDashboard, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
    { name: "Demand Board", href: "/demands", icon: FileBox, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP"] },
    { name: "Supply Inventory", href: "/supplies", icon: Box, allowedRoles: ["ADMIN", "TRADING_REP", "SUPPLIER_REP"] },
    { name: "Trading Hub", href: "/trading", icon: ArrowRightLeft, allowedRoles: ["ADMIN", "TRADING_REP"] },
    { name: "Client CRM", href: "/buyers", icon: Users, allowedRoles: ["ADMIN"] },
    { name: "Audit & Compliance", href: "/audit", icon: ShieldCheck, allowedRoles: ["ADMIN"] },
    { name: "Settings", href: "/settings", icon: Settings, allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
  ];

  const visibleLinks = navLinks.filter(link => link.allowedRoles.includes(userRole));

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-2xl z-50">
      
      <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Globe className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-wide">GlobCom</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">International FZE</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 mt-2">Internal Operations</p>
        {status === "loading" ? (
          <div className="px-4 py-4 text-sm text-slate-500 animate-pulse">Verifying clearance...</div>
        ) : (
          visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? "bg-blue-600/10 text-blue-400 font-semibold" : "hover:bg-slate-800 hover:text-white"}`}>
                <Icon size={18} className={isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"} />
                <span className="text-sm">{link.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-center shrink-0">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
          GlobCom ERP v1.0
        </p>
      </div>
    </div>
  );
}