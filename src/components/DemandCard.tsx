"use client";

import { useState } from "react";
import { 
  CircleDollarSign, Scale, Clock, Calendar, ChevronRight, X, FileBox, FileText, 
  MapPin, Truck, CreditCard, ShieldCheck, Package, List, Anchor, Shield 
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";

export default function DemandCard({ demand }: { demand: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper component for the logistics grid
  const LogisticsItem = ({ label, value, icon }: { label: string, value: string | null, icon: React.ReactNode }) => (
    <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-100">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon} <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight">
        {value || <span className="text-slate-300 font-normal italic">Not specified</span>}
      </p>
    </div>
  );

  return (
    <>
      {/* 1. THE SUMMARY CARD (Compact & Scannable) */}
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row"
      >
        <div className="bg-slate-900 px-4 md:px-6 py-3 md:py-4 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start sm:w-48 shrink-0">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[9px] md:text-[10px] font-bold rounded-md uppercase tracking-widest border border-blue-500/30 shadow-sm sm:mb-3">
            {demand.status.replace("_", " ")}
          </span>
          <div className="flex items-center gap-1.5 md:gap-2 text-slate-400 text-[10px] md:text-xs font-medium">
            <Clock size={12} className="text-blue-500 md:w-3.5 md:h-3.5" />
            {new Date(demand.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 md:gap-4 mb-2 md:mb-3">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{demand.title}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
                Posted by <span className="font-semibold text-slate-700">{demand.createdBy?.firstName} {demand.createdBy?.lastName}</span>
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
              <p className="text-base md:text-lg font-black text-slate-900 leading-tight">
                {new Intl.NumberFormat().format(demand.quantity)} <span className="text-[10px] md:text-xs font-bold text-slate-500 ml-0.5">{demand.quantityUnit || "MT"}</span>
              </p>
              {demand.targetPrice ? (
                <p className="text-xs md:text-sm font-bold text-emerald-600 mt-0.5">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(demand.targetPrice)}</p>
              ) : (
                <p className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 md:py-1 rounded mt-1 inline-block">Price TBD</p>
              )}
            </div>
          </div>

          {/* Quick Logistics Strip on the Card Face */}
          {(demand.origin || demand.destination || demand.incoterms) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 pt-2 md:pt-3 border-t border-slate-100">
              {(demand.origin || demand.destination) && (
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium text-slate-600">
                  <MapPin size={10} className="text-slate-400 md:w-3 md:h-3" />
                  <span>{demand.origin || "TBD"}</span>
                  <span className="text-slate-300">➔</span>
                  <span>{demand.destination || "TBD"}</span>
                </div>
              )}
              {demand.incoterms && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded uppercase border border-slate-200">
                  {demand.incoterms}
                </span>
              )}
              {demand.loadPort && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-bold rounded uppercase border border-slate-200 flex items-center gap-1">
                  <Anchor size={10} /> {demand.loadPort}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="hidden sm:flex bg-slate-50 px-4 items-center justify-center border-l border-slate-100 group-hover:bg-blue-50 transition-colors">
          <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>

      {/* 2. THE FULL DETAIL MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-blue-500 p-1.5 md:p-2 rounded-lg"><FileBox size={18} className="md:w-5 md:h-5" /></div>
                <h2 className="text-lg md:text-xl font-bold tracking-wide">Demand Details</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 md:p-2 bg-slate-800 rounded-full">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 bg-slate-50">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">{demand.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500 mt-1 md:mt-2">
                    Authorized Rep: <span className="font-bold text-slate-800">{demand.createdBy?.firstName} {demand.createdBy?.lastName}</span> <span className="hidden sm:inline">({demand.createdBy?.role?.replace("_", " ")})</span>
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-[10px] md:text-xs font-bold rounded-lg uppercase tracking-widest border border-blue-200 shrink-0">
                  {demand.status.replace("_", " ")}
                </span>
              </div>
              
              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-slate-500"><Scale size={14} className="md:w-4 md:h-4 text-blue-600"/> <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Required Qty</span></div>
                  <p className="text-lg md:text-xl font-black text-slate-900 truncate">{new Intl.NumberFormat().format(demand.quantity)} <span className="text-xs md:text-sm font-bold text-slate-500 ml-0.5">{demand.quantityUnit || "MT"}</span></p>
                </div>
                <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-slate-500"><CircleDollarSign size={14} className="md:w-4 md:h-4 text-emerald-600"/> <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Target Price</span></div>
                  {demand.targetPrice ? (
                    <p className="text-lg md:text-xl font-black text-slate-900 truncate">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(demand.targetPrice)}</p>
                  ) : (
                     <p className="text-xs md:text-sm font-bold text-slate-400 italic">Price Upon Request</p>
                  )}
                </div>
                <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-xl flex flex-col shadow-sm col-span-2 md:col-span-1">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-slate-500"><Calendar size={14} className="md:w-4 md:h-4 text-blue-600"/> <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Timeline</span></div>
                  <p className="text-xs md:text-sm font-bold text-slate-900 truncate">{demand.timeline}</p>
                </div>
              </div>

              {/* Trade Logistics Grid */}
              <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 mb-6 md:mb-8 shadow-sm">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Truck size={14} className="md:w-4 md:h-4 text-blue-500" /> Trade Logistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-3 md:gap-4">
                  <LogisticsItem label="Origin" value={demand.origin} icon={<MapPin size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Destination" value={demand.destination} icon={<MapPin size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Load Port" value={demand.loadPort} icon={<Anchor size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Incoterms" value={demand.incoterms} icon={<Truck size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Insurance" value={demand.insurance} icon={<Shield size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Payment Terms" value={demand.paymentTerms} icon={<CreditCard size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Inspection" value={demand.inspection} icon={<ShieldCheck size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                  <LogisticsItem label="Packaging" value={demand.packaging} icon={<Package size={12} className="md:w-3.5 md:h-3.5 text-slate-400" />} />
                </div>
              </div>

              {/* Technical Specifications (Dynamic JSON) */}
              {demand.keyTerms && Array.isArray(demand.keyTerms) && demand.keyTerms.length > 0 && (
                <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 mb-6 md:mb-8 shadow-sm">
                  <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2">
                    <List size={14} className="md:w-4 md:h-4 text-blue-500" /> Technical Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    {demand.keyTerms.map((term: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 md:p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">{term.label}</span>
                        <span className="text-xs md:text-sm font-bold text-slate-900 text-right">{term.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 mb-6 md:mb-8 shadow-sm">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2">
                  <FileText size={14} className="md:w-4 md:h-4 text-blue-500" /> General Notes
                </h4>
                <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{demand.specs}</p>
              </div>

              {/* Attachments */}
              {demand.attachments && demand.attachments.length > 0 && (
                <div>
                  <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2">
                    Official Documents ({demand.attachments.length})
                  </h4>
                  <MediaGallery attachments={demand.attachments} />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}