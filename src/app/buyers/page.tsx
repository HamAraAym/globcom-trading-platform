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

  // KPI Calculations based on your schema
  const totalClients = clients.length;
  const verifiedClients = clients.filter(c => c.kycStatus === "VERIFIED").length;
  const unassignedClients = clients.filter(c => !c.assignedRepId).length;

  return (
    // Changed to flex-1 to naturally fill the PageWrapper without forcing h-screen cuts
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 font-sans min-h-full">
      
      {/* Page Header with Modal */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
            <Users size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Client CRM Directory</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Secure database of verified corporate entities and individual traders. Manage compliance, assign Account Executives, and track trading histories.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="hidden lg:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl border border-indigo-100 font-bold text-sm shadow-sm">
            <ShieldCheck size={18} /> KYC Controlled
          </div>
          <div className="flex-1 sm:flex-none">
            <ExportButton data={clients} type="CRM_Database" />
          </div>
          <div className="flex-1 sm:flex-none">
            <ClientModal />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 shrink-0">
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 shrink-0"><Briefcase size={20} className="md:w-6 md:h-6" /></div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Total Network</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">{totalClients} <span className="text-xs md:text-sm font-medium text-slate-400">Entities</span></h3>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0"><ShieldCheck size={20} className="md:w-6 md:h-6" /></div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">KYC Verified</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">{verifiedClients} <span className="text-xs md:text-sm font-medium text-slate-400">Cleared</span></h3>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-rose-200 shadow-sm flex items-center gap-4 relative overflow-hidden sm:col-span-2 md:col-span-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600 shrink-0"><UserMinus size={20} className="md:w-6 md:h-6" /></div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-widest">Action Required</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">{unassignedClients} <span className="text-xs md:text-sm font-medium text-slate-400">Unassigned</span></h3>
          </div>
        </div>
      </div>

      {/* Full Width CRM Table */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-[20px] md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="bg-slate-900 px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <Briefcase size={20} className="text-indigo-400 shrink-0" />
            <h2 className="text-lg md:text-xl font-bold tracking-wide">Enterprise Master Database</h2>
          </div>
          <div className="bg-indigo-600 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm w-fit">
            {clients.length} Registered Entities
          </div>
        </div>

        {/* The overflow-x-auto container ensures the table scrolls horizontally on mobile */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50">
          {/* min-w-[1000px] prevents columns from squashing on phones */}
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-4 md:p-5">Entity Type</th>
                <th className="p-4 md:p-5">Client Profile</th>
                <th className="p-4 md:p-5">Compliance (KYC)</th>
                <th className="p-4 md:p-5">Contact Info</th>
                <th className="p-4 md:p-5">Account Executive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500 bg-slate-50">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-bold text-slate-700">No clients in CRM.</p>
                    <p className="text-sm mt-1">Add a new entity using the button above to begin tracking.</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const isAssigned = !!client.assignedRepId;

                  return (
                    <tr key={client.id} className="hover:bg-indigo-50/30 transition-colors group">
                      
                      {/* 1. Entity Type Badge */}
                      <td className="p-4 md:p-5">
                        {client.type === "CORPORATE" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200">
                            <Building size={14} /> Corporate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                            <User size={14} /> Individual
                          </span>
                        )}
                      </td>

                      {/* 2. Client Profile Link & Info */}
                      <td className="p-4 md:p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm shrink-0 ${client.type === 'CORPORATE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/crm/${client.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                              <span className="truncate max-w-[200px]">{client.company ? client.company : client.name}</span> 
                              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 shrink-0" />
                            </Link>
                            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                               {client.company ? <User size={10} className="shrink-0" /> : <Globe size={10} className="shrink-0" />}
                               <span className="truncate max-w-[200px]">{client.company ? client.name : (client.country || "Location Unspecified")}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Strict KYC Compliance Badge */}
                      <td className="p-4 md:p-5">
                        {client.kycStatus === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                            <ShieldCheck size={14} /> Verified
                          </span>
                        )}
                        {client.kycStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                            <Clock size={14} /> Pending Docs
                          </span>
                        )}
                        {client.kycStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 shadow-sm">
                            <ShieldAlert size={14} /> Rejected
                          </span>
                        )}
                      </td>

                      {/* 4. Contact Details */}
                      <td className="p-4 md:p-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Mail size={14} className="text-slate-400 shrink-0" /> {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Phone size={14} className="text-slate-400 shrink-0" /> {client.phone || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* 5. Account Executive Assignment */}
                      <td className="p-4 md:p-5">
                        <form action={assignRep.bind(null, client.id)} className="flex items-center gap-2">
                          <select 
                            name="repId" 
                            defaultValue={client.assignedRepId || "unassigned"}
                            className={`w-full max-w-[180px] md:max-w-[200px] border text-xs md:text-sm rounded-lg p-2 md:p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              isAssigned ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                            }`}
                          >
                            <option value="unassigned" className="font-medium text-slate-400">-- Unassigned --</option>
                            {reps.map(rep => <option key={rep.id} value={rep.id} className="font-medium">{rep.firstName} {rep.lastName}</option>)}
                          </select>
                          <button type="submit" className="p-2 md:p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group-hover:opacity-100 lg:opacity-50">
                            {isAssigned ? <CheckCircle2 size={16} className="text-emerald-500 md:w-[18px] md:h-[18px]" /> : <AlertCircle size={16} className="text-rose-500 md:w-[18px] md:h-[18px]" />}
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