import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, UserCircle, Mail, Shield } from "lucide-react";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function PersonalProfilePage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  // Fetch only the personal data for this specific user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) redirect("/login");

  return (
    <div 
      // ⚡ FIX: Added safe-area padding to push content below the Dynamic Island
      className="min-h-screen bg-slate-50 px-4 md:px-12"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)'
      }}
    >
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <UserCircle className="text-blue-600 w-8 h-8" />
              Personal Profile
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Manage your personal account details, security credentials, and document headers.
            </p>
          </div>
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm shrink-0"
          >
            <LayoutDashboard size={16} /> Back to Hub
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Read-Only Identity Block */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-3xl shadow-inner border border-blue-200 shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Mail size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{user.email}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 shrink-0">
                    <Shield size={12} /> {user.role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* ⚡ The Interactive Form Component */}
            <ProfileForm user={user} />

          </div>
        </div>
      </div>
    </div>
  );
}