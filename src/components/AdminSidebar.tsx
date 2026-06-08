"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldAlert, Settings, LayoutDashboard, LogOut } from "lucide-react";

const ADMIN_LINKS = [
  { name: "Team & Access", href: "/users", icon: Users },
  { name: "Audit & Compliance", href: "/audit", icon: ShieldAlert },
  { name: "System Settings", href: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800">
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
            GC
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest uppercase">Admin Console</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Administration</p>
        </div>

        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white text-slate-400"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Exit */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <Link 
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LayoutDashboard size={18} />
          Exit to Global Hub
        </Link>
      </div>
    </div>
  );
}