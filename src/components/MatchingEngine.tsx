"use client";

import { useState, useEffect } from "react";
import { runMatchingEngine, TradeMatch } from "@/actions/matchingActions";
import { Radar, ArrowRight, Activity, Loader2, CheckCircle2, TrendingUp, AlertCircle, Zap } from "lucide-react";
import Link from "next/link";

export default function MatchingEngine() {
  const [matches, setMatches] = useState<TradeMatch[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await runMatchingEngine();
        setMatches(data);
      } catch (error) {
        console.error("Failed to run matching engine", error);
      } finally {
        // Artificial delay so the user feels the "scanning" algorithmic effect
        setTimeout(() => setIsScanning(false), 1500);
      }
    };
    fetchMatches();
  }, []);

  if (isScanning) {
    return (
      <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
        {/* Radar Ping Animation Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-64 h-64 border border-blue-500 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
          <div className="absolute w-48 h-48 border border-blue-400 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
        </div>
        
        <Radar size={56} className="text-blue-500 animate-spin mb-5 relative z-10" style={{ animationDuration: '4s' }} />
        <h3 className="text-2xl font-black text-white tracking-tight relative z-10">Algorithmic Scan in Progress</h3>
        <p className="text-sm font-medium text-slate-400 mt-2 relative z-10">Cross-referencing active demands against available supply...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px] text-center transition-all">
        <div className="p-5 bg-slate-50 rounded-full mb-5 border border-slate-100 shadow-inner">
          <CheckCircle2 size={36} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">No Immediate Matches Found</h3>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md leading-relaxed">
          The system did not detect any high-confidence overlaps between current demands and supplies. The engine will continue to monitor the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute right-0 top-0 opacity-[0.03] translate-x-10 -translate-y-10 pointer-events-none">
        <Activity size={350} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Radar size={24} className="text-blue-400" /> 
            Smart Match Opportunities
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Engine discovered <span className="text-white font-bold">{matches.length}</span> high-confidence pipeline alignments.
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {matches.map((match, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 group">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* Demand Side */}
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 mb-2.5 inline-block">
                  Buyer Demand
                </span>
                <Link href={`/trading/demands`} className="block">
                  <h4 className="text-lg text-white font-bold tracking-tight truncate group-hover:text-blue-400 transition-colors">{match.demandTitle}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {new Intl.NumberFormat().format(match.demandQuantity)} MT • <span className="text-slate-300">{match.demandPrice ? `$${match.demandPrice}` : "Target TBD"}</span>
                  </p>
                </Link>
              </div>

              {/* Match Visualizer Score */}
              <div className="flex flex-col items-center justify-center px-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-slate-600"></div>
                  <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-[3px] shadow-lg bg-slate-900 transition-transform group-hover:scale-110 duration-300 ${
                    match.confidenceScore >= 85 ? "border-green-500 text-green-400 shadow-green-500/20" : 
                    match.confidenceScore >= 70 ? "border-blue-500 text-blue-400 shadow-blue-500/20" : 
                    "border-amber-500 text-amber-400 shadow-amber-500/20"
                  }`}>
                    <span className="text-sm font-black tracking-tighter">{match.confidenceScore}%</span>
                    <Zap size={10} className={match.confidenceScore >= 85 ? "fill-green-400" : "fill-blue-400"} />
                  </div>
                  <div className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-slate-600"></div>
                </div>
              </div>

              {/* Supply Side */}
              <div className="flex-1 text-left md:text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-2.5 inline-block">
                  Available Supply
                </span>
                <Link href={`/trading/supplies`} className="block">
                  <h4 className="text-lg text-white font-bold tracking-tight truncate group-hover:text-emerald-400 transition-colors">{match.supplyTitle}</h4>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    <span className="text-slate-300">{match.supplyPrice ? `$${match.supplyPrice}` : "Price TBD"}</span> • {new Intl.NumberFormat().format(match.supplyQuantity)} MT
                  </p>
                </Link>
              </div>

            </div>

            {/* AI Reasoning Tags */}
            <div className="mt-5 pt-4 border-t border-slate-700/50 flex flex-wrap gap-2">
              {match.matchReasons.map((reason, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-sm">
                  <TrendingUp size={12} className={i === 0 ? "text-blue-400" : "text-slate-500"} />
                  {reason}
                </span>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}