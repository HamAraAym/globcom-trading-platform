"use client";

import { useState } from "react";
import { Send, Mail, Building, FileText, Loader2, X, ShieldAlert, User, Package, CircleDollarSign, Calendar, FileBadge, CheckSquare, Square } from "lucide-react";
import { dispatchToClient } from "@/actions/emailActions";

interface Buyer {
  id: string;
  name: string;
  company: string | null; 
  type: "CORPORATE" | "INDIVIDUAL";
  email: string;
}

interface DispatcherProps {
  buyers: Buyer[];
  contextItem: any; // This will now include .documents from the database!
  type: "DEMAND" | "SUPPLY";
  themeColor: string;
}

type DispatchType = "GENERAL" | "LOI" | "FCO" | "SCO";

export default function EmailDispatcher({ buyers, contextItem, type, themeColor }: DispatcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New States for our Deal Desk upgrades!
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [dispatchType, setDispatchType] = useState<DispatchType>(type === "DEMAND" ? "LOI" : "FCO");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return alert("Please select a client.");
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("buyerId", selectedBuyer);
      formData.append("contextId", contextItem.id);
      formData.append("contextType", type);
      formData.append("title", contextItem.title);
      formData.append("dispatchType", dispatchType);
      formData.append("customMessage", customMessage); // Send custom message
      formData.append("attachedDocs", JSON.stringify(selectedDocs)); // Send selected generated PDFs
      
      await dispatchToClient(formData);
      setIsOpen(false);
      
      // Reset forms
      setCustomMessage("");
      setSelectedDocs([]);
      alert(`✅ ${dispatchType} successfully dispatched to client.`);
    } catch (error) {
      console.error(error);
      alert("Failed to send email. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBuyer = buyers.find(b => b.id === selectedBuyer);

  // Filter generated documents to only show ones made for the selected buyer
  const availableDocs = contextItem?.documents?.filter((doc: any) => doc.clientId === selectedBuyer) || [];

  const toggleDoc = (docUrl: string) => {
    setSelectedDocs(prev => prev.includes(docUrl) ? prev.filter(url => url !== docUrl) : [...prev, docUrl]);
  };

  const getSubject = () => {
    switch (dispatchType) {
      case "LOI": return `Official Letter of Interest (LOI): ${contextItem.title}`;
      case "FCO": return `Full Corporate Offer (FCO): ${contextItem.title}`;
      case "SCO": return `Soft Corporate Offer (SCO): ${contextItem.title}`;
      default: return `GlobCom Private Listing: ${contextItem.title}`;
    }
  };

  const getOpeningText = () => {
    switch (dispatchType) {
      case "LOI": return "We are pleased to issue the following Letter of Interest (LOI) declaring our readiness to purchase the commodity detailed below:";
      case "FCO": return "We are pleased to issue this binding Full Corporate Offer (FCO) for the supply of the commodity detailed below:";
      case "SCO": return "For preliminary discussion purposes, please review this Soft Corporate Offer (SCO) for the following commodity:";
      default: return "Please find the requested details for our currently available commodity below:";
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`w-full mt-6 flex items-center justify-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-${themeColor}-600/20 group`}
      >
        <Mail size={18} className="group-hover:scale-110 transition-transform" />
        Dispatch to External Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0`}>
              <div className="flex items-center gap-3">
                <div className={`bg-${themeColor}-500 p-2 rounded-lg`}><Send size={20} /></div>
                <h2 className="text-xl font-bold tracking-wide">External Dispatcher</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-slate-50 flex flex-col lg:flex-row gap-8">
              
              {/* LEFT COLUMN: Controls & Selections */}
              <div className="w-full lg:w-[45%] space-y-8 flex flex-col">
                
                {/* 1. Client Selection */}
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">1. Target Client</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                    {buyers.length === 0 ? (
                       <div className="text-sm font-bold text-slate-500 p-6 bg-white rounded-2xl border border-slate-200 text-center col-span-2 shadow-sm">No clients in CRM.</div>
                    ) : (
                      buyers.map(buyer => (
                        <button
                          key={buyer.id}
                          onClick={() => {
                            setSelectedBuyer(buyer.id);
                            setSelectedDocs([]); // Clear docs when switching clients
                          }}
                          className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                            selectedBuyer === buyer.id 
                              ? `bg-${themeColor}-50 border-${themeColor}-400 ring-4 ring-${themeColor}-500/10 shadow-md` 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{buyer.company || buyer.name}</p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                            {buyer.type === "CORPORATE" ? <><Building size={12} className="text-indigo-400"/> {buyer.name}</> : <><User size={12} className="text-emerald-400"/> Individual</>}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Dispatch Type */}
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">2. Formal Dispatch Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "LOI", label: "LOI", desc: "Letter of Interest" },
                      { id: "FCO", label: "FCO", desc: "Full Corporate Offer" },
                      { id: "SCO", label: "SCO", desc: "Soft Corporate Offer" },
                      { id: "GENERAL", label: "Details", desc: "General Specs" }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setDispatchType(btn.id as DispatchType)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          dispatchType === btn.id 
                            ? `bg-${themeColor}-600 border-${themeColor}-700 text-white shadow-md` 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-sm font-black ${dispatchType === btn.id ? 'text-white' : 'text-slate-900'}`}>{btn.label}</p>
                        <p className={`text-[10px] font-medium mt-0.5 ${dispatchType === btn.id ? `text-${themeColor}-100` : 'text-slate-500'}`}>{btn.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Official Document Attachments */}
                {selectedBuyer && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileBadge size={16} className={`text-${themeColor}-500`} /> 3. Attach Official Documents
                    </h3>
                    {availableDocs.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 bg-white border border-slate-200 rounded-xl italic">
                        No official documents generated for this client on this deal yet. Use the Document Generator first!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableDocs.map((doc: any) => {
                          const isSelected = selectedDocs.includes(doc.fileUrl);
                          return (
                            <div 
                              key={doc.id}
                              onClick={() => toggleDoc(doc.fileUrl)}
                              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? `bg-${themeColor}-50 border-${themeColor}-300` : 'bg-white border-slate-200 hover:border-slate-300'}`}
                            >
                              <div className={`text-${isSelected ? themeColor : 'slate'}-500`}>
                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className={`text-sm font-bold truncate ${isSelected ? `text-${themeColor}-900` : 'text-slate-700'}`}>{doc.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Generated {new Date(doc.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Custom Message Input */}
                <div>
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">4. Custom Message (Optional)</h3>
                   <textarea
                     value={customMessage}
                     onChange={(e) => setCustomMessage(e.target.value)}
                     placeholder="Type a personal greeting or negotiation note here..."
                     rows={3}
                     className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/30 focus:border-${themeColor}-500 transition-all resize-none`}
                   />
                </div>

              </div>

              {/* RIGHT COLUMN: Sleek Email Preview */}
              <div className="w-full lg:w-[55%] flex flex-col h-full">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                   Email Preview
                </h3>
                
                <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden font-sans">
                  
                  {/* Email Headers */}
                  <div className="bg-slate-50 border-b border-slate-100 p-5 space-y-3 shrink-0">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-16 text-slate-400 font-medium text-right">From:</span>
                      <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">trading@globcom.com</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-16 text-slate-400 font-medium text-right">To:</span>
                      {activeBuyer ? (
                         <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">{activeBuyer.email}</span>
                      ) : (
                         <span className="text-slate-400 italic font-medium">Select a client...</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm pt-2">
                      <span className="w-16 text-slate-400 font-medium text-right">Subject:</span>
                      <span className="font-bold text-slate-900 tracking-tight">{getSubject()}</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-6 md:p-8 flex-1 text-slate-700 text-sm leading-relaxed overflow-y-auto custom-scrollbar">
                    <p className="font-medium">Dear {activeBuyer ? activeBuyer.name : "[Client Name]"},</p>
                    
                    {/* INJECTED CUSTOM MESSAGE */}
                    {customMessage && (
                      <div className="mt-4 p-4 bg-slate-50 border-l-4 border-slate-300 rounded-r-xl text-slate-800 whitespace-pre-wrap font-medium italic shadow-sm">
                        "{customMessage}"
                      </div>
                    )}

                    <p className="mt-4">{getOpeningText()}</p>
                    
                    {/* Modern Product Card */}
                    <div className="my-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className={`h-1.5 w-full bg-${themeColor}-500`}></div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 bg-${themeColor}-50 text-${themeColor}-600 rounded-xl`}>
                            <Package size={20} />
                          </div>
                          <h4 className="font-black text-slate-900 text-lg tracking-tight">{contextItem.title}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Price:</span>
                            <span className="text-sm font-black text-emerald-600">
                              {(contextItem.price || contextItem.targetPrice) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(contextItem.price || contextItem.targetPrice) : "TBD"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Volume:</span>
                            <span className="text-sm font-bold text-slate-900">{new Intl.NumberFormat().format(contextItem.quantity)} {contextItem.quantityUnit || "MT"}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Timeline/Location:</span>
                            <span className="text-sm font-bold text-slate-900">{contextItem.location || contextItem.timeline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 whitespace-pre-wrap mt-6">{contextItem.specs}</p>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="font-medium text-slate-900">Best Regards,</p>
                      <p className="font-black text-slate-900 mt-1">GlobCom Trading Team</p>
                    </div>
                  </div>

                  {/* Attachment Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {selectedDocs.length + (contextItem.attachments?.length || 0)} Documents Attached
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">Includes {selectedDocs.length} Official Contracts & {contextItem.attachments?.length || 0} Standard Specs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedBuyer} 
                className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 disabled:bg-slate-300 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-${themeColor}-600/20 transition-all`}
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Sending Transmission...</> : <><Send size={18} /> Confirm & Send {dispatchType}</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}