"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid security credentials. Access denied.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      
      {/* LEFT COLUMN: Corporate Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Background Decorative Element */}
        <Globe className="absolute -right-24 -bottom-24 text-slate-800/50" size={600} strokeWidth={0.5} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
              <Globe className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide">GlobCom</h1>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">International FZE</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Global Commodity <br /> Trading Network
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-8">
            Empowering global industries by delivering reliable, efficient, and ethical trading solutions across emerging markets.
          </p>

          <div className="flex flex-wrap gap-3">
            {["Fertilizers", "Petrochemicals", "Metals", "Fuels"].map((item) => (
              <span key={item} className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 backdrop-blur-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-500 font-medium border-t border-slate-800 pt-6">
          <ShieldCheck size={20} className="text-emerald-500" />
          Internal Use Only. Strict adherence to GlobCom Ethics & Compliance required.
        </div>
      </div>

      {/* RIGHT COLUMN: Secure Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo (Only shows on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Globe className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-wide">GlobCom</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">International FZE</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Access</h2>
            <p className="text-slate-500 mt-2 text-sm">Enter your GlobCom credentials to access the ERP.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-semibold shadow-sm">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 shadow-sm font-medium placeholder:font-normal"
                  placeholder="name@globcom.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 shadow-sm font-medium placeholder:font-normal"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 group mt-4"
            >
              {loading ? "Authenticating..." : (
                <>
                  Authenticate <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center text-xs text-slate-400 font-medium">
            Unauthorized access is strictly prohibited. <br/> All connection attempts are logged.
          </div>
        </div>
      </div>

    </div>
  );
}