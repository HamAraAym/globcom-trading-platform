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
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon} <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900">{value || <span className="text-slate-300 font-normal italic">Not specified</span>}</p>
    </div>
  );

  return (
    <>
      {/* 1. THE SUMMARY CARD (Compact & Scannable) */}
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row"
      >
        <div className="bg-slate-900 px-6 py-4 flex flex-col justify-center items-start sm:w-48 shrink-0">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md uppercase tracking-widest border border-blue-500/30 shadow-sm mb-3">
            {demand.status}
          </span>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Clock size={14} className="text-blue-500" />
            {new Date(demand.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center gap-4 mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{demand.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Posted by <span className="font-semibold text-slate-700">{demand.createdBy?.firstName} {demand.createdBy?.lastName}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-slate-900">
                {new Intl.NumberFormat().format(demand.quantity)} <span className="text-xs font-bold text-slate-500 ml-1">{demand.quantityUnit || "MT"}</span>
              </p>
              {demand.targetPrice ? (
                <p className="text-sm font-bold text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(demand.targetPrice)}</p>
              ) : (
                <p className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">Price TBD</p>
              )}
            </div>
          </div>

          {/* NEW: Quick Logistics Strip on the Card Face */}
          {(demand.origin || demand.destination || demand.incoterms) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-slate-100">
              {(demand.origin || demand.destination) && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{demand.origin || "TBD"}</span>
                  <span className="text-slate-300">➔</span>
                  <span>{demand.destination || "TBD"}</span>
                </div>
              )}
              {demand.incoterms && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase border border-slate-200">
                  {demand.incoterms}
                </span>
              )}
              {demand.loadPort && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase border border-slate-200 flex items-center gap-1">
                  <Anchor size={10} /> {demand.loadPort}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-4 flex items-center justify-center border-l border-slate-100 group-hover:bg-blue-50 transition-colors">
          <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>

      {/* 2. THE FULL DETAIL MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg"><FileBox size={20} /></div>
                <h2 className="text-xl font-bold tracking-wide">Demand Details</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-slate-50">
              
              {/* Header Info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{demand.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Authorized Representative: <span className="font-bold text-slate-800">{demand.createdBy?.firstName} {demand.createdBy?.lastName}</span> ({demand.createdBy?.role?.replace("_", " ")})
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-widest border border-blue-200">
                  {demand.status}
                </span>
              </div>
              
              {/* Core Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><Scale size={16} className="text-blue-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Required Qty</span></div>
                  <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat().format(demand.quantity)} <span className="text-sm font-bold text-slate-500 ml-1">{demand.quantityUnit || "MT"}</span></p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><CircleDollarSign size={16} className="text-emerald-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Target Price</span></div>
                  {demand.targetPrice ? (
                    <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(demand.targetPrice)}</p>
                  ) : (
                     <p className="text-sm font-bold text-slate-400 italic">Price Upon Request</p>
                  )}
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><Calendar size={16} className="text-blue-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Timeline</span></div>
                  <p className="text-sm font-bold text-slate-900">{demand.timeline}</p>
                </div>
              </div>

              {/* Trade Logistics Grid */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Truck size={16} className="text-blue-500" /> Trade Logistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                  <LogisticsItem label="Origin" value={demand.origin} icon={<MapPin size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Destination" value={demand.destination} icon={<MapPin size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Load Port" value={demand.loadPort} icon={<Anchor size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Incoterms" value={demand.incoterms} icon={<Truck size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Insurance" value={demand.insurance} icon={<Shield size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Payment Terms" value={demand.paymentTerms} icon={<CreditCard size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Inspection" value={demand.inspection} icon={<ShieldCheck size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Packaging" value={demand.packaging} icon={<Package size={14} className="text-slate-400" />} />
                </div>
              </div>

              {/* Technical Specifications (Dynamic JSON) */}
              {demand.keyTerms && Array.isArray(demand.keyTerms) && demand.keyTerms.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <List size={16} className="text-blue-500" /> Technical Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demand.keyTerms.map((term: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs font-bold text-slate-500 uppercase">{term.label}</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{term.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> General Notes
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{demand.specs}</p>
              </div>

              {/* Attachments */}
              {demand.attachments && demand.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
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