import { prisma } from "@/lib/prisma";
import { Package, ArrowRight, Eye, Edit } from "lucide-react";
import SupplyForm from "@/components/SupplyForm";
import ExportButton from "@/components/ExportButton"; // NEW: Export Engine
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function SuppliesPage() {
  const session = await getServerSession();
  
  let userRole = "GUEST";
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });
    if (dbUser) userRole = dbUser.role;
  }
  
  const canCreate = userRole === "ADMIN" || userRole === "SUPPLIER_REP" || userRole === "SUPPLIER";
  const canEdit = userRole === "ADMIN" || userRole === "TRADING_REP"; // Admins & Traders can edit

  // Fetch Supplies + Ensure we grab the associated ChatRoom ID for routing
  const supplies = await prisma.supply.findMany({
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Supply Inventory</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Internal database of available commodities. Manage inventory, export data, and negotiate active deals.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButton data={supplies} type="Supplies" />
          {canCreate && <SupplyForm />}
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg border border-emerald-200 shadow-sm">
              <Package size={20} className="text-emerald-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Available Commodities</h2>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {supplies.length} Records Found
          </div>
        </div>

        {supplies.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
            <Package size={48} className="text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-700">No Inventory Found</p>
            {canCreate && <p className="text-sm mt-1 max-w-xs">Click the 'Post Supply' button above to populate the board.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
                  <th className="p-4 font-bold">Date Posted</th>
                  <th className="p-4 font-bold">Commodity</th>
                  <th className="p-4 font-bold">Volume</th>
                  <th className="p-4 font-bold">Listing Price</th>
                  <th className="p-4 font-bold">Logistics Route</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {supplies.map((supply) => (
                  <tr key={supply.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(supply.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {supply.title}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {new Intl.NumberFormat().format(supply.quantity)} {supply.quantityUnit}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {supply.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(supply.price) : <span className="text-slate-400 italic font-medium">TBD</span>}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-2">
                      {supply.origin || supply.location} <ArrowRight size={12} className="text-emerald-400" /> {supply.destination || "TBA"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        supply.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                        supply.status === "UNDER_NEGOTIATION" ? "bg-amber-100 text-amber-700" :
                        supply.status === "CLOSED_WON" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {supply.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {canEdit && (
  <SupplyForm supplyToEdit={supply} />
)}
                        {supply.chatRoom?.id ? (
                          <Link href={`/chat/${supply.chatRoom.id}`} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">
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