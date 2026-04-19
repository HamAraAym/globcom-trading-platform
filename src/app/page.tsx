import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Activity, Box, FileBox, Globe, ShieldCheck, TrendingUp, Users, CheckCircle2, BarChart3, Wallet } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 1. Fetch all required data in parallel
  const [demands, supplies, buyerCount, userCount, recentLogs] = await Promise.all([
    prisma.demand.findMany(),
    prisma.supply.findMany(),
    prisma.client.count(),
    prisma.user.count(),
    prisma.auditLog.findMany({ 
      take: 5, 
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  // 2. Aggregate Financial Metrics & Pipeline Health
  let pipelineValue = 0;
  let closedValue = 0;
  let closedCount = 0;
  let activeDemandsCount = 0;
  let activeSuppliesCount = 0;

  demands.forEach(d => {
    // FIX: Fallback to 0 if the targetPrice is null/TBD
    const val = d.quantity * (d.targetPrice || 0);
    if (d.status === "CLOSED_WON") { closedValue += val; closedCount++; }
    else if (d.status !== "CANCELLED" && d.status !== "CLOSED_LOST") { pipelineValue += val; activeDemandsCount++; }
  });

  supplies.forEach(s => {
    // FIX: Fallback to 0 if the price is null/TBD
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <Globe size={16} className="text-blue-500" />
              Global Commodity Trading Overview
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">Welcome, {session.user?.name || session.user?.email}</p>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-0.5">GlobCom Personnel</p>
          </div>
        </div>

        {/* TOP FINANCIAL METRICS (New Management Reporting) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4"><BarChart3 size={150} /></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Activity size={16} className="text-blue-500" /> Active Pipeline Value
            </p>
            <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-sm">
              {formatCurrency(pipelineValue)}
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-3">
              Total volume currently <span className="text-blue-400">active</span> or <span className="text-amber-400">under negotiation</span>.
            </p>
          </div>

          <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl border border-emerald-500 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 opacity-20 translate-x-4 translate-y-4"><Wallet size={150} /></div>
            <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-2 flex items-center gap-2">
               <CheckCircle2 size={16} className="text-white" /> Closed Won Revenue
            </p>
            <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-sm">
              {formatCurrency(closedValue)}
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-emerald-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${closedPercentage}%` }}></div>
              </div>
              <span className="text-xs font-bold text-emerald-50">{closedPercentage}% Capture Rate</span>
            </div>
          </div>
        </div>

        {/* SECONDARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-blue-300 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><FileBox size={14} className="text-blue-500"/> Active Demands</p>
            <h2 className="text-3xl font-black text-slate-900">{activeDemandsCount}</h2>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Box size={14} className="text-emerald-500"/> Available Supply</p>
            <h2 className="text-3xl font-black text-slate-900">{activeSuppliesCount}</h2>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-amber-300 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-500"/> Deals Closed</p>
            <h2 className="text-3xl font-black text-slate-900">{closedCount} <span className="text-sm text-slate-400 font-medium">Won</span></h2>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-400 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Users size={14} className="text-slate-500"/> Client Network</p>
            <h2 className="text-3xl font-black text-slate-900">{buyerCount} <span className="text-sm text-slate-400 font-medium">Buyers</span></h2>
          </div>
        </div>

        {/* Lower Section: Action & Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Action Center */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Agile Execution. Ethical Trade.</h3>
            <p className="text-slate-500 mb-8 max-w-xl text-sm leading-relaxed">
              Facilitating global trade in fertilizers, petrochemicals, metals, and fuels. Ensure all transactions comply with internal transparency guidelines and standard operating procedures.
            </p>
            <div className="flex gap-4">
              <a href="/demands" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20">Access Demand Board</a>
              <a href="/supplies" className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">Manage Supply Inventory</a>
            </div>
          </div>

          {/* Compliance Mini-Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[300px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShieldCheck size={18} className="text-slate-400" /> Audit Log
              </h3>
              <a href="/audit" className="text-xs font-bold text-blue-600 hover:underline">View All</a>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {recentLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                   <p className="text-sm font-bold text-slate-400">No recent activity.</p>
                </div>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-slate-200 pl-3">
                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={log.details}>{log.details}</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">
                      {log.user.firstName} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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