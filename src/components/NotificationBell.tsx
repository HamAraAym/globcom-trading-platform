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
    const data = await getMyNotifications();
    setNotifications(data);
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
    <div className="relative" ref={dropdownRef}>
      {/* The Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-900"></span>
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Activity size={16} className="text-blue-400" />
              <h3 className="font-bold text-sm tracking-wide">System Alerts</h3>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center">
                <Bell size={24} className="mb-2 opacity-20" />
                <p className="text-xs font-bold">No new notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 transition-colors ${notif.isRead ? 'bg-white opacity-60' : 'bg-blue-50/50'}`}>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={`text-sm ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-sm"></span>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">{notif.message}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <button onClick={() => handleMarkAsRead(notif.id)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                            Mark Read
                          </button>
                        )}
                        {notif.link && (
                          <Link href={notif.link} onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-200/50 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors">
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