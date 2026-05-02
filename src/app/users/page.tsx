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
      <div className="flex flex-col flex-1 items-center justify-center bg-slate-50 p-4 md:p-6 min-h-full">
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm w-full">
          <ShieldAlert className="mx-auto text-rose-500 mb-4 w-10 h-10 md:w-12 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2">Only system administrators can manage user accounts and permissions.</p>
        </div>
      </div>
    );
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { lastName: "asc" }
  });

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 font-sans min-h-full">
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 md:mt-2">Manage employee permissions, deal desk access, and account status.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all w-full sm:w-auto shrink-0">
          <UserPlus size={18} /> Invite User
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <UserManagementTable users={allUsers} />
      </div>
    </div>
  );
}