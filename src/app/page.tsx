import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { 
  Briefcase, 
  KanbanSquare, 
  Users, 
  ShieldAlert, 
  Settings, 
  Activity,
  ArrowRight,
  BellRing,
  ChevronRight
} from "lucide-react";
import GlobalUserMenu from "@/components/GlobalUserMenu";
import { getGlobalSettings } from "@/actions/adminActions";

export const dynamic = "force-dynamic";

export default async function GlobalHomePage() {
  const session = await getServerSession();

  // Fetch the global branding from the database
  const systemSettings = await getGlobalSettings();
  const brandName = systemSettings?.companyName || "GlobCom International";
  const brandLogo = systemSettings?.companyLogoUrl;

  // ⚡ NEW: Securely fetch the current user's unread notifications
  let unreadNotifications: any[] = [];
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (dbUser) {
      unreadNotifications = await prisma.notification.findMany({
        where: { userId: dbUser.id, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 4 // Limit to top 4 so it doesn't crowd out the modules
      });
    }
  }

  const modules = [
    {
      name: "Trading Hub",
      description: "Command Center, Demand/Supply Ledgers, and Matchmaking.",
      href: "/dashboard", 
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-100",
      border: "hover:border-blue-500",
    },
    {
      name: "Task Engine",
      description: "Internal sprint tracking, multi-user assignments, and team ops.",
      href: "/tasks", 
      icon: KanbanSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      border: "hover:border-indigo-500",
    },
    {
      name: "Client CRM",
      description: "Client KYC verification, entity network, and relationship history.",
      href: "/buyers",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      border: "hover:border-emerald-500",
    },
    {
      name: "System Audit",
      description: "Immutable logs of all platform actions and compliance tracking.",
      href: "/audit",
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-100",
      border: "hover:border-amber-500",
    },
    {
      name: "Team Access",
      description: "Admin panel for user roles, access control, and onboarding.",
      href: "/users",
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100",
      border: "hover:border-purple-500",
    },
    {
      name: "Settings",
      description: "Global configurations, integrations, and company profile.",
      href: "/settings",
      icon: Settings,
      color: "text-slate-600",
      bg: "bg-slate-200",
      border: "hover:border-slate-500",
    }
  ];

  return (
    <div 
      className="absolute inset-0 w-full overflow-y-auto bg-[#0B0F19] flex flex-col items-center px-4 md:px-6 custom-scrollbar"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)'
      }}
    >
      <div className="max-w-6xl w-full my-auto pb-8">
        
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 border-b border-slate-800/50 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {brandLogo ? (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-lg shadow-white/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-blue-600/20 shrink-0">
                  GC
                </div>
              )}
              <h2 className="text-sm md:text-xl font-black text-white tracking-widest uppercase truncate">{brandName}</h2>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome, {session?.user?.name?.split(" ")[0] || "Operator"}
            </h1>
            <p className="text-sm md:text-lg text-slate-400 mt-2">
              Select an enterprise module to launch.
            </p>
          </div>
          
          {/* Global User Menu (Profile & Logout) */}
          <div className="shrink-0 w-full sm:w-auto">
            <GlobalUserMenu />
          </div>
        </div>

        {/* ⚡ NEW: Live Action Alerts Feed */}
        {unreadNotifications.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BellRing size={16} className="text-rose-500" /> Action Required
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unreadNotifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.link || "#"}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="text-slate-200 font-bold text-sm mb-0.5 group-hover:text-white transition-colors truncate">
                      {notif.title}
                    </h4>
                    <p className="text-slate-400 text-xs truncate">
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link 
                key={mod.name} 
                href={mod.href}
                className={`group relative bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 transition-all duration-300 ${mod.border} hover:shadow-2xl hover:-translate-y-1 focus:outline-none flex flex-col h-full`}
              >
                <div className="flex items-center gap-4 mb-3 md:mb-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${mod.bg} flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 ${mod.color}`} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors leading-tight">
                    {mod.name}
                  </h3>
                </div>
                
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-6 flex-1">
                  {mod.description}
                </p>

                <div className="flex items-center font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors mt-auto text-xs md:text-sm">
                  Launch Module 
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}