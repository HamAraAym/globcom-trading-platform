import { prisma } from "@/lib/prisma";
import { openChatRoom } from "@/actions/chatActions";
import { ArrowRightLeft, MessageSquare, ClipboardList, Package, Scale, CircleDollarSign, Calendar, MapPin, Clock } from "lucide-react";

export default async function TradingHubPage() {
  // Fetch Demands and Supplies in parallel for speed
  const [demands, supplies] = await Promise.all([
    prisma.demand.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true },
    }),
    prisma.supply.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      
      {/* Page Header */}
      <div className="mb-8 max-w-[1400px] mx-auto flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
          <ArrowRightLeft size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trading Hub Engine</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Live Matchmaking Dashboard. Compare open client Demands against available internal Supplies and initiate secure negotiation rooms.
          </p>
        </div>
      </div>

      {/* Dual-Pane Trading Terminal */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* LEFT PANE: DEMANDS (BLUE THEME)                           */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          
          {/* Panel Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30 text-blue-400">
                <ClipboardList size={20} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Open Demands</h2>
            </div>
            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {demands.length} Active
            </div>
          </div>

          {/* Panel Feed */}
          <div className="p-6 space-y-5 bg-slate-50/50 flex-1">
            {demands.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">No active demands to match.</p>
              </div>
            ) : (
              demands.map((demand) => {
                const startChat = openChatRoom.bind(null, "demand", demand.id);
                return (
                  <div key={demand.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{demand.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Clock size={12} className="text-blue-500" />
                          Req by {demand.createdBy.firstName} {demand.createdBy.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Scale size={12} className="text-blue-600"/> Qty</p>
                        <p className="text-sm font-bold text-slate-900">{new Intl.NumberFormat().format(demand.quantity)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CircleDollarSign size={12} className="text-blue-600"/> Target</p>
                        <p className="text-sm font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(demand.targetPrice)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={12} className="text-blue-600"/> Timeline</p>
                        <p className="text-sm font-bold text-slate-900 truncate" title={demand.timeline}>{demand.timeline}</p>
                      </div>
                    </div>

                    <form action={startChat}>
                      <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white py-2.5 rounded-xl text-sm font-bold transition-colors border border-blue-100 hover:border-blue-600 shadow-sm">
                        <MessageSquare size={16} /> Open Negotiation Room
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: SUPPLIES (EMERALD THEME)                      */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          
          {/* Panel Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
                <Package size={20} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Available Supply</h2>
            </div>
            <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {supplies.length} Active
            </div>
          </div>

          {/* Panel Feed */}
          <div className="p-6 space-y-5 bg-slate-50/50 flex-1">
            {supplies.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">No available supply to match.</p>
              </div>
            ) : (
              supplies.map((supply) => {
                const startChat = openChatRoom.bind(null, "supply", supply.id);
                return (
                  <div key={supply.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{supply.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Clock size={12} className="text-emerald-500" />
                          Posted by {supply.createdBy.firstName} {supply.createdBy.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Scale size={12} className="text-emerald-600"/> Avail Qty</p>
                        <p className="text-sm font-bold text-slate-900">{new Intl.NumberFormat().format(supply.quantity)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CircleDollarSign size={12} className="text-emerald-600"/> Price</p>
                        <p className="text-sm font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(supply.price)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={12} className="text-emerald-600"/> Location</p>
                        <p className="text-sm font-bold text-slate-900 truncate" title={supply.location}>{supply.location}</p>
                      </div>
                    </div>

                    <form action={startChat}>
                      <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white py-2.5 rounded-xl text-sm font-bold transition-colors border border-emerald-100 hover:border-emerald-600 shadow-sm">
                        <MessageSquare size={16} /> Open Negotiation Room
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}