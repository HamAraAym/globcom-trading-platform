import { prisma } from "@/lib/prisma";
import { assignRep } from "@/actions/buyerActions";
import { Users, Building, Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Briefcase, MapPin, ShieldAlert, Clock, ExternalLink, User, Globe, UserMinus } from "lucide-react";
import ClientModal from "@/components/ClientModal";
import ExportButton from "@/components/ExportButton"; 
import Link from "next/link";

export default async function BuyersPage() {
  const [clients, reps] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { assignedRep: true }
    }),
    prisma.user.findMany({
      where: { role: "TRADING_REP" }, 
      orderBy: { firstName: "asc" }
    })
  ]);

  // KPI Calculations
  const totalClients = clients.length;
  const verifiedClients = clients.filter(c => c.kycStatus === "VERIFIED").length;
  const unassignedClients = clients.filter(c => !c.assignedRepId).length;

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 font-sans min-h-full bg-slate-50">
      
      {/* Page Header with Modal */}
      <div className="max-w-[1600px] mx-auto w-full mb-8 shrink-0 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        
        {/* Left: Title & Icon */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 mt-1">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Client CRM Directory</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
               Database of verified corporate entities and individual traders. Manage compliance, assign Account Executives, and track trading histories.
            </p>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden lg:flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl border border-blue-100 font-bold text-sm shadow-sm">
              <ShieldCheck size={18} /> KYC Controlled
            </div>
            <div className="flex-1 sm:flex-none">
              <ExportButton data={clients} type="CRM_Database" />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <ClientModal />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8 shrink-0">
        <div className="bg-white p-5 md:p-6 rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 border border-blue-100 shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Network</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              {totalClients} <span className="text-sm font-medium text-slate-400">Entities</span>
            </h3>
          </div>
        </div>
        
        <div className="bg-white p-5 md:p-6 rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-4 rounded-2xl text-green-600 border border-green-100 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">KYC Verified</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              {verifiedClients} <span className="text-sm font-medium text-slate-400">Cleared</span>
            </h3>
          </div>
        </div>
        
        <div className="bg-white p-5 md:p-6 rounded-[20px] border border-rose-200 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)] flex items-center gap-4 sm:col-span-2 md:col-span-1 transition-colors">
          <div className="bg-rose-50 p-4 rounded-2xl text-rose-500 border border-rose-100 shrink-0">
            <UserMinus size={22} />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-widest mb-0.5">Action Required</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              {unassignedClients} <span className="text-sm font-medium text-slate-400">Unassigned</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Full Width CRM Table */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Dark Enterprise Header */}
        <div className="bg-[#0f172a] px-6 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <Briefcase size={22} className="text-blue-500 shrink-0" />
            <h2 className="text-lg md:text-xl font-bold tracking-wide">Enterprise Master Database</h2>
          </div>
          <div className="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-sm w-fit">
            {clients.length} Registered Entities
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1050px]">
            
            {/* White Header Row */}
            <thead className="sticky top-0 bg-white z-10 border-b-2 border-slate-100">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 md:px-8 py-5">Entity Type</th>
                <th className="px-6 md:px-8 py-5">Client Profile</th>
                <th className="px-6 md:px-8 py-5">Compliance (KYC)</th>
                <th className="px-6 md:px-8 py-5">Contact Info</th>
                <th className="px-6 md:px-8 py-5">Account Executive</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400 bg-slate-50/50">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-bold text-slate-700">No clients in CRM.</p>
                    <p className="text-sm mt-1">Add a new entity using the button above to begin tracking.</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const isAssigned = !!client.assignedRepId;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 1. Entity Type Badge */}
                      <td className="px-6 md:px-8 py-5">
                        {client.type === "CORPORATE" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                            <Building size={14} /> Corporate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <User size={14} /> Individual
                          </span>
                        )}
                      </td>

                      {/* 2. Client Profile Link & Info */}
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${client.type === 'CORPORATE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/crm/${client.id}`} className="font-bold text-slate-900 text-[15px] hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                              <span className="truncate max-w-[200px]">{client.company ? client.company : client.name}</span> 
                              <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 shrink-0 text-blue-500 transition-opacity" />
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                               {client.company ? <User size={12} className="shrink-0 text-slate-400" /> : <Globe size={12} className="shrink-0 text-slate-400" />}
                               <span className="truncate max-w-[200px]">{client.company ? client.name : (client.country || "Location Unspecified")}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Strict KYC Compliance Badge */}
                      <td className="px-6 md:px-8 py-5">
                        {client.kycStatus === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <ShieldCheck size={14} /> Verified
                          </span>
                        )}
                        {client.kycStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                            <Clock size={14} /> Pending Docs
                          </span>
                        )}
                        {client.kycStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                            <ShieldAlert size={14} /> Rejected
                          </span>
                        )}
                      </td>

                      {/* 4. Contact Details */}
                      <td className="px-6 md:px-8 py-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                            <Mail size={14} className="text-slate-400 shrink-0" /> {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                            <Phone size={14} className="text-slate-400 shrink-0" /> {client.phone || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* 5. Account Executive Assignment */}
                      <td className="px-6 md:px-8 py-5">
                        <form action={assignRep.bind(null, client.id)} className="flex items-center gap-2">
                          <select 
                            name="repId" 
                            defaultValue={client.assignedRepId || "unassigned"}
                            className={`w-full max-w-[180px] text-[13px] rounded-lg p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer ${
                              isAssigned ? "bg-slate-50 border border-slate-200 text-slate-700" : "bg-rose-50 border border-rose-200 border-dashed text-rose-600"
                            }`}
                          >
                            <option value="unassigned" className="font-semibold text-slate-400">-- Unassigned --</option>
                            {reps.map(rep => <option key={rep.id} value={rep.id} className="font-semibold text-slate-700">{rep.firstName} {rep.lastName}</option>)}
                          </select>
                          <button type="submit" className={`p-2.5 rounded-lg transition-all flex items-center justify-center shrink-0 border ${isAssigned ? 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200' : 'bg-white border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'}`}>
                            {isAssigned ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          </button>
                        </form>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}