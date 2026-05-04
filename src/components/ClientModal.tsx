"use client";

import { useState, useRef, useEffect } from "react";
import { UserPlus, Building, Mail, Phone, Loader2, X, Briefcase, User, FileBadge, Globe, FileText, UploadCloud } from "lucide-react";
import { createBuyer } from "@/actions/buyerActions";
import LocationAutocomplete from "./LocationAutocomplete";

export default function ClientModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dual-Entity State
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
      <button onClick={() => setIsOpen(true)} className="flex items-center justify-center gap-1.5 md:gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm md:text-base font-bold shadow-lg shadow-indigo-600/20 transition-all shrink-0 w-full sm:w-auto">
        <UserPlus size={18} className="md:w-5 md:h-5" />
        Register Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* NATIVE MOBILE UPGRADE: Bottom Sheet on Mobile, Centered Modal on Desktop */}
          <div className="bg-white w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[95vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 md:gap-3 text-indigo-700">
                <div className="bg-indigo-100 p-1.5 md:p-2 rounded-lg"><Briefcase size={18} className="md:w-5 md:h-5" /></div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">Add External Client</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1.5 md:p-2 rounded-full transition-colors border border-slate-200 shadow-sm shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                
                {/* DUAL-ENTITY TOGGLE */}
                <input type="hidden" name="type" value={clientType} />
                <div className="flex bg-slate-100 p-1 md:p-1.5 rounded-lg md:rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setClientType("CORPORATE")} 
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-md md:rounded-lg transition-all ${clientType === 'CORPORATE' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Building size={14} className="md:w-4 md:h-4" /> Corporate Entity
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setClientType("INDIVIDUAL")} 
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-md md:rounded-lg transition-all ${clientType === 'INDIVIDUAL' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <User size={14} className="md:w-4 md:h-4" /> Individual Trader
                  </button>
                </div>

                {/* CORPORATE SPECIFIC FIELDS */}
                {clientType === "CORPORATE" && (
                  <div className="p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl space-y-4 md:space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <Building className="absolute left-3 md:left-3.5 top-3 md:top-3.5 text-slate-400" size={16} />
                        <input type="text" name="company" required className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="e.g. GlobCom International FZE" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div>
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Registration / Tax No.</label>
                        <div className="relative mt-1.5">
                          <FileBadge className="absolute left-3 md:left-3.5 top-3 md:top-3.5 text-slate-400" size={16} />
                          <input type="text" name="registrationNo" className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="e.g. TRN-12345678" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Website</label>
                        <div className="relative mt-1.5">
                          <Globe className="absolute left-3 md:left-3.5 top-3 md:top-3.5 text-slate-400" size={16} />
                          <input type="url" name="website" className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* CORE SHARED FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div className={clientType === "INDIVIDUAL" ? "md:col-span-2" : ""}>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {clientType === "CORPORATE" ? "Primary Contact Person" : "Full Legal Name"} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="name" required className="w-full mt-1.5 p-2.5 md:p-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 md:left-3.5 top-3 md:top-3.5 text-slate-400" size={16} />
                      <input type="email" name="email" required className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 md:left-3.5 top-3 md:top-3.5 text-slate-400" size={16} />
                      <input type="tel" name="phone" className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm text-base md:text-sm" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="pt-2">
                  <LocationAutocomplete />
                </div>

                {/* KYC COMPLIANCE UPLOADS */}
                <div className="pt-4 md:pt-6 border-t border-slate-100">
                  <h3 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                    <FileText size={14} className="text-blue-500 md:w-4 md:h-4" /> KYC & Compliance Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Passport (Required for both) */}
                    <div className="bg-slate-50 p-3 md:p-4 border border-slate-200 rounded-xl md:rounded-2xl flex flex-col">
                      <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                        Signatory Passport / ID
                      </label>
                      <div className={`flex-1 border-2 border-dashed rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col items-center justify-center transition-colors relative ${passportFileName ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                        <input 
                          type="file" 
                          name="passport" 
                          accept="image/*,application/pdf" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onChange={(e) => setPassportFileName(e.target.files?.[0]?.name || null)} 
                        />
                        {passportFileName ? (
                          <div className="text-center">
                            <FileText className="mx-auto text-indigo-500 mb-1" size={16} />
                            <p className="text-[9px] md:text-[10px] font-bold text-indigo-700 truncate max-w-[150px]">{passportFileName}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <UploadCloud className="mx-auto text-slate-400 mb-1" size={16} />
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-600">Upload PDF/Image</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trade License (Corporate Only) */}
                    {clientType === "CORPORATE" && (
                      <div className="bg-slate-50 p-3 md:p-4 border border-slate-200 rounded-xl md:rounded-2xl flex flex-col animate-in fade-in duration-300">
                        <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                          Official Trade License
                        </label>
                        <div className={`flex-1 border-2 border-dashed rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col items-center justify-center transition-colors relative ${licenseFileName ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                          <input 
                            type="file" 
                            name="tradeLicense" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            onChange={(e) => setLicenseFileName(e.target.files?.[0]?.name || null)} 
                          />
                          {licenseFileName ? (
                            <div className="text-center">
                              <FileText className="mx-auto text-indigo-500 mb-1" size={16} />
                              <p className="text-[9px] md:text-[10px] font-bold text-indigo-700 truncate max-w-[150px]">{licenseFileName}</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <UploadCloud className="mx-auto text-slate-400 mb-1" size={16} />
                              <p className="text-[9px] md:text-[10px] font-bold text-slate-600">Upload PDF/Image</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* NATIVE MOBILE UPGRADE: Added pb-8 for iOS safe area padding */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 shrink-0 pb-8 sm:pb-4">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2.5 text-xs md:text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto text-center">Cancel</button>
              <button onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all w-full sm:w-auto shrink-0">
                {isSubmitting ? <><Loader2 size={16} className="md:w-4 md:h-4 animate-spin" /> Saving...</> : "Save Client Record"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}