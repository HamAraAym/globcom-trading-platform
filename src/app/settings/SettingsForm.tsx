"use client";

import { useState, useRef } from "react";
import { User, Mail, Shield, UploadCloud, Loader2, Save, X, Building, Globe, FileText } from "lucide-react";
import { updateUserProfile } from "@/actions/userActions";
import { updateGlobalSettings } from "@/actions/adminActions";

interface SettingsFormProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    letterheadUrl: string | null;
  };
  systemSettings?: {
    companyName: string;
    companyLogoUrl: string | null;
  };
}

export default function SettingsForm({ user, systemSettings }: SettingsFormProps) {
  // --- Personal Profile State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(user.letterheadUrl);
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // --- Global Config State (Admins Only) ---
  const [isGlobalSubmitting, setIsGlobalSubmitting] = useState(false);
  const [globalPreview, setGlobalPreview] = useState<string | null>(systemSettings?.companyLogoUrl || null);
  const [globalFile, setGlobalFile] = useState<File | null>(null);
  const globalFormRef = useRef<HTMLFormElement>(null);

  const isAdmin = user.role === "ADMIN";

  // ==========================================
  // PERSONAL PROFILE HANDLERS
  // ==========================================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) return alert("Please upload an image smaller than 5MB.");
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.delete("letterhead"); 
      if (file) formData.append("letterhead", file);
      else if (!preview) formData.append("removeLetterhead", "true");

      await updateUserProfile(formData);
      alert("✅ Profile successfully updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // GLOBAL CONFIG HANDLERS
  // ==========================================
  const handleGlobalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) return alert("Please upload an image smaller than 5MB.");
      setGlobalFile(selectedFile);
      setGlobalPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearGlobalImage = () => {
    setGlobalFile(null);
    setGlobalPreview(null);
  };

  const handleGlobalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGlobalSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.delete("logo");
      if (globalFile) formData.append("logo", globalFile);
      else if (!globalPreview) formData.append("removeLogo", "true");

      await updateGlobalSettings(formData);
      alert("✅ Enterprise Branding successfully updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to update enterprise branding.");
    } finally {
      setIsGlobalSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      
      {/* 1. PERSONAL PROFILE FORM */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Profile Header */}
        <div className="bg-slate-900 px-4 md:px-8 py-4 md:py-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl md:text-2xl font-black border border-indigo-500/30 shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">{user.firstName} {user.lastName}</h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 truncate">
                <Mail size={14} className="shrink-0" /> <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>
          <div className="mt-1 sm:mt-0 sm:ml-auto bg-slate-800 border border-slate-700 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl flex items-center justify-center sm:justify-start gap-1.5 md:gap-2 w-full sm:w-auto shrink-0">
            <Shield size={14} className="text-emerald-400 shrink-0 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">{user.role.replace("_", " ")}</span>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
          <div>
            <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
              <User size={14} className="text-indigo-500 md:w-4 md:h-4" /> Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                {/* text-base on mobile prevents iOS keyboard auto-zoom */}
                <input type="text" name="firstName" defaultValue={user.firstName} required className="w-full mt-1.5 p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium text-base md:text-sm" />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                <input type="text" name="lastName" defaultValue={user.lastName} required className="w-full mt-1.5 p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium text-base md:text-sm" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <FileText size={14} className="text-indigo-500 md:w-4 md:h-4" /> Document Letterhead
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mb-3 md:mb-4 max-w-2xl leading-relaxed">
              Upload your personal or branch letterhead (High-Res PNG or JPG). This will be automatically injected into all FCOs and LOIs you generate.
            </p>
            
            <div className="bg-slate-50 p-4 md:p-6 border border-slate-200 rounded-xl md:rounded-2xl">
              {preview ? (
                <div className="relative border-2 border-slate-200 rounded-lg md:rounded-xl overflow-hidden bg-white flex justify-center p-3 md:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Letterhead Preview" className="max-h-24 md:max-h-32 object-contain" />
                  <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-rose-500 text-white p-1 md:p-1.5 rounded-md md:rounded-lg hover:bg-rose-600 transition-colors shadow-md">
                    <X size={14} className="md:w-4 md:h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg md:rounded-xl p-6 md:p-8 text-center hover:bg-slate-100 transition-colors relative">
                  <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                  <UploadCloud className="mx-auto text-indigo-400 mb-2 md:mb-3 w-6 h-6 md:w-8 md:h-8" />
                  <p className="text-xs md:text-sm font-bold text-slate-700">Drop your Letterhead image here</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 md:pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 md:px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin md:w-4 md:h-4" /> Saving Profile...</> : <><Save size={16} className="md:w-4 md:h-4" /> Update Profile</>}
            </button>
          </div>
        </form>
      </div>

      {/* 2. GLOBAL SYSTEM CONFIGURATION (ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-rose-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          
          <div className="bg-rose-50 px-4 md:px-8 py-3 md:py-4 border-b border-rose-100 flex items-center gap-2 md:gap-3">
            <div className="bg-rose-500 p-1.5 md:p-2 rounded-lg text-white shadow-sm shrink-0">
              <Globe size={16} className="md:w-4 md:h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-rose-900 tracking-tight leading-tight">Global Enterprise Branding</h2>
              <p className="text-[10px] md:text-xs text-rose-600 font-medium">Changes here will apply system-wide.</p>
            </div>
          </div>

          <form ref={globalFormRef} onSubmit={handleGlobalSubmit} className="p-4 md:p-8 space-y-5 md:space-y-6">
            <div>
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise Name</label>
              <input type="text" name="companyName" defaultValue={systemSettings?.companyName} required className="w-full sm:max-w-md mt-1.5 p-2.5 md:p-3 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900 font-medium block text-base md:text-sm" />
            </div>

            <div>
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 md:mb-2">Global Sidebar Logo</label>
              <div className="bg-slate-50 p-4 md:p-6 border border-slate-200 rounded-xl md:rounded-2xl sm:max-w-md">
                {globalPreview ? (
                  <div className="relative border-2 border-slate-200 rounded-lg md:rounded-xl overflow-hidden bg-white flex justify-center p-3 md:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={globalPreview} alt="Logo Preview" className="max-h-20 md:max-h-24 object-contain" />
                    <button type="button" onClick={clearGlobalImage} className="absolute top-2 right-2 bg-rose-500 text-white p-1 md:p-1.5 rounded-md md:rounded-lg hover:bg-rose-600 transition-colors shadow-md">
                      <X size={14} className="md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg md:rounded-xl p-6 md:p-8 text-center hover:bg-slate-100 transition-colors relative">
                    <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleGlobalImageChange} />
                    <Building className="mx-auto text-slate-400 mb-2 md:mb-3 w-6 h-6 md:w-8 md:h-8" />
                    <p className="text-xs md:text-sm font-bold text-slate-700">Drop square logo here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex pt-2 md:pt-4">
              <button type="submit" disabled={isGlobalSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-6 md:px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 transition-all">
                {isGlobalSubmitting ? <><Loader2 size={16} className="animate-spin md:w-4 md:h-4" /> Applying...</> : <><Save size={16} className="md:w-4 md:h-4" /> Publish Brand</>}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}