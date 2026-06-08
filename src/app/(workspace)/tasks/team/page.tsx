import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, Clock, CheckCircle2, Activity, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamWorkloadPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  // 1. Fetch all active employees
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
    orderBy: { firstName: "asc" }
  });

  // 2. Fetch all active and completed tasks to calculate metrics
  const tasks = await prisma.task.findMany({
    include: {
      assignees: { select: { id: true } }
    }
  });

  // 3. Aggregate data per user
  const workloadData = users.map(user => {
    const userTasks = tasks.filter(t => t.assignees.some(a => a.id === user.id));
    
    const activeTasks = userTasks.filter(t => t.status !== "DONE");
    const completedTasks = userTasks.filter(t => t.status === "DONE");
    
    const totalEstimated = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return {
      ...user,
      activeCount: activeTasks.length,
      completedCount: completedTasks.length,
      totalEstimated,
      totalActual,
      isOverloaded: activeTasks.length > 5 // Simple flag if they have too many active tickets
    };
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 md:px-8 py-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Team Workload</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Real-time capacity and time-tracking analytics across your organization.</p>
          </div>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workloadData.map((stat) => (
            <div key={stat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              
              {/* User Identity */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                    {stat.firstName[0]}{stat.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{stat.firstName} {stat.lastName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.role.replace("_", " ")}</p>
                  </div>
                </div>
                {stat.isOverloaded && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100" title="High volume of active tickets">
                    <AlertCircle className="w-3 h-3" /> Overloaded
                  </div>
                )}
              </div>

              {/* Core Metrics */}
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Activity className="w-3 h-3 text-indigo-500" /> Active Tasks
                  </span>
                  <span className="text-2xl font-black text-slate-900">{stat.activeCount}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                  </span>
                  <span className="text-2xl font-black text-slate-900">{stat.completedCount}</span>
                </div>
              </div>

              {/* Time Tracking Progress */}
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours Burned
                  </span>
                  <span>{stat.totalActual}h / {stat.totalEstimated}h</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${stat.totalActual > stat.totalEstimated ? "bg-rose-500" : "bg-indigo-500"}`} 
                    style={{ width: `${Math.min((stat.totalActual / (stat.totalEstimated || 1)) * 100, 100)}%` }}
                  />
                </div>
                {stat.totalActual > stat.totalEstimated && stat.totalEstimated > 0 && (
                  <p className="text-[10px] font-bold text-rose-500 mt-2 text-right">Exceeded estimates by {stat.totalActual - stat.totalEstimated} hours</p>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}