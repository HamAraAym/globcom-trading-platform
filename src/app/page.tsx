import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Activity, Box, FileBox, Globe, ShieldCheck, Users, CheckCircle2, BarChart3, Wallet } from "lucide-react";
import Link from "next/link";
import MatchingEngine from "@/components/MatchingEngine";
import DashboardCharts from "@/components/DashboardCharts"; // NEW: Recharts integration

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 1. Fetch all required data in parallel (Added verified clients for charts)
  const [demands, supplies, buyerCount, userCount, recentLogs, verifiedClientsCount] = await Promise.all([
    prisma.demand.findMany(),
    prisma.supply.findMany(),
    prisma.client.count(),
    prisma.user.count(),
    prisma.auditLog.findMany({ 
      take: 6, 
      orderBy: { createdAt: "desc" },
      include: { user: true }
    }),
    prisma.client.count({ where: { kycStatus: "VERIFIED" } })
  ]);

  // 2. Aggregate Financial Metrics & Pipeline Health
  let pipelineValue = 0;
  let closedValue = 0;
  let closedCount = 0;
  let activeDemandsCount = 0;
  let activeSuppliesCount = 0;

  demands.forEach(d => {
    const val = d.quantity * (d.targetPrice || 0);
    if (d.status === "CLOSED_WON") { closedValue += val; closedCount++; }
    else if (d.status !== "CANCELLED" && d.status !== "CLOSED_LOST") { pipelineValue += val; activeDemandsCount++; }
  });

  supplies.forEach(s => {
    const val = s.quantity * (s.price || 0);
    if (s.status === "CLOSED_WON") { closedValue += val; closedCount++; }
    else if (s.status !== "CANCELLED" && s.status !== "CLOSED_LOST") { pipelineValue += val; activeSuppliesCount++; }
  });

  const totalValue = pipelineValue + closedValue;
  const closedPercentage = totalValue > 0 ? Math.round((closedValue / totalValue) * 100) : 0;

  // Formatter for large currency values
  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  // 3. Format Data for the Recharts Component
  const chartData = {
    volumeData: [
      { name: "Demands", volume: activeDemandsCount },
      { name: "Supplies", volume: activeSuppliesCount },
    ],
    kycData: [
      { name: "Verified", value: verifiedClientsCount },
      { name: "Pending", value: buyerCount - verifiedClientsCount },
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-10 font-sans overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium text-sm">
              <Globe size={16} className="text-indigo-500 shrink-0" />
              Global Commodity Trading Overview
            </p>
          </div>
          <div className="text-left md:text-right bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <p className="text-sm font-bold text-slate-900 truncate">Welcome, {session.user?.name || session.user?.email}</p>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">GlobCom Personnel</p>
          </div>
        </div>

        {/* TOP FINANCIAL METRICS (Responsive scaling on text sizes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 hidden sm:block"><BarChart3 size={150} /></div>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Activity size={16} className="text-indigo-500 shrink-0" /> Active Pipeline Value
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-sm truncate">
              {formatCurrency(pipelineValue)}
            </h2>
            <p className="text-xs md:text-sm font-medium text-slate-400 mt-2 md:mt-3 relative z-10">
              Total volume currently <span className="text-indigo-400 font-bold">active</span> or <span className="text-amber-400 font-bold">under negotiation</span>.
            </p>
          </div>

          <div className="bg-emerald-600 p-6 md:p-8 rounded-3xl shadow-xl border border-emerald-500 relative overflow-hidden flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
            <div className="absolute right-0 bottom-0 opacity-20 translate-x-4 translate-y-4 hidden sm:block"><Wallet size={150} /></div>
            <p className="text-[10px] md:text-xs font-black text-emerald-100 uppercase tracking-widest mb-2 flex items-center gap-2">
               <CheckCircle2 size={16} className="text-white shrink-0" /> Closed Won Revenue
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-sm truncate">
              {formatCurrency(closedValue)}
            </h2>
            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 relative z-10">
              <div className="w-full sm:flex-1 h-2 bg-emerald-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${closedPercentage}%` }}></div>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-emerald-50 tracking-wider whitespace-nowrap">{closedPercentage}% CAPTURE</span>
            </div>
          </div>
        </div>

        {/* SECONDARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Link href="/demands" className="bg-white border border-slate-200 p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 md:gap-2 group-hover:text-indigo-600 transition-colors"><FileBox size={14} className="text-indigo-500 shrink-0"/> Active Demands</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">{activeDemandsCount}</h2>
          </Link>
          <Link href="/supplies" className="bg-white border border-slate-200 p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 md:gap-2 group-hover:text-emerald-600 transition-colors"><Box size={14} className="text-emerald-500 shrink-0"/> Available Supply</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">{activeSuppliesCount}</h2>
          </Link>
          <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-sm">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 md:gap-2"><CheckCircle2 size={14} className="text-amber-500 shrink-0"/> Deals Closed</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 truncate">{closedCount} <span className="text-xs md:text-sm text-slate-400 font-medium ml-1">Won</span></h2>
          </div>
          <Link href="/buyers" className="bg-white border border-slate-200 p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-sm hover:border-slate-400 hover:shadow-md transition-all group">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 md:gap-2 group-hover:text-slate-700 transition-colors"><Users size={14} className="text-slate-500 shrink-0"/> Client Network</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 truncate">{buyerCount} <span className="text-xs md:text-sm text-slate-400 font-medium ml-1">Entities</span></h2>
          </Link>
        </div>

        {/* ANALYTICS CHARTS (Recharts) */}
        <DashboardCharts chartData={chartData} />

        {/* THE AUTOMATED MATCHING ENGINE */}
        <div className="my-6 md:my-8 w-full overflow-x-hidden">
           <MatchingEngine />
        </div>

        {/* Lower Section: Action & Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Action Center */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 lg:p-10 border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 tracking-tight">Agile Execution. Ethical Trade.</h3>
              <p className="text-slate-500 mb-6 md:mb-8 max-w-xl text-xs md:text-sm leading-relaxed">
                Facilitating global trade in fertilizers, petrochemicals, metals, and fuels. Ensure all transactions comply with internal transparency guidelines and standard operating procedures.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                <Link href="/demands" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 md:px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 text-center">
                  Access Demand Board
                </Link>
                <Link href="/supplies" className="bg-white border border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-5 md:px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm text-center">
                  Manage Supply Inventory
                </Link>
              </div>
            </div>
            {/* Subtle background decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none hidden md:block">
              <Globe size={250} />
            </div>
          </div>

          {/* Compliance Mini-Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col h-[300px] md:h-[350px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider">
                <ShieldCheck size={18} className="text-indigo-500 shrink-0" /> Audit Log
              </h3>
              <Link href="/audit" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                View All
              </Link>
            </div>
            
            <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {recentLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs md:text-sm font-bold text-slate-400">No recent activity.</p>
                </div>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-slate-100 hover:border-indigo-300 transition-colors pl-3 md:pl-4 py-1">
                    <p className="text-[11px] md:text-xs font-bold text-slate-900 leading-tight">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed" title={log.details}>{log.details}</p>
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-widest flex items-center gap-1">
                      <span className="truncate max-w-[80px] md:max-w-[100px]">{log.user.firstName}</span> <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}