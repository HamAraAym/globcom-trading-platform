"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Activity, X } from "lucide-react";
import Link from "next/link";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/actions/notificationActions";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

interface NotificationBellProps {
  variant?: "dark" | "light";
}

export default function NotificationBell({ variant = "dark" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on load and poll every 30 seconds
  const fetchAlerts = async () => {
    try {
      const data = await getMyNotifications();
      // Ensure the server-passed date is instantiated correctly on the client
      const formattedData = data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
      setNotifications(formattedData);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock background scrolling when dropdown is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update for instant feedback
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markAsRead(id);
  };

  const handleMarkAll = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllAsRead();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Dynamic Button Styling based on where the Bell is placed
  const buttonStyles = variant === "dark" 
    ? "text-slate-400 hover:bg-slate-800 hover:text-white" 
    : "text-slate-500 hover:bg-slate-100 hover:text-indigo-600";

  return (
    <div className="relative flex items-center justify-center" ref={dropdownRef}>
      {/* The Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2 transition-colors rounded-xl focus:outline-none ${buttonStyles}`}
      >
        <Bell size={20} className="md:w-5 md:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
          </span>
        )}
      </button>

      {/* The Dropdown Menu (Fixed on mobile, Absolute on Desktop) */}
      {isOpen && (
        <div className="fixed top-[70px] left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:-right-2 sm:mt-4 sm:w-96 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
          
          <div className="bg-slate-900 px-4 py-3 md:py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-3 text-white">
              <div className="bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-500/30">
                <Activity size={16} className="text-indigo-400 md:w-4 md:h-4" />
              </div>
              <h3 className="font-bold text-sm md:text-base tracking-wide m-0">System Alerts</h3>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1">
                  <Check size={12} className="md:w-3.5 md:h-3.5" /> Mark read
                </button>
              )}
              {/* Mobile Close Button */}
              <button onClick={() => setIsOpen(false)} className="sm:hidden text-slate-400 hover:text-white p-1 bg-slate-800 rounded-full">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 md:p-10 text-center text-slate-400 flex flex-col items-center">
                <Bell size={32} className="mb-3 opacity-20 md:w-10 md:h-10" />
                <p className="text-xs md:text-sm font-bold text-slate-600">No new notifications.</p>
                <p className="text-[10px] md:text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 md:p-5 transition-colors ${notif.isRead ? 'bg-white opacity-70' : 'bg-indigo-50/50'}`}>
                    <div className="flex justify-between items-start gap-3 mb-1.5 md:mb-2">
                      <p className={`text-sm md:text-base leading-tight ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm"></span>}
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 mb-3 leading-relaxed">{notif.message}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {notif.createdAt.toLocaleDateString()} {notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2 md:gap-3">
                        {!notif.isRead && (
                          <button onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] md:text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            Mark Read
                          </button>
                        )}
                        {notif.link && (
                          <Link href={notif.link} onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }} className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-200 px-2.5 md:px-3 py-1.5 rounded-lg transition-all shadow-sm">
                            View <ExternalLink size={12} className="md:w-3.5 md:h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}