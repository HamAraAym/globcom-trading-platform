"use client";

import { useState } from "react";
import { Send, Mail, Building, FileText, Loader2, X, ShieldAlert, User } from "lucide-react";
import { dispatchToClient } from "@/actions/emailActions";

// FIX: Updated interface to support dual-entity CRM architecture
interface Buyer {
  id: string;
  name: string;
  company: string | null; 
  type: "CORPORATE" | "INDIVIDUAL";
  email: string;
}

interface DispatcherProps {
  buyers: Buyer[];
  contextItem: any;
  type: "DEMAND" | "SUPPLY";
  themeColor: string;
}

export default function EmailDispatcher({ buyers, contextItem, type, themeColor }: DispatcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");

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
      
      await dispatchToClient(formData);
      setIsOpen(false);
      alert("✅ Product details successfully dispatched to client.");
    } catch (error) {
      console.error(error);
      alert("Failed to send email. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBuyer = buyers.find(b => b.id === selectedBuyer);

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
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white`}>
              <div className="flex items-center gap-3">
                <div className={`bg-${themeColor}-500 p-2 rounded-lg`}><Send size={20} /></div>
                <h2 className="text-xl font-bold tracking-wide">External Dispatcher</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Client Selection */}
              <div className="w-full md:w-1/3 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Select Target Client</h3>
                
                <div className="space-y-2">
                  {buyers.length === 0 ? (
                     <div className="text-sm text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200 text-center">No clients in CRM.</div>
                  ) : (
                    buyers.map(buyer => (
                      <button
                        key={buyer.id}
                        onClick={() => setSelectedBuyer(buyer.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedBuyer === buyer.id 
                            ? `bg-${themeColor}-50 border-${themeColor}-500 ring-1 ring-${themeColor}-500 shadow-sm` 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold text-slate-900 text-sm">{buyer.company || buyer.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          {buyer.type === "CORPORATE" ? <><Building size={10}/> {buyer.name}</> : <><User size={10}/> Individual Entity</>}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 text-xs leading-relaxed">
                  <ShieldAlert size={24} className="shrink-0 text-amber-600" />
                  <p><strong>SOP Warning:</strong> Dispatching this item will send an automated email with pricing and spec sheets to the selected external entity.</p>
                </div>
              </div>

              {/* Right Column: Email Preview */}
              <div className="w-full md:w-2/3 flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Email Preview</h3>
                
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col font-serif">
                  <div className="border-b border-slate-100 pb-4 mb-4 text-sm text-slate-500 space-y-1">
                    <p><strong>From:</strong> trading@globcom.com</p>
                    <p><strong>To:</strong> {activeBuyer ? activeBuyer.email : <span className="text-slate-300 italic">Select a client...</span>}</p>
                    <p><strong>Subject:</strong> GlobCom Private Listing: {contextItem.title}</p>
                  </div>

                  <div className="flex-1 text-slate-800 text-sm space-y-4">
                    <p>Dear {activeBuyer ? activeBuyer.name : "[Client Name]"},</p>
                    <p>Please find the requested details for our currently available commodity below:</p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 font-sans">
                      <p className="font-bold text-slate-900 text-lg mb-2">{contextItem.title}</p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {/* INJECTED DYNAMIC UNIT & FALLBACK PRICING */}
                        <li><strong>Quantity:</strong> {new Intl.NumberFormat().format(contextItem.quantity)} {contextItem.quantityUnit || "MT"}</li>
                        <li><strong>Price:</strong> {(contextItem.price || contextItem.targetPrice) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(contextItem.price || contextItem.targetPrice) : "TBD"}</li>
                        <li><strong>Location/Timeline:</strong> {contextItem.location || contextItem.timeline}</li>
                      </ul>
                    </div>
                    
                    <p className="text-xs text-slate-500 italic whitespace-pre-wrap">{contextItem.specs}</p>
                    <p>Best Regards,<br/><strong>GlobCom Trading Team</strong></p>
                  </div>

                  {contextItem.attachments?.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <FileText size={14} /> {contextItem.attachments.length} Attachments Included
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedBuyer} 
                className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 disabled:bg-slate-300 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-${themeColor}-600/20 transition-all`}
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Send size={18} /> Confirm & Send</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}