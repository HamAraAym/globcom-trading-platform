import { prisma } from "@/lib/prisma";
import { assignRep } from "@/actions/buyerActions";
import { Users, Building, Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Briefcase, MapPin, ShieldAlert, Clock, ExternalLink, User, Globe } from "lucide-react";
import ClientModal from "@/components/ClientModal";
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Page Header with Modal */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client CRM Directory</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Secure database of verified corporate entities and individual traders. Manage compliance, assign Account Executives, and track trading histories.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 font-bold text-sm shadow-sm">
            <ShieldCheck size={18} /> KYC Controlled
          </div>
          {/* THE MODAL BUTTON */}
          <ClientModal />
        </div>
      </div>

      {/* Full Width CRM Table */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <Briefcase size={20} className="text-indigo-400" />
            <h2 className="text-xl font-bold tracking-wide">Enterprise Master Database</h2>
          </div>
          <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {clients.length} Registered Entities
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-5">Entity Type</th>
                <th className="p-5">Client Profile</th>
                <th className="p-5">Compliance (KYC)</th>
                <th className="p-5">Contact Info</th>
                <th className="p-5">Account Executive</th>
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
                      <td className="p-5">
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
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm ${client.type === 'CORPORATE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/crm/${client.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                              {client.company ? client.company : client.name} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                               {client.company ? <User size={10} /> : <Globe size={10} />}
                               {client.company ? client.name : (client.country || "Location Unspecified")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Strict KYC Compliance Badge */}
                      <td className="p-5">
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
                      <td className="p-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Mail size={14} className="text-slate-400" /> {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Phone size={14} className="text-slate-400" /> {client.phone || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* 5. Account Executive Assignment */}
                      <td className="p-5">
                        <form action={assignRep.bind(null, client.id)} className="flex items-center gap-2">
                          <select 
                            name="repId" 
                            defaultValue={client.assignedRepId || "unassigned"}
                            className={`w-full max-w-[200px] border text-sm rounded-lg p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              isAssigned ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                            }`}
                          >
                            <option value="unassigned" className="font-medium text-slate-400">-- Unassigned --</option>
                            {reps.map(rep => <option key={rep.id} value={rep.id} className="font-medium">{rep.firstName} {rep.lastName}</option>)}
                          </select>
                          <button type="submit" className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group-hover:opacity-100 opacity-50">
                            {isAssigned ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-rose-500" />}
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