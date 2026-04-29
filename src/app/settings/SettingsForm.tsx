"use client";

import { useState, useRef } from "react";
import { User, Mail, Shield, Image as ImageIcon, UploadCloud, Loader2, Save, X, Building } from "lucide-react";
import { updateUserProfile } from "@/actions/userActions";

interface SettingsFormProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    letterheadUrl: string | null;
  };
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(user.letterheadUrl);
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) {
        alert("Please upload an image smaller than 5MB.");
        return;
      }
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
      
      // Handle Image
      formData.delete("letterhead"); 
      if (file) {
        formData.append("letterhead", file);
      } else if (!preview) {
        // If they cleared the preview, we might want to handle deletion in the future.
        // For now, submitting empty just skips the upload.
      }

      await updateUserProfile(formData);
      alert("✅ Profile successfully updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl font-black border border-indigo-500/30">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{user.firstName} {user.lastName}</h2>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mt-1">
              <Mail size={14} /> {user.email}
            </p>
          </div>
          <div className="ml-auto bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{user.role.replace("_", " ")}</span>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Personal Details */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                <input type="text" name="firstName" defaultValue={user.firstName} required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                <input type="text" name="lastName" defaultValue={user.lastName} required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Letterhead Engine Upload */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Building size={16} className="text-indigo-500" /> Enterprise Branding
            </h3>
            <p className="text-sm text-slate-500 mb-4 max-w-2xl">
              Upload your official company letterhead (High-Res PNG or JPG). This will be automatically injected into all FCOs and LOIs you generate in the Deal Desk.
            </p>
            
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl">
              {preview ? (
                <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden bg-white flex justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Letterhead Preview" className="max-h-32 object-contain" />
                  <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg hover:bg-rose-600 transition-colors shadow-md">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors relative">
                  <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                  <UploadCloud className="mx-auto text-indigo-400 mb-3" size={32} />
                  <p className="text-sm font-bold text-slate-700">Drop your Letterhead image here</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Recommended: Wide format (e.g., 2000x400px)</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
            >
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Saving Profile...</> : <><Save size={18} /> Update Profile Settings</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}