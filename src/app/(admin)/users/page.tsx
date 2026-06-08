import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ShieldAlert, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import UserManagementTable from "./UserManagementTable";

export default async function UsersPage() {
  const session = await getServerSession();
  
  const dbUser = await prisma.user.findUnique({
    where: { email: session?.user?.email || "" },
    select: { role: true }
  });

  // 🔐 RBAC: Allow both ADMIN and MANAGEMENT to access this page
  if (dbUser?.role !== "ADMIN" && dbUser?.role !== "MANAGEMENT") {
    return (
      <div 
        className="flex flex-col flex-1 items-center justify-center bg-slate-50 p-4 md:p-6 min-h-[100dvh]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm w-full">
          <ShieldAlert className="mx-auto text-rose-500 mb-4 w-10 h-10 md:w-12 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2">Only Administrators and Management can view the user directory.</p>
        </div>
      </div>
    );
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { lastName: "asc" }
  });

  return (
    <div 
      // ⚡ FIX: Added safe-area padding so the text clears the iPhone notch
      className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 font-sans min-h-[100dvh]"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 md:mt-2">Manage employee permissions, deal desk access, and account status.</p>
        </div>
        
        {/* ⚡ FIX: Added a Mobile Escape Hatch */}
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm w-full sm:w-auto"
        >
          <LayoutDashboard size={16} /> Back to Hub
        </Link>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Pass the current user's role down to enforce edit restrictions */}
        <UserManagementTable users={allUsers} currentUserRole={dbUser.role} />
      </div>
    </div>
  );
}