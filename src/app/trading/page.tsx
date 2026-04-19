import { prisma } from "@/lib/prisma";
import { openChatRoom } from "@/actions/chatActions";
import { ArrowRightLeft, MessageSquare, ClipboardList, Package, Scale, CircleDollarSign, Calendar, MapPin, Clock, Truck } from "lucide-react";

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
                    <div className="flex flex-col mb-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight flex-1">{demand.title}</h3>
                        {demand.incoterms && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase border border-slate-200 shrink-0">
                            {demand.incoterms}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock size={12} className="text-blue-500" />
                          Req by {demand.createdBy.firstName} {demand.createdBy.lastName}
                        </p>
                        
                        {(demand.origin || demand.destination) && (
                          <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Truck size={10} className="text-blue-400" />
                            {demand.origin || "TBD"} <span className="text-slate-300">➔</span> {demand.destination || "TBD"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Scale size={12} className="text-blue-600"/> Qty</p>
                        <p className="text-sm font-black text-slate-900 leading-none">
                          {new Intl.NumberFormat().format(demand.quantity)} 
                          <span className="text-[10px] font-bold text-slate-500 ml-1">{demand.quantityUnit || "MT"}</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CircleDollarSign size={12} className="text-blue-600"/> Target</p>
                        {demand.targetPrice ? (
                          <p className="text-sm font-black text-emerald-600 leading-none">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(demand.targetPrice)}</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-400 italic leading-none">TBD</p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={12} className="text-blue-600"/> Timeline</p>
                        <p className="text-xs font-bold text-slate-900 truncate leading-none" title={demand.timeline}>{demand.timeline}</p>
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
                    <div className="flex flex-col mb-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight flex-1">{supply.title}</h3>
                        {supply.incoterms && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase border border-slate-200 shrink-0">
                            {supply.incoterms}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock size={12} className="text-emerald-500" />
                          Posted by {supply.createdBy.firstName} {supply.createdBy.lastName}
                        </p>
                        
                        {(supply.origin || supply.destination) && (
                          <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Truck size={10} className="text-emerald-400" />
                            {supply.origin || "TBD"} <span className="text-slate-300">➔</span> {supply.destination || "TBD"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Scale size={12} className="text-emerald-600"/> Avail Qty</p>
                        <p className="text-sm font-black text-slate-900 leading-none">
                          {new Intl.NumberFormat().format(supply.quantity)} 
                          <span className="text-[10px] font-bold text-slate-500 ml-1">{supply.quantityUnit || "MT"}</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CircleDollarSign size={12} className="text-emerald-600"/> Price</p>
                        {supply.price ? (
                          <p className="text-sm font-black text-emerald-600 leading-none">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(supply.price)}</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-400 italic leading-none">TBD</p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={12} className="text-emerald-600"/> Location</p>
                        <p className="text-xs font-bold text-slate-900 truncate leading-none" title={supply.location}>{supply.location}</p>
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