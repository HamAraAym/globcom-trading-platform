"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function GlobalUserMenu() {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
      {/* ⚡ CHANGED: Now points to /profile instead of /settings */}
      <Link 
        href="/profile"
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
      >
        <User size={16} /> My Profile
      </Link>
      
      <button 
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-sm font-bold transition-all border border-rose-500/20 hover:border-rose-500 shadow-sm"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}