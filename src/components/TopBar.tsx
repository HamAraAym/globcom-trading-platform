"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Signal, Send, User as UserIcon, LogOut, ChevronDown, CheckCircle2 } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { sendPing } from "@/actions/notificationActions"; // We will add this action next!

export default function TopBar() {
  const { data: session } = useSession();
  const [isPingOpen, setIsPingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pingedUsers, setPingedUsers] = useState<string[]>([]);
  
  const pingRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "Authenticating...";
  const userRole = (session?.user as any)?.role || "";

  // Mock list of online users (we will wire this to Prisma later to fetch real online users)
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

  // Handle the 1-on-1 direct ping
  const handlePing = async (userId: string) => {
    // Optimistic UI update (show the green checkmark)
    setPingedUsers(prev => [...prev, userId]);
    
    try {
      // Dispatch the actual notification to their database row
      await sendPing(userId);
    } catch (error) {
      console.error("Failed to ping user", error);
    }
    
    // Close the dropdown after 2 seconds
    setTimeout(() => {
      setPingedUsers(prev => prev.filter(id => id !== userId));
      setIsPingOpen(false);
    }, 2000);
  };

  return (
    <div className="h-20 px-8 flex items-center justify-end gap-6 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      
      {/* 1. Quick Ping Directory */}
      <div className="relative" ref={pingRef}>
        <button 
          onClick={() => { setIsPingOpen(!isPingOpen); setIsProfileOpen(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded-full text-sm font-bold text-slate-700 shadow-sm transition-all"
        >
          <Signal size={16} className="text-blue-500" />
          Ping Team
        </button>

        {isPingOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-2 border-b border-slate-100 mb-1">Direct Ping (Online Members)</p>
            {onlineTeam.map(user => (
              <button 
                key={user.id} 
                onClick={() => handlePing(user.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">{user.role}</p>
                  </div>
                </div>
                {pingedUsers.includes(user.id) ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                    PING <Send size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Notification Bell */}
      <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm">
        <NotificationBell />
      </div>

      {/* 3. User Identity & Profile Dropdown */}
      <div className="relative border-l border-slate-200 pl-4" ref={profileRef}>
        <button 
          onClick={() => { setIsProfileOpen(!isProfileOpen); setIsPingOpen(false); }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{userName}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{userRole.replace("_", " ")}</p>
          </div>
          <div className="relative flex items-center gap-1">
            <div className="w-10 h-10 bg-slate-900 text-slate-300 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
              <UserIcon size={18} />
            </div>
            {/* Green Online Dot */}
            <span className="absolute bottom-0 right-4 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)] z-20"></span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>
        </button>

        {/* The Logout Dropdown */}
        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-slate-100 mb-1 md:hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{userRole.replace("_", " ")}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              Secure Logout
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}