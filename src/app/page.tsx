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
      name: "Trading Platform",
      description: "Command Center, Demand/Supply Ledgers, and Matchmaking.",
      href: "/trading",
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-100",
      border: "hover:border-blue-500",
    },
    {
      name: "Task Management",
      description: "Internal sprint tracking, multi-user assignments, and team ops.",
      href: "/tasks", 
      icon: KanbanSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      border: "hover:border-indigo-500",
    },
    {
      name: "CRM Database",
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
      name: "Team & Access",
      description: "Admin panel for user roles, access control, and onboarding.",
      href: "/users",
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100",
      border: "hover:border-purple-500",
    },
    {
      name: "System Settings",
      description: "Global configurations, integrations, and company profile.",
      href: "/settings",
      icon: Settings,
      color: "text-slate-600",
      bg: "bg-slate-200",
      border: "hover:border-slate-500",
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800/50 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {brandLogo ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-lg shadow-white/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20 shrink-0">
                  GC
                </div>
              )}
              <h2 className="text-xl font-black text-white tracking-widest uppercase">{brandName}</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Welcome, {session?.user?.name || "Operator"}
            </h1>
            <p className="text-slate-400 mt-3 text-lg">
              Select an enterprise module to launch your workspace.
            </p>
          </div>
          
          {/* Global User Menu (Profile & Logout) */}
          <div className="shrink-0">
            <GlobalUserMenu />
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link 
                key={mod.name} 
                href={mod.href}
                className={`group relative bg-slate-900 p-8 rounded-3xl border border-slate-800 transition-all duration-300 ${mod.border} hover:shadow-2xl hover:-translate-y-1 focus:outline-none`}
              >
                <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-7 h-7 ${mod.color}`} />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">
                  {mod.name}
                </h3>
                
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                  {mod.description}
                </p>

                <div className="flex items-center font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors mt-auto text-sm">
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