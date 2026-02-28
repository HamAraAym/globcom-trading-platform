import { prisma } from "@/lib/prisma";
import { ShieldAlert, Clock, History, Fingerprint, Activity } from "lucide-react";

export default async function AuditPage() {
  // Fetch all logs, newest first, and include the user who performed the action
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  // Helper function to color-code audit actions dynamically
  const getActionStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("POST")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (act.includes("UPDATE") || act.includes("MATCH")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (act.includes("DELETE") || act.includes("REMOVE")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (act.includes("EMAIL") || act.includes("DISPATCH")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
            <ShieldAlert size={28} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Audit Trail</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Immutable compliance ledger. All platform activities, data modifications, and external communications are permanently logged here.
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border border-rose-100 font-bold text-sm shadow-sm">
          <Fingerprint size={18} /> Strict Compliance Mode
        </div>
      </div>

      {/* Full Width Audit Table */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        
        {/* Table Header Bar */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <History size={20} className="text-rose-400" />
            <h2 className="text-xl font-bold tracking-wide">Live Event Ledger</h2>
          </div>
          <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
            <Activity size={14} />
            {logs.length} Total Records
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-5 w-56">Timestamp (UTC)</th>
                <th className="p-5 w-64">Authorized Personnel</th>
                <th className="p-5 w-48">Action Type</th>
                <th className="p-5">Detailed System Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 bg-slate-50">
                    <History size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">Ledger is currently empty.</p>
                    <p className="text-xs mt-1">System events will appear here securely.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono text-sm group">
                    
                    {/* Timestamp */}
                    <td className="p-5 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
                        {new Date(log.createdAt).toLocaleString('en-US', { 
                          month: 'short', day: '2-digit', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </div>
                    </td>

                    {/* User Info */}
                    <td className="p-5 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-xs">
                          {log.user.firstName.charAt(0)}{log.user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{log.user.role.replace("_", " ")}</p>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="p-5 font-sans">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border shadow-sm ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="p-5 text-slate-700 truncate max-w-xl" title={log.details}>
                      {log.details}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}