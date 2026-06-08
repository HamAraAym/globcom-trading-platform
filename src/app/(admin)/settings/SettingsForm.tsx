"use client";

import { useState, useRef } from "react";
import { Building, Globe, Loader2, Save, X, FileText } from "lucide-react";
import { updateGlobalSettings } from "@/actions/adminActions";

interface SettingsFormProps {
  user: {
    role: string;
  };
  systemSettings?: {
    companyName: string;
    companyLogoUrl: string | null;
    letterheadUrl?: string | null;
  };
}

export default function SettingsForm({ user, systemSettings }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Logo State
  const [logoPreview, setLogoPreview] = useState<string | null>(systemSettings?.companyLogoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Letterhead State
  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(systemSettings?.letterheadUrl || null);
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  // Client-side security fallback
  const isAdminOrManagement = user.role === "ADMIN" || user.role === "MANAGEMENT";
  if (!isAdminOrManagement) return null;

  // Handlers for Logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) return alert("Please upload an image smaller than 5MB.");
      setLogoFile(selectedFile);
      setLogoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Handlers for Letterhead
  const handleLetterheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) return alert("Please upload an image smaller than 5MB.");
      setLetterheadFile(selectedFile);
      setLetterheadPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearLetterhead = () => {
    setLetterheadFile(null);
    setLetterheadPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      // Manage Logo Payload
      formData.delete("logo");
      if (logoFile) formData.append("logo", logoFile);
      else if (!logoPreview) formData.append("removeLogo", "true");

      // Manage Letterhead Payload
      formData.delete("letterhead");
      if (letterheadFile) formData.append("letterhead", letterheadFile);
      else if (!letterheadPreview) formData.append("removeLetterhead", "true");

      await updateGlobalSettings(formData);
      alert("✅ Enterprise Branding successfully updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to update enterprise branding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full min-h-0">
      {/* Dark Enterprise Header (Pinned to top) */}
      <div className="bg-slate-900 px-6 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <Globe size={24} className="text-blue-400 shrink-0" />
          <div>
            <h2 className="text-xl font-bold tracking-wide">Global Enterprise Branding</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Changes applied here will affect the entire platform immediately.</p>
          </div>
        </div>
      </div>

      {/* ⚡ FIX: overflow-y-auto allows the form inside the card to scroll independently! */}
      <form ref={formRef} onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar pb-12">
        {/* Enterprise Name Field */}
        <div>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
            Registered Enterprise Name
          </label>
          <input 
            type="text" 
            name="companyName" 
            defaultValue={systemSettings?.companyName} 
            required 
            placeholder="e.g., GlobCom International FZE"
            className="w-full sm:max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-sm" 
          />
        </div>

        <hr className="border-slate-100" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Global UI Logo Upload */}
          <div>
            <div className="mb-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Global Platform Logo
              </label>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Upload a square, high-resolution graphic (PNG or JPG). This replaces the default icon in the platform sidebar.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl">
              {logoPreview ? (
                <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden bg-white flex justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo Preview" className="max-h-24 object-contain" />
                  <button type="button" onClick={clearLogo} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg hover:bg-rose-600 transition-colors shadow-md">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors relative group">
                  <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleLogoChange} />
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                    <Building className="text-blue-500 w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Drop square logo here</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Max file size: 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Unified Company Letterhead Upload */}
          <div>
            <div className="mb-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Unified Corporate Letterhead
              </label>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Upload the official company letterhead (High-Res PNG or JPG). This will be injected into all generated trade documents.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl">
              {letterheadPreview ? (
                <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden bg-white flex justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={letterheadPreview} alt="Letterhead Preview" className="max-h-24 object-contain w-full" />
                  <button type="button" onClick={clearLetterhead} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg hover:bg-rose-600 transition-colors shadow-md">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors relative group">
                  <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleLetterheadChange} />
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="text-indigo-500 w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Drop letterhead banner here</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Max file size: 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-800/20 transition-all shrink-0"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> Publishing Brand...</>
            ) : (
              <><Save size={18} /> Publish Enterprise Brand</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}