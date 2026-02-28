import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import SupplyForm from "@/components/SupplyForm";
import SupplyCard from "@/components/SupplyCard";
import { getServerSession } from "next-auth";

export default async function SuppliesPage() {
  // 1. Get the basic session (which only contains the email securely)
  const session = await getServerSession();
  
  // 2. Fetch the true role directly from the database to ensure strict SOP compliance
  let userRole = "GUEST";
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });
    if (dbUser) userRole = dbUser.role;
  }
  
  // 3. Allow creation if they are ADMIN or a form of SUPPLIER
  const canCreate = userRole === "ADMIN" || userRole === "SUPPLIER_REP" || userRole === "SUPPLIER";

  const supplies = await prisma.supply.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true } 
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      
      {/* Page Header with Secure Modal Trigger */}
      <div className="mb-8 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Supply Inventory</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Internal database of available commodities. Select a listing to view origin details, specifications, and official compliance documents.
          </p>
        </div>
        
        {/* Only rendered if the user has the correct SOP clearance */}
        {canCreate && <SupplyForm />}
      </div>

      {/* Full-Width Feed */}
      <div className="max-w-5xl mx-auto space-y-4">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg border border-emerald-200 shadow-sm">
              <Package size={20} className="text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Available Commodities</h2>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
            {supplies.length} Active Listings
          </div>
        </div>

        {supplies.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center">
            <Package size={48} className="text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-700">No Inventory Found</p>
            {canCreate && <p className="text-sm mt-1 max-w-xs">Click the 'Post Supply' button above to populate the board.</p>}
          </div>
        ) : (
          supplies.map((supply) => (
            <SupplyCard key={supply.id} supply={supply} />
          ))
        )}
      </div>
    </div>
  );
}