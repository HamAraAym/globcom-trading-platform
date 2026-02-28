"use client";

import { useState, useRef, useEffect } from "react";
import { UserPlus, Building, Mail, Phone, Loader2, X, Briefcase } from "lucide-react";
import { createBuyer } from "@/actions/buyerActions";
import LocationAutocomplete from "./LocationAutocomplete";

export default function ClientModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      formRef.current?.reset();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create client.");
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
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3 text-indigo-700">
                <div className="bg-indigo-100 p-2 rounded-lg"><Briefcase size={20} /></div>
                <h2 className="text-xl font-bold text-slate-900">Add External Client</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border border-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input type="text" name="name" required className="w-full mt-1.5 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company / Entity</label>
                    <div className="relative mt-1.5">
                      <Building className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                      <input type="text" name="company" required className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="e.g. Acme Corp" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                      <input type="email" name="email" required className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" placeholder="john@acmecorp.com" />
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

                {/* THE NEW GOOGLE PLACES COMPONENT */}
                <div className="pt-4 border-t border-slate-100">
                  <LocationAutocomplete />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
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