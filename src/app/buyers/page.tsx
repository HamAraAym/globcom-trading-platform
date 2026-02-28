import { prisma } from "@/lib/prisma";
import { assignRep } from "@/actions/buyerActions";
import { Users, Building, Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Briefcase, MapPin } from "lucide-react";
import ClientModal from "@/components/ClientModal";

export default async function BuyersPage() {
  const [buyers, reps] = await Promise.all([
    prisma.externalBuyer.findMany({
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
              Secure database of external buyers. Add new clients and assign them to specific internal Trading Representatives.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 font-bold text-sm shadow-sm">
            <ShieldCheck size={18} /> Admin Controlled
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
            <h2 className="text-xl font-bold tracking-wide">External Master Database</h2>
          </div>
          <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {buyers.length} Total Records
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-5">Client Profile</th>
                <th className="p-5">Corporate Entity</th>
                <th className="p-5">Location Data</th>
                <th className="p-5">Contact Details</th>
                <th className="p-5">Account Executive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {buyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 bg-slate-50">
                    <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">No external buyers registered.</p>
                  </td>
                </tr>
              ) : (
                buyers.map((buyer) => {
                  const isAssigned = !!buyer.assignedRepId;
                  // Handle old records that might just have a string "address" vs our new schema
                  const addressDisplay = (buyer as any).city ? `${(buyer as any).city}, ${(buyer as any).country}` : ((buyer as any).address || "N/A");

                  return (
                    <tr key={buyer.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                            {buyer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{buyer.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: #{buyer.id.substring(0,6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                          <Building size={16} className="text-indigo-400" />
                          {buyer.company}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700 text-sm">
                          <MapPin size={16} className="text-rose-400" />
                          {addressDisplay}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={14} className="text-slate-400" /> {buyer.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={14} className="text-slate-400" /> {buyer.phone || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <form action={assignRep.bind(null, buyer.id)} className="flex items-center gap-2">
                          <select 
                            name="repId" 
                            defaultValue={buyer.assignedRepId || "unassigned"}
                            className={`w-full max-w-[200px] border text-sm rounded-lg p-2.5 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              isAssigned ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                            }`}
                          >
                            <option value="unassigned">-- Unassigned --</option>
                            {reps.map(rep => <option key={rep.id} value={rep.id}>{rep.firstName} {rep.lastName}</option>)}
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