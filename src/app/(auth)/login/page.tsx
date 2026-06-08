"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Catch URL errors if NextAuth redirects instead of returning the error directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, []);

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
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* LEFT COLUMN: Corporate Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/30 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[100px]" />
        </div>
        
        <Globe className="absolute -right-24 -bottom-24 text-slate-800/40 z-0" size={600} strokeWidth={0.5} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
              <Globe className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">GlobCom</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">International FZE</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
            Global Commodity <br /> Trading Network
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-10 font-medium">
            Empowering global industries by delivering reliable, efficient, and ethical trading solutions across emerging markets.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {["Fertilizers", "Petrochemicals", "Metals", "Fuels"].map((item) => (
              <span key={item} className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-sm font-semibold text-slate-300 backdrop-blur-md">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-500 font-medium border-t border-slate-800/60 pt-8">
          <ShieldCheck size={22} className="text-emerald-500/80" />
          <p>Internal Use Only. Strict adherence to GlobCom Ethics & Compliance required.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Secure Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-slate-50/50">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo (Only shows on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Globe className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-wide">GlobCom</h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">International FZE</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Secure Sign In</h2>
            <p className="text-slate-500 mt-2.5 text-sm font-medium">Enter your credentials to access the enterprise portal.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-[3px] focus:ring-blue-600/10 focus:border-blue-600 transition-all text-slate-900 shadow-sm font-semibold placeholder:font-normal placeholder:text-slate-400"
                  placeholder="name@globcom.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-[3px] focus:ring-blue-600/10 focus:border-blue-600 transition-all text-slate-900 shadow-sm font-semibold placeholder:font-normal placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all flex justify-center items-center gap-2.5 disabled:opacity-80 disabled:cursor-wait group mt-8"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-slate-400" /> 
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

          <div className="mt-14 text-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
              Unauthorized access is strictly prohibited. <br/> All connection attempts are logged.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}