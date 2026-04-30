"use client";

import { useState, useEffect } from "react";
import { runMatchingEngine, TradeMatch } from "@/actions/matchingActions";
import { Radar, ArrowRight, Activity, Loader2, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
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
        // Artificial delay so the user feels the "scanning" effect
        setTimeout(() => setIsScanning(false), 1200);
      }
    };
    fetchMatches();
  }, []);

  if (isScanning) {
    return (
      <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
        <Radar size={48} className="text-indigo-500 animate-spin-slow mb-4" />
        <h3 className="text-xl font-black text-white tracking-wide">Algorithmic Scan in Progress</h3>
        <p className="text-sm text-slate-400 mt-2">Cross-referencing active demands against available supply...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
          <CheckCircle2 size={32} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-black text-slate-900">No Immediate Matches Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">The system did not detect any high-confidence overlaps between current demands and supplies. Check back later.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 opacity-[0.02] translate-x-4 -translate-y-4 pointer-events-none">
        <Activity size={300} />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Radar size={20} className="text-indigo-400" /> 
            Smart Match Opportunities
          </h2>
          <p className="text-sm text-slate-400 mt-1">Found {matches.length} high-confidence pipeline alignments.</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {matches.map((match, idx) => (
          <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors group">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Demand Side */}
              <div className="flex-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mb-2 inline-block">Demand</span>
                <Link href={`/chat/${match.demandId}`} className="block">
                  <h4 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{match.demandTitle}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{new Intl.NumberFormat().format(match.demandQuantity)} MT • {match.demandPrice ? `$${match.demandPrice}` : "TBD"}</p>
                </Link>
              </div>

              {/* Match Visualizer */}
              <div className="flex flex-col items-center justify-center px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-8 bg-slate-700"></div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 shadow-lg ${
                    match.confidenceScore >= 85 ? "border-emerald-500 text-emerald-400 shadow-emerald-500/20" : 
                    match.confidenceScore >= 70 ? "border-indigo-500 text-indigo-400 shadow-indigo-500/20" : 
                    "border-amber-500 text-amber-400 shadow-amber-500/20"
                  }`}>
                    <span className="text-sm font-black">{match.confidenceScore}%</span>
                  </div>
                  <div className="h-[1px] w-8 bg-slate-700"></div>
                </div>
              </div>

              {/* Supply Side */}
              <div className="flex-1 text-left md:text-right">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mb-2 inline-block">Supply</span>
                <Link href={`/chat/${match.supplyId}`} className="block">
                  <h4 className="text-white font-bold truncate group-hover:text-emerald-400 transition-colors">{match.supplyTitle}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{match.supplyPrice ? `$${match.supplyPrice}` : "TBD"} • {new Intl.NumberFormat().format(match.supplyQuantity)} MT</p>
                </Link>
              </div>

            </div>

            {/* AI Reasoning Tags */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-2">
              {match.matchReasons.map((reason, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">
                  <TrendingUp size={10} className={i === 0 ? "text-indigo-400" : "text-slate-500"} />
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