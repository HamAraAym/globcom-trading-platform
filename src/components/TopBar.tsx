"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Signal, Send, LogOut, ChevronDown, CheckCircle2, Settings, Globe, Search } from "lucide-react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";
import { sendPing } from "@/actions/notificationActions"; 

export default function TopBar() {
  const { data: session } = useSession();
  const [isPingOpen, setIsPingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pingedUsers, setPingedUsers] = useState<string[]>([]);
  
  const pingRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "Authenticating...";
  const userRole = (session?.user as any)?.role || "";
  const initials = userName !== "Authenticating..." 
    ? userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "?";

  // Mock list of online users
  const onlineTeam = [
    { id: "1", name: "Sarah Jenkins", role: "TRADING REP" },
    { id: "2", name: "Mike Ross", role: "BUYER REP" },
    { id: "3", name: "David Chen", role: "ADMIN" }
  ];

  // Close dropdowns if the user clicks outside of them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pingRef.current && !pingRef.current.contains(event.target as Node)) setIsPingOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePing = async (userId: string) => {
    setPingedUsers(prev => [...prev, userId]);
    try {
      await sendPing(userId);
    } catch (error) {
      console.error("Failed to ping user", error);
    }
    setTimeout(() => {
      setPingedUsers(prev => prev.filter(id => id !== userId));
      setIsPingOpen(false);
    }, 2000);
  };

  return (
    // FIX: Lowered root z-index from z-40 to z-20 so modals can render over it
    <div className="h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-between lg:justify-end bg-slate-50/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shrink-0">
      
      {/* MOBILE LOGO */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center text-white shadow-md">
          <Globe size={18} />
        </div>
        <span className="font-black text-slate-900 tracking-tight text-lg">GlobCom</span>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
        
        {/* GLOBAL SEARCH TRIGGER */}
        <button 
          onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-800 transition-colors rounded-xl focus:outline-none shrink-0"
          aria-label="Search"
        >
          <Search size={20} className="md:w-5 md:h-5" />
        </button>

        {/* 1. Quick Ping Directory */}
        <div className="relative" ref={pingRef}>
          <button 
            onClick={() => { setIsPingOpen(!isPingOpen); setIsProfileOpen(false); }}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-full text-xs lg:text-sm font-bold text-slate-700 shadow-sm transition-all"
          >
            <Signal size={16} className="text-blue-800 shrink-0" />
            <span className="hidden sm:inline">Ping Team</span>
          </button>

          {isPingOpen && (
            <div className="absolute top-full right-0 lg:right-auto lg:left-0 mt-3 w-[280px] lg:w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pt-2 pb-2 border-b border-slate-100 mb-1">Direct Ping (Online Members)</p>
              {onlineTeam.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => handlePing(user.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* GLOBCOM GREEN INDICATOR */}
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{user.role}</p>
                    </div>
                  </div>
                  {pingedUsers.includes(user.id) ? (
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-800 transition-colors shrink-0">
                      PING <Send size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Notification Bell */}
        <NotificationBell />

        {/* 3. User Identity & Profile Dropdown */}
        <div className="relative border-l border-slate-200 pl-2 sm:pl-3 lg:pl-6" ref={profileRef}>
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsPingOpen(false); }}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity focus:outline-none group"
          >
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors">{userName}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{userRole.replace("_", " ")}</p>
            </div>
            <div className="relative flex items-center gap-1">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-800 text-white font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 text-xs lg:text-sm shrink-0">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 lg:right-1 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 border-2 border-white rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)] z-20"></span>
              <ChevronDown size={14} className="text-slate-400 ml-1 group-hover:text-blue-800 transition-colors hidden sm:block shrink-0" />
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-3 border-b border-slate-100 mb-1 lg:hidden">
                  <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{userRole.replace("_", " ")}</p>
              </div>
              
              <Link 
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl transition-colors mb-1"
              >
                <Settings size={16} className="text-slate-400 shrink-0" />
                Account Settings
              </Link>

              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut size={16} className="text-rose-400 shrink-0" />
                Secure Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}