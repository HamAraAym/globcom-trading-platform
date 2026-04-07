"use client";

import { useState } from "react";
import { 
  CircleDollarSign, Scale, Clock, MapPin, ChevronRight, X, Package, FileText,
  Truck, CreditCard, ShieldCheck, List, CalendarClock
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";

export default function SupplyCard({ supply }: { supply: any }) {
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
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row"
      >
        <div className="bg-slate-900 px-6 py-4 flex flex-col justify-center items-start sm:w-48 shrink-0">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-widest border border-emerald-500/30 shadow-sm mb-3">
            {supply.status}
          </span>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Clock size={14} className="text-emerald-500" />
            {new Date(supply.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{supply.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Posted by <span className="font-semibold text-slate-700">{supply.createdBy.firstName} {supply.createdBy.lastName}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-slate-900">{new Intl.NumberFormat().format(supply.quantity)} <span className="text-xs font-normal text-slate-500">Units</span></p>
              <p className="text-sm font-bold text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(supply.price)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 flex items-center justify-center border-l border-slate-100 group-hover:bg-emerald-50 transition-colors">
          <ChevronRight size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
      </div>

      {/* 2. THE FULL DETAIL MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg"><Package size={20} /></div>
                <h2 className="text-xl font-bold tracking-wide">Commodity Details</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-slate-50">
              
              {/* Header Info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{supply.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Authorized Representative: <span className="font-bold text-slate-800">{supply.createdBy.firstName} {supply.createdBy.lastName}</span> ({supply.createdBy.role.replace("_", " ")})
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-widest border border-emerald-200">
                  {supply.status}
                </span>
              </div>
              
              {/* Core Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><Scale size={16} className="text-emerald-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Available Qty</span></div>
                  <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat().format(supply.quantity)} <span className="text-sm font-normal text-slate-500">Units</span></p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><CircleDollarSign size={16} className="text-emerald-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Target Price</span></div>
                  <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(supply.price)}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><MapPin size={16} className="text-emerald-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Location</span></div>
                  <p className="text-sm font-bold text-slate-900 truncate" title={supply.location}>{supply.location}</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-500"><CalendarClock size={16} className="text-emerald-600"/> <span className="text-[10px] font-bold uppercase tracking-wider">Offer Validity</span></div>
                  <p className="text-sm font-bold text-rose-600">
                    {supply.validityDate ? new Date(supply.validityDate).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-300 italic font-normal">Not set</span>}
                  </p>
                </div>
              </div>

              {/* NEW: Trade Logistics Grid */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Truck size={16} className="text-emerald-500" /> Trade Logistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  <LogisticsItem label="Origin" value={supply.origin} icon={<MapPin size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Destination" value={supply.destination} icon={<MapPin size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Incoterms" value={supply.incoterms} icon={<Truck size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Payment Terms" value={supply.paymentTerms} icon={<CreditCard size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Inspection" value={supply.inspection} icon={<ShieldCheck size={14} className="text-slate-400" />} />
                  <LogisticsItem label="Packaging" value={supply.packaging} icon={<Package size={14} className="text-slate-400" />} />
                </div>
              </div>

              {/* NEW: Technical Specifications (Dynamic JSON) */}
              {supply.keyTerms && Array.isArray(supply.keyTerms) && supply.keyTerms.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <List size={16} className="text-emerald-500" /> Technical Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {supply.keyTerms.map((term: any, idx: number) => (
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
                  <FileText size={16} className="text-emerald-500" /> General Notes
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{supply.specs}</p>
              </div>

              {/* Attachments */}
              {supply.attachments && supply.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Official Documents ({supply.attachments.length})
                  </h4>
                  <MediaGallery attachments={supply.attachments} />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}