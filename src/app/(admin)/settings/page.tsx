import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import { getGlobalSettings } from "@/actions/adminActions"; 
import { Settings, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "System Settings | GlobCom Enterprise",
};

export default async function SettingsPage() {
  // 1. Secure Route Verification
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  // 2. Fetch User Profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      letterheadUrl: true,
    }
  });

  // Kick out unauthenticated users
  if (!user) {
    redirect("/login");
  }

  // ⚡ 3. Strict Security Lock: Only Admin & Management can access Global Settings
  if (user.role !== "ADMIN" && user.role !== "MANAGEMENT") {
    redirect("/"); // Safely bounce unauthorized personnel back to the Global Hub
  }

  // 4. Fetch Global System Settings
  const systemSettings = await getGlobalSettings();

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 bg-slate-50 min-h-full overflow-x-hidden">
      
      {/* Page Header */}
      <div className="max-w-5xl mx-auto w-full mb-6 md:mb-8 shrink-0 flex items-center gap-3 md:gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
          <Settings size={24} className="md:w-7 md:h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-blue-600 shrink-0" />
            Manage your enterprise profile, formal document branding, and global configuration.
          </p>
        </div>
      </div>

      {/* Main Settings Form Container */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col pb-6">
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full h-full">
          <SettingsForm user={user} systemSettings={systemSettings} />
        </div>
      </div>
      
    </div>
  );
}