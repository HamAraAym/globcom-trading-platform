import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Users, ShieldAlert, UserPlus } from "lucide-react";
import UserManagementTable from "./UserManagementTable";

export default async function UsersPage() {
  const session = await getServerSession();
  
  const dbUser = await prisma.user.findUnique({
    where: { email: session?.user?.email || "" },
    select: { role: true }
  });

  if (dbUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">Only system administrators can manage user accounts and permissions.</p>
        </div>
      </div>
    );
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { lastName: "asc" }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-2">Manage employee permissions, deal desk access, and account status.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
          <UserPlus size={18} /> Invite User
        </button>
      </div>

      <UserManagementTable users={allUsers} />
    </div>
  );
}