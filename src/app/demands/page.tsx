import { prisma } from "@/lib/prisma";
import { FileBox, ArrowRight, Eye, Edit } from "lucide-react";
import DemandForm from "@/components/DemandForm";
import ExportButton from "@/components/ExportButton";
import ViewDealModal from "@/components/ViewDealModal"; // NEW: Quick View Modal
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function DemandsPage() {
  const session = await getServerSession();
  
  let userRole = "GUEST";
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });
    if (dbUser) userRole = dbUser.role;
  }
  
  const canCreate = userRole === "ADMIN" || userRole === "BUYER_REP" || userRole === "BUYER";
  const canEdit = userRole === "ADMIN" || userRole === "TRADING_REP"; 

  // Fetch Demands + Ensure we grab the associated ChatRoom ID for routing
  const demands = await prisma.demand.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      createdBy: { select: { firstName: true, lastName: true } },
      chatRoom: { select: { id: true } }
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      
      {/* Page Header */}
      <div className="mb-8 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Demand Board</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Internal database of active client requests. Manage pipeline, export data, and negotiate active deals.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButton data={demands} type="Demands" />
          {canCreate && <DemandForm />}
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg border border-blue-200 shadow-sm">
              <FileBox size={20} className="text-blue-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Active Client Requests</h2>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {demands.length} Records Found
          </div>
        </div>

        {demands.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
            <FileBox size={48} className="text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-700">No Demands Found</p>
            {canCreate && <p className="text-sm mt-1 max-w-xs">Click the 'Post Demand' button above to populate the board.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
                  <th className="p-4 font-bold">Date Posted</th>
                  <th className="p-4 font-bold">Commodity</th>
                  <th className="p-4 font-bold">Volume</th>
                  <th className="p-4 font-bold">Target Price</th>
                  <th className="p-4 font-bold">Logistics Route</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {demands.map((demand) => (
                  <tr key={demand.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(demand.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {demand.title}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {new Intl.NumberFormat().format(demand.quantity)} {demand.quantityUnit}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {demand.targetPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(demand.targetPrice) : <span className="text-slate-400 italic font-medium">TBD</span>}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-2">
                      {demand.origin || "TBA"} <ArrowRight size={12} className="text-blue-400" /> {demand.destination || "TBA"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        demand.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                        demand.status === "UNDER_NEGOTIATION" ? "bg-amber-100 text-amber-700" :
                        demand.status === "CLOSED_WON" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {demand.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Added items-center here so all buttons align perfectly */}
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        
                        {/* 1. Quick View Modal */}
                        <ViewDealModal deal={demand} type="Demand" />
                        
                        {/* 2. Edit Modal */}
                        {canEdit && (
                          <DemandForm demandToEdit={demand} />
                        )}

                        {/* 3. Deal Desk Link */}
                        {demand.chatRoom?.id ? (
                          <Link href={`/chat/${demand.chatRoom.id}`} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">
                            <Eye size={14} /> Deal Desk
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Processing...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}