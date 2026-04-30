"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/actions/notificationActions";

// Define the shape based on our Prisma schema
type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on load and poll every 30 seconds
  const fetchAlerts = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
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

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative flex items-center justify-center" ref={dropdownRef}>
      {/* The Bell Icon (Styling adapted to fit inside the TopBar wrapper) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-full focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-4 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Activity size={16} className="text-indigo-400" />
              <h3 className="font-bold text-sm tracking-wide">System Alerts</h3>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-bold text-slate-600">No new notifications.</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 transition-colors ${notif.isRead ? 'bg-white opacity-60' : 'bg-indigo-50/40'}`}>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={`text-sm ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm"></span>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">{notif.message}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <button onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            Mark Read
                          </button>
                        )}
                        {notif.link && (
                          <Link href={notif.link} onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded-md transition-all shadow-sm">
                            View <ExternalLink size={10} />
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