import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Activity, Box, FileBox, Globe, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Fetch real-time company stats
  const [demandCount, supplyCount, buyerCount, userCount, recentLogs] = await Promise.all([
    prisma.demand.count({ where: { status: "ACTIVE" } }),
    prisma.supply.count({ where: { status: "ACTIVE" } }),
    prisma.externalBuyer.count(),
    prisma.user.count(),
    prisma.auditLog.findMany({ 
      take: 5, 
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Globe size={16} className="text-blue-500" />
              Global Commodity Trading Overview
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">Welcome, {session.user?.name || session.user?.email}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">GlobCom Personnel</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><FileBox size={64} /></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Demands</p>
            <h2 className="text-4xl font-black text-blue-600 mt-2">{demandCount}</h2>
            <p className="text-xs text-slate-500 mt-2">Open client requests</p>
          </div>
          {/* Card 2 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Box size={64} /></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Supply</p>
            <h2 className="text-4xl font-black text-emerald-600 mt-2">{supplyCount}</h2>
            <p className="text-xs text-slate-500 mt-2">Internal inventory</p>
          </div>
          {/* Card 3 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Client Network</p>
            <h2 className="text-4xl font-black text-amber-600 mt-2">{buyerCount}</h2>
            <p className="text-xs text-slate-500 mt-2">Registered external buyers</p>
          </div>
          {/* Card 4 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={64} /></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Personnel</p>
            <h2 className="text-4xl font-black text-slate-700 mt-2">{userCount}</h2>
            <p className="text-xs text-slate-500 mt-2">System operators online</p>
          </div>
        </div>

        {/* Lower Section: Action & Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Core Focus Area */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-10 -bottom-10 opacity-20"><TrendingUp size={200} /></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Agile Execution. Ethical Trade.</h3>
              <p className="text-slate-400 max-w-md mb-8">
                Facilitating global trade in fertilizers, petrochemicals, metals, and fuels. Ensure all transactions comply with internal transparency guidelines.
              </p>
              <div className="flex gap-4">
                <a href="/demands" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">Post Demand</a>
                <a href="/supplies" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-md transition-colors">Update Supply</a>
              </div>
            </div>
          </div>

          {/* Compliance Mini-Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-rose-500" /> Live Audit Log
              </h3>
              <a href="/audit" className="text-xs font-bold text-blue-600 hover:underline">View All</a>
            </div>
            
            <div className="flex-1 space-y-4">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No recent activity.</p>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="border-l-2 border-slate-200 pl-3">
                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={log.details}>{log.details}</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">
                      {log.user.firstName} • {new Date(log.createdAt).toLocaleTimeString()}
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