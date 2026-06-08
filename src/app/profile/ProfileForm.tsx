"use client";

import { useState, useRef } from "react";
import { User, KeyRound, Loader2, Save } from "lucide-react";
import { updateUserProfile } from "@/actions/userActions";

interface ProfileFormProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      await updateUserProfile(formData);
      alert("✅ Personal Profile successfully updated!");
      
      // Clear password field after successful update
      if (formRef.current) {
        (formRef.current.elements.namedItem("password") as HTMLInputElement).value = "";
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      
      {/* Standard Info */}
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" /> Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">First Name</label>
            <input type="text" name="firstName" defaultValue={user.firstName} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-semibold text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Last Name</label>
            <input type="text" name="lastName" defaultValue={user.lastName} required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-semibold text-slate-900" />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Password Reset */}
      <div>
        <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
          <KeyRound size={14} className="text-amber-500" /> Update Password
        </label>
        <input type="password" name="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-semibold text-slate-900" />
        <p className="text-[10px] text-slate-400 font-medium mt-2">Leave blank if you do not wish to change your current password.</p>
      </div>

      {/* Submit */}
      <div className="pt-6 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Personal Changes</>}
        </button>
      </div>
    </form>
  );
}