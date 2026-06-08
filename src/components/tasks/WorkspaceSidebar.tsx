"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings 
} from "lucide-react";

const navItems = [
  { name: "Sprint Board", href: "/tasks", icon: LayoutDashboard },
  { name: "My Tasks", href: "/tasks/mine", icon: CheckSquare },
  { name: "Team Workload", href: "/tasks/team", icon: Users },
  { name: "Settings", href: "/tasks/settings", icon: Settings },
];

interface WorkspaceSidebarProps {
  brandName?: string;
  brandLogo?: string | null;
}

export default function WorkspaceSidebar({ brandName = "GlobCom Workspace", brandLogo }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-full bg-slate-950 text-slate-200 border-r border-slate-800 shrink-0">
      
      {/* Brand Header — Now supports dynamic global branding */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
        {brandLogo ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-md shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-600/20 shrink-0">
            {brandName.charAt(0)}
          </div>
        )}
        <div className="overflow-hidden">
          <h2 className="font-semibold text-sm text-white tracking-tight truncate">{brandName}</h2>
          <p className="text-[11px] text-slate-400 font-medium truncate">Internal Task Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Back Link — Seamless exit door back to Global Hub */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <Link 
          href="/" 
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-xl text-sm font-bold transition-all border border-indigo-600/30 hover:border-indigo-600 shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Exit to Global Hub
        </Link>
      </div>
    </div>
  );
}