import { prisma } from "@/lib/prisma";
import { openChatRoom } from "@/actions/chatActions";
import { 
  ArrowRightLeft, MessageSquare, ClipboardList, Package, Scale, 
  CircleDollarSign, Calendar, MapPin, Clock, Truck, Sparkles, Zap, ArrowRight 
} from "lucide-react";

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

  // =========================================================
  // 🧠 SERVER-SIDE AI MATCHING ENGINE (Mock Algorithm)
  // =========================================================
  const getAiMatches = () => {
    const matches = [];
    for (const demand of demands) {
      for (const supply of supplies) {
        // 1. Basic Keyword Overlap in Title
        const demandWords = demand.title.toLowerCase().split(" ");
        const supplyWords = supply.title.toLowerCase().split(" ");
        const hasOverlap = demandWords.some(w => w.length > 3 && supplyWords.includes(w));

        if (hasOverlap) {
          // 2. Volume Proximity Score
          const qtyDiff = Math.abs(demand.quantity - supply.quantity);
          const qtyScore = Math.max(0, 100 - (qtyDiff / demand.quantity) * 100);
          
          // 3. Final AI Confidence Score (80% - 99%)
          const finalScore = Math.floor(80 + (qtyScore * 0.19)); 

          matches.push({ demand, supply, score: finalScore });
          break; // Grab the best match per demand to keep UI clean
        }
      }
    }
    // Return Top 3 Highest Scoring Matches
    return matches.sort((a, b) => b.score - a.score).slice(0, 3); 
  };

  const aiMatches = getAiMatches();

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 font-sans min-h-full">
      
      {/* Page Header */}
      <div className="mb-6 md:mb-8 max-w-[1400px] w-full mx-auto flex items-center gap-3 md:gap-4 shrink-0">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
          <ArrowRightLeft size={24} className="md:w-7 md:h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Trading Hub Engine</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Live Matchmaking Dashboard. Compare open client Demands against available internal Supplies and initiate secure negotiation rooms.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ⚡ AI MATCH RECOMMENDATIONS ROW                           */}
      {/* ========================================================= */}
      {aiMatches.length > 0 && (
        <div className="max-w-[1400px] w-full mx-auto mb-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" /> AI Recommended Matches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aiMatches.map((match, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                {/* Glowing Match Badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <Zap size={10} className="fill-white" /> {match.score}% MATCH
                </div>
                
                <div className="flex justify-between items-center mt-2 mb-3">
                  {/* Left: Demand (Navy) */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">BUYER SEEKING</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{match.demand.title}</p>
                    <p className="text-xs text-slate-500">{new Intl.NumberFormat().format(match.demand.quantity)} {match.demand.quantityUnit || "MT"}</p>
                  </div>
                  
                  {/* Middle Arrow */}
                  <div className="w-8 shrink-0 flex justify-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <ArrowRight size={18} />
                  </div>

                  {/* Right: Supply (Green) */}
                  <div className="flex-1 min-w-0 pl-2 text-right">
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-0.5">SELLER SUPPLY</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{match.supply.title}</p>
                    <p className="text-xs text-slate-500">{new Intl.NumberFormat().format(match.supply.quantity)} {match.supply.quantityUnit || "MT"}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 my-3"></div>

                <form action={openChatRoom.bind(null, "demand", match.demand.id)}>
                  <button type="submit" className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-2">
                    <MessageSquare size={14} /> Review Match Strategy
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual-Pane Trading Terminal */}
      <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 items-start flex-1">
        
        {/* ========================================================= */}
        {/* LEFT PANE: DEMANDS (GLOBCOM NAVY)                         */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[calc(100vh-250px)]">
          
          <div className="bg-slate-900 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-blue-800 p-1.5 md:p-2 rounded-lg text-white">
                <ClipboardList size={18} className="md:w-5 md:h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">Open Demands</h2>
            </div>
            <div className="bg-blue-800 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 rounded-full shadow-sm">
              {demands.length} Active
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-5 bg-slate-50/50 flex-1 overflow-y-auto custom-scrollbar">
            {demands.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">No active demands to match.</p>
              </div>
            ) : (
              demands.map((demand) => {
                const startChat = openChatRoom.bind(null, "demand", demand.id);
                return (
                  <div key={demand.id} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-blue-800 transition-all group">
                    <div className="flex flex-col mb-3 md:mb-4">
                      <div className="flex justify-between items-start gap-3 md:gap-4">
                        <h3 className="font-bold text-slate-900 text-base md:text-lg leading-tight flex-1">{demand.title}</h3>
                        {demand.incoterms && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded uppercase border border-slate-200 shrink-0">
                            {demand.incoterms}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock size={12} className="text-blue-800 shrink-0" />
                          Req by {demand.createdBy.firstName} {demand.createdBy.lastName}
                        </p>
                        
                        {(demand.origin || demand.destination) && (
                          <p className="text-[10px] md:text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate max-w-full">
                            <Truck size={10} className="text-blue-600 shrink-0" />
                            <span className="truncate">{demand.origin || "TBD"}</span> <span className="text-slate-300">➔</span> <span className="truncate">{demand.destination || "TBD"}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5">
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><Scale size={10} className="md:w-3 md:h-3 text-blue-800 shrink-0"/> Qty</p>
                        <p className="text-xs md:text-sm font-black text-slate-900 leading-none truncate">
                          {new Intl.NumberFormat().format(demand.quantity)} 
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 ml-0.5 md:ml-1">{demand.quantityUnit || "MT"}</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><CircleDollarSign size={10} className="md:w-3 md:h-3 text-green-600 shrink-0"/> Target</p>
                        {demand.targetPrice ? (
                          <p className="text-xs md:text-sm font-black text-green-600 leading-none truncate">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(demand.targetPrice)}</p>
                        ) : (
                          <p className="text-[10px] md:text-xs font-bold text-slate-400 italic leading-none">TBD</p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><Calendar size={10} className="md:w-3 md:h-3 text-blue-800 shrink-0"/> Timeline</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-900 truncate leading-none" title={demand.timeline}>{demand.timeline}</p>
                      </div>
                    </div>

                    <form action={startChat}>
                      <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-800 text-blue-800 hover:text-white py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors border border-blue-100 hover:border-blue-800 shadow-sm">
                        <MessageSquare size={16} className="shrink-0" /> <span className="truncate">Open Negotiation Room</span>
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: SUPPLIES (GLOBCOM GREEN)                      */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[calc(100vh-250px)]">
          
          <div className="bg-slate-900 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-green-600 p-1.5 md:p-2 rounded-lg text-white">
                <Package size={18} className="md:w-5 md:h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">Available Supply</h2>
            </div>
            <div className="bg-green-600 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 rounded-full shadow-sm">
              {supplies.length} Active
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-5 bg-slate-50/50 flex-1 overflow-y-auto custom-scrollbar">
            {supplies.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">No available supply to match.</p>
              </div>
            ) : (
              supplies.map((supply) => {
                const startChat = openChatRoom.bind(null, "supply", supply.id);
                return (
                  <div key={supply.id} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-green-600 transition-all group">
                    <div className="flex flex-col mb-3 md:mb-4">
                      <div className="flex justify-between items-start gap-3 md:gap-4">
                        <h3 className="font-bold text-slate-900 text-base md:text-lg leading-tight flex-1">{supply.title}</h3>
                        {supply.incoterms && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded uppercase border border-slate-200 shrink-0">
                            {supply.incoterms}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <p className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock size={12} className="text-green-600 shrink-0" />
                          Posted by {supply.createdBy.firstName} {supply.createdBy.lastName}
                        </p>
                        
                        {(supply.origin || supply.destination) && (
                          <p className="text-[10px] md:text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate max-w-full">
                            <Truck size={10} className="text-green-500 shrink-0" />
                            <span className="truncate">{supply.origin || "TBD"}</span> <span className="text-slate-300">➔</span> <span className="truncate">{supply.destination || "TBD"}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5">
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><Scale size={10} className="md:w-3 md:h-3 text-green-600 shrink-0"/> Avail Qty</p>
                        <p className="text-xs md:text-sm font-black text-slate-900 leading-none truncate">
                          {new Intl.NumberFormat().format(supply.quantity)} 
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 ml-0.5 md:ml-1">{supply.quantityUnit || "MT"}</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><CircleDollarSign size={10} className="md:w-3 md:h-3 text-green-600 shrink-0"/> Price</p>
                        {supply.price ? (
                          <p className="text-xs md:text-sm font-black text-green-600 leading-none truncate">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(supply.price)}</p>
                        ) : (
                          <p className="text-[10px] md:text-xs font-bold text-slate-400 italic leading-none">TBD</p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-lg md:rounded-xl p-2 md:p-3 border border-slate-100 flex flex-col justify-between">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 md:gap-1.5"><MapPin size={10} className="md:w-3 md:h-3 text-green-600 shrink-0"/> Location</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-900 truncate leading-none" title={supply.location}>{supply.location}</p>
                      </div>
                    </div>

                    <form action={startChat}>
                      <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors border border-green-100 hover:border-green-600 shadow-sm">
                        <MessageSquare size={16} className="shrink-0" /> <span className="truncate">Open Negotiation Room</span>
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