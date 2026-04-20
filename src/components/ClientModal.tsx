"use client";

import { useState, useRef, useEffect } from "react";
import { UserPlus, Building, Mail, Phone, Loader2, X, Briefcase, User, FileBadge, Globe, FileText, UploadCloud } from "lucide-react";
import { createBuyer } from "@/actions/buyerActions";
import LocationAutocomplete from "./LocationAutocomplete";

export default function ClientModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NEW: Dual-Entity State
  const [clientType, setClientType] = useState<"CORPORATE" | "INDIVIDUAL">("CORPORATE");
  
  // File upload UI states for visual feedback
  const [passportFileName, setPassportFileName] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createBuyer(formData);
      
      // Reset everything on success
      formRef.current?.reset();
      setPassportFileName(null);
      setLicenseFileName(null);
      setClientType("CORPORATE");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create client. Ensure files are under 10MB.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all shrink-0">
        <UserPlus size={20} />
        Register Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 text-indigo-700">
                <div className="bg-indigo-100 p-2 rounded-lg"><Briefcase size={20} /></div>
                <h2 className="text-xl font-bold text-slate-900">Add External Client</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border border-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                
                {/* DUAL-ENTITY TOGGLE */}
                <input type="hidden" name="type" value={clientType} />
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setClientType("CORPORATE")} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${clientType === 'CORPORATE' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Building size={16} /> Corporate Entity
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setClientType("INDIVIDUAL")} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${clientType === 'INDIVIDUAL' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <User size={16} /> Individual Trader
                  </button>
                </div>

                {/* CORPORATE SPECIFIC FIELDS */}
                {clientType === "CORPORATE" && (
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <Building className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input type="text" name="company" required className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="e.g. GlobCom International FZE" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration / Tax No.</label>
                        <div className="relative mt-1.5">
                          <FileBadge className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                          <input type="text" name="registrationNo" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="e.g. TRN-12345678" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Website</label>
                        <div className="relative mt-1.5">
                          <Globe className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                          <input type="url" name="website" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* CORE SHARED FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={clientType === "INDIVIDUAL" ? "md:col-span-2" : ""}>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {clientType === "CORPORATE" ? "Primary Contact Person" : "Full Legal Name"} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="name" required className="w-full mt-1.5 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                      <input type="email" name="email" required className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                      <input type="text" name="phone" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="pt-2">
                  <LocationAutocomplete />
                </div>

                {/* KYC COMPLIANCE UPLOADS */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" /> KYC & Compliance Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Passport (Required for both) */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                        Signatory Passport / ID
                      </label>
                      <div className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative ${passportFileName ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                        <input 
                          type="file" 
                          name="passport" 
                          accept="image/*,application/pdf" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onChange={(e) => setPassportFileName(e.target.files?.[0]?.name || null)} 
                        />
                        {passportFileName ? (
                          <div className="text-center">
                            <FileText className="mx-auto text-indigo-500 mb-1" size={20} />
                            <p className="text-[10px] font-bold text-indigo-700 truncate max-w-[150px]">{passportFileName}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <UploadCloud className="mx-auto text-slate-400 mb-1" size={20} />
                            <p className="text-[10px] font-bold text-slate-600">Upload PDF/Image</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trade License (Corporate Only) */}
                    {clientType === "CORPORATE" && (
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                          Official Trade License
                        </label>
                        <div className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative ${licenseFileName ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                          <input 
                            type="file" 
                            name="tradeLicense" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            onChange={(e) => setLicenseFileName(e.target.files?.[0]?.name || null)} 
                          />
                          {licenseFileName ? (
                            <div className="text-center">
                              <FileText className="mx-auto text-indigo-500 mb-1" size={20} />
                              <p className="text-[10px] font-bold text-indigo-700 truncate max-w-[150px]">{licenseFileName}</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <UploadCloud className="mx-auto text-slate-400 mb-1" size={20} />
                              <p className="text-[10px] font-bold text-slate-600">Upload PDF/Image</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all">
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Client Record"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}