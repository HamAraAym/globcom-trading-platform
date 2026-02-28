import { prisma } from "@/lib/prisma";
import { FileBox } from "lucide-react";
import DemandForm from "@/components/DemandForm";
import DemandCard from "@/components/DemandCard";
import { getServerSession } from "next-auth";

export default async function DemandsPage() {
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
  
  // 3. Allow creation only if they are ADMIN or a form of BUYER
  const canCreate = userRole === "ADMIN" || userRole === "BUYER_REP" || userRole === "BUYER";

  const demands = await prisma.demand.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      
      {/* Page Header with Secure Modal Trigger */}
      <div className="mb-8 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Demand Board</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Internal database of active client requests. Select a demand to view target pricing, specifications, and official RFQ documents.
          </p>
        </div>
        
        {/* Only rendered if the user has the correct SOP clearance */}
        {canCreate && <DemandForm />}
      </div>

      {/* Full-Width Feed */}
      <div className="max-w-5xl mx-auto space-y-4">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg border border-blue-200 shadow-sm">
              <FileBox size={20} className="text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Active Client Requests</h2>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
            {demands.length} Open Demands
          </div>
        </div>

        {demands.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center">
            <FileBox size={48} className="text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-700">No Demands Found</p>
            {canCreate && <p className="text-sm mt-1 max-w-xs">Click the 'Post Demand' button above to populate the board.</p>}
          </div>
        ) : (
          demands.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))
        )}
      </div>
    </div>
  );
}