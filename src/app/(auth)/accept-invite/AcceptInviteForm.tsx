"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { acceptInvitation } from "@/actions/userActions";

export default function AcceptInviteForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    await acceptInvitation(formData);

    // ⚡ THE MAGIC FIX: Force a hard browser reload to remount the Sidebar & TopBar!
    window.location.href = "/";
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
          <input 
            name="firstName" 
            type="text" 
            required 
            className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
          <input 
            name="lastName" 
            type="text" 
            required 
            className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Password</label>
        <input 
          name="password" 
          type="password" 
          required 
          minLength={8}
          className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
        />
        <p className="text-xs text-slate-400 mt-2 font-medium">Must be at least 8 characters.</p>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-black text-white font-bold p-3.5 rounded-xl hover:bg-slate-800 transition-all mt-2 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-80"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Setting up workspace..." : "Create Account & Login"}
      </button>
    </form>
  );
}