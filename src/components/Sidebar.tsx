"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  Globe, LayoutDashboard, FileBox, Box, ArrowRightLeft, Users, 
  ShieldCheck, Settings, UserCog, LogOut, MapPin, Phone, Mail
} from "lucide-react";

import { getGlobalSettings } from "@/actions/adminActions"; 

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Dynamic Enterprise Branding State
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("GlobCom International FZE");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const config = await getGlobalSettings();
        if (config) {
          if (config.companyLogoUrl) setBrandLogo(config.companyLogoUrl);
          if (config.companyName) setBrandName(config.companyName);
        }
      } catch (error) {
        console.error("Failed to load enterprise branding", error);
      }
    };
    fetchSettings();
  }, []);

  const userRole = (session?.user as any)?.role || "GUEST";

  const navLinks = [
    { name: "Command Center", href: "/", icon: LayoutDashboard, section: "Overview", allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
    { name: "Trading Hub", href: "/trading", icon: ArrowRightLeft, section: "Operations", allowedRoles: ["ADMIN", "TRADING_REP"] },
    { name: "Demand Board", href: "/demands", icon: FileBox, section: "Operations", allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP"] },
    { name: "Supply Inventory", href: "/supplies", icon: Box, section: "Operations", allowedRoles: ["ADMIN", "TRADING_REP", "SUPPLIER_REP"] },
    { name: "Client CRM", href: "/buyers", icon: Users, section: "Relations", allowedRoles: ["ADMIN"] },
    { name: "Team & Access", href: "/users", icon: UserCog, section: "Administration", allowedRoles: ["ADMIN"] },
    { name: "Audit & Compliance", href: "/audit", icon: ShieldCheck, section: "Administration", allowedRoles: ["ADMIN"] },
    { name: "System Settings", href: "/settings", icon: Settings, section: "Administration", allowedRoles: ["ADMIN", "TRADING_REP", "BUYER_REP", "SUPPLIER_REP"] },
  ];

  const visibleLinks = navLinks.filter(link => link.allowedRoles.includes(userRole));

  // Group items dynamically by section
  const sections = visibleLinks.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navLinks>);

  // Auto-format the company name to fit nicely
  const nameParts = brandName.split(" ");
  const primaryName = nameParts[0];
  const secondaryName = nameParts.slice(1).join(" ");

  return (
    // NEW: Added 'hidden lg:flex' so this sidebar seamlessly disappears on mobile devices
    <div className="hidden lg:flex w-72 bg-slate-900 text-slate-300 flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-2xl z-50">
      
      {/* BRANDING HEADER */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/60 bg-slate-950/50 shrink-0">
        <div className="flex items-center gap-3 w-full">
          {brandLogo ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-slate-700 shrink-0 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandLogo} alt="Company Logo" className="w-full h-full object-contain p-0.5" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
              <Globe size={22} strokeWidth={2.5} />
            </div>
          )}
          
          <div className="flex flex-col justify-center overflow-hidden w-full">
            <h1 className="text-white font-black text-lg leading-none tracking-widest truncate">{primaryName}</h1>
            {secondaryName && (
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5 truncate">{secondaryName}</p>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-6">
        {status === "loading" ? (
          <div className="px-4 py-4 text-sm text-slate-500 animate-pulse">Verifying clearance...</div>
        ) : (
          Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 px-3">
                {section}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400 transition-colors"} />
                      {item.name}
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* FOOTER BRANDING & LOGOUT */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/50 flex flex-col shrink-0">
        
        {/* Official Letterhead Context */}
        <div className="bg-slate-800/40 rounded-xl p-4 mb-4 border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} className="text-indigo-400" /> HQ Information
          </p>
          <div className="space-y-1 text-[10px] font-medium text-slate-400 leading-tight">
            <p className="text-slate-300 font-bold">GLOBCOM INTERNATIONAL FZE</p>
            <p>P1-ELOB, Office No. E-10F-05</p>
            <p>Hamriyah Free Zone,</p>
            <p>Sharjah (UAE), P.O. 50096</p>
            <div className="pt-1 mt-1 border-t border-slate-700/50 space-y-0.5">
              <p className="flex items-center gap-1.5"><Phone size={10} className="text-indigo-400"/> +971 50 5587858</p>
              <p className="flex items-center gap-1.5"><Mail size={10} className="text-indigo-400"/> sales@globcomfze.com</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-sm font-bold transition-all border border-rose-500/20 hover:border-rose-500 shadow-sm"
        >
          <LogOut size={16} /> Secure Sign Out
        </button>
      </div>

    </div>
  );
}