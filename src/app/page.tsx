import Link from "next/link";
import { getServerSession } from "next-auth";
import { 
  Briefcase, 
  KanbanSquare, 
  Users, 
  ShieldAlert, 
  Settings, 
  Activity,
  ArrowRight,
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
      // ⚡ FIX 1: h-full and overflow-y-auto allows this specific view to scroll independently of the locked body
      className="h-full w-full overflow-y-auto bg-[#0B0F19] flex flex-col items-center justify-start md:justify-center px-4 py-6 md:p-6"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)'
      }}
    >
      <div className="max-w-6xl w-full my-auto">
        
        {/* Hub Header */}
        <div className="flex flex-row items-start justify-between gap-4 mb-8 md:mb-12 border-b border-slate-800/50 pb-6 md:pb-8">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              {brandLogo ? (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-lg shadow-white/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm md:text-xl shadow-lg shadow-blue-600/20 shrink-0">
                  GC
                </div>
              )}
              <h2 className="text-sm md:text-xl font-black text-white tracking-widest uppercase truncate">{brandName}</h2>
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome, <br className="md:hidden" />
              {session?.user?.name?.split(" ")[0] || "Operator"}
            </h1>
            <p className="text-xs md:text-lg text-slate-400 mt-2 md:mt-3">
              Select an enterprise module to launch.
            </p>
          </div>
          
          {/* Global User Menu (Profile & Logout) */}
          <div className="shrink-0 mt-1 md:mt-0">
            <GlobalUserMenu />
          </div>
        </div>

        {/* ⚡ FIX 2: Mobile changes to grid-cols-2 for tappable app squares */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link 
                key={mod.name} 
                href={mod.href}
                className={`group relative bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 transition-all duration-300 ${mod.border} hover:shadow-2xl hover:-translate-y-1 focus:outline-none flex flex-col h-full`}
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${mod.bg} flex items-center justify-center mb-3 md:mb-6 transition-transform group-hover:scale-110 shrink-0`}>
                  <Icon className={`w-5 h-5 md:w-7 md:h-7 ${mod.color}`} />
                </div>
                
                <h3 className="text-sm md:text-2xl font-black text-white mb-1 md:mb-3 tracking-tight group-hover:text-blue-400 transition-colors leading-tight">
                  {mod.name}
                </h3>
                
                {/* Descriptions are hidden on mobile to keep the boxes clean and app-like */}
                <p className="hidden md:block text-slate-400 font-medium leading-relaxed mb-8">
                  {mod.description}
                </p>

                <div className="hidden md:flex items-center font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors mt-auto text-sm">
                  Launch Module 
                  <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}