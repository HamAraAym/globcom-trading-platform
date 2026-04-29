"use client";

import { useState, useEffect } from "react";
import { Eye, X, MapPin, Calendar, DollarSign, Package, FileText, Image as ImageIcon, CheckCircle2, ShieldAlert, Navigation } from "lucide-react";

interface ViewDealModalProps {
  deal: any;
  type: "Demand" | "Supply"; // Dictates color scheme
}

export default function ViewDealModal({ deal, type }: ViewDealModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Color mappings based on type
  const theme = type === "Demand" ? {
    bg: "bg-blue-600",
    text: "text-blue-600",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200"
  } : {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200"
  };

  // Safe parsing for dynamic key terms
  let parsedTerms: {label: string, value: string}[] = [];
  try {
    parsedTerms = typeof deal.keyTerms === "string" ? JSON.parse(deal.keyTerms) : (deal.keyTerms || []);
  } catch (e) {
    parsedTerms = [];
  }

  // Separate attachments into Images and Documents
  const images = deal.attachments?.filter((url: string) => url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) || [];
  const docs = deal.attachments?.filter((url: string) => url.match(/\.(pdf|doc|docx)$/i)) || [];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition-all"
        title="Quick View"
      >
        <Eye size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          
          {/* Clickaway overlay */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

          {/* Slide-over Panel */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className={`px-6 py-5 ${theme.bg} text-white shrink-0 flex justify-between items-start`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                    {type}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                    {deal.status.replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{deal.title}</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Core Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Package size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Volume</span>
                  </div>
                  <p className="font-black text-slate-900">{new Intl.NumberFormat().format(deal.quantity)} {deal.quantityUnit}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Price</span>
                  </div>
                  <p className={`font-black ${(deal.price || deal.targetPrice) ? theme.text : "text-slate-400"}`}>
                    {(deal.price || deal.targetPrice) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.price || deal.targetPrice) : "TBD"}
                  </p>
                </div>
              </div>

              {/* Logistics Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Trade Logistics</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-sm">
                  
                  <div className="flex items-start gap-3">
                    <Navigation size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{deal.origin || "TBA"} <span className="text-slate-400 font-normal mx-1">→</span> {deal.destination || "TBA"}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Route</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{type === "Demand" ? deal.timeline : (deal.validityDate ? new Date(deal.validityDate).toLocaleDateString() : "N/A")}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{type === "Demand" ? "Delivery Timeline" : "Offer Validity"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-slate-100 mt-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Incoterms</p>
                      <p className="font-bold text-slate-900">{deal.incoterms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment</p>
                      <p className="font-bold text-slate-900 truncate" title={deal.paymentTerms}>{deal.paymentTerms || "N/A"}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Technical Specifications</h3>
                
                {parsedTerms.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {parsedTerms.map((term: {label: string, value: string}, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{term.label}</p>
                        <p className="text-sm font-bold text-slate-900 truncate" title={term.value}>{term.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {deal.specs}
                </div>
              </div>

              {/* Attachments */}
              {(images.length > 0 || docs.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Official Documents</h3>
                  
                  {docs.length > 0 && (
                    <div className="space-y-2">
                      {docs.map((doc: string, idx: number) => (
                        <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 p-3 rounded-xl transition-colors group">
                          <div className="bg-rose-100 p-2 rounded-lg text-rose-600 group-hover:bg-rose-200 transition-colors">
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">Attached_Document_{idx + 1}.pdf</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Click to view</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {images.map((img: string, idx: number) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block relative h-24 rounded-xl border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Deal Reference" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}