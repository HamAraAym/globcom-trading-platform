import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import { getGlobalSettings } from "@/actions/adminActions"; 
import { Settings, ShieldCheck, LayoutDashboard } from "lucide-react";
import Link from "next/link";

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
    }
  });

  // Kick out unauthenticated users
  if (!user) {
    redirect("/login");
  }

  // 3. Strict Security Lock: Only Admin & Management can access Global Settings
  if (user.role !== "ADMIN" && user.role !== "MANAGEMENT") {
    redirect("/"); // Safely bounce unauthorized personnel back to the Global Hub
  }

  // 4. Fetch Global System Settings
  const systemSettings = await getGlobalSettings();

  return (
    <div 
      // ⚡ FIX: Added min-h-[100dvh] and safe-area padding for the iOS Notch
      className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 bg-slate-50 min-h-[100dvh] overflow-x-hidden"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
      }}
    >
      
      {/* Page Header */}
      <div className="max-w-5xl mx-auto w-full mb-6 md:mb-8 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
            <Settings size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-blue-600 shrink-0" />
              Manage enterprise profile and global config.
            </p>
          </div>
        </div>

        {/* ⚡ FIX: Added a Mobile Escape Hatch */}
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm w-full sm:w-auto shrink-0"
        >
          <LayoutDashboard size={16} /> Back to Hub
        </Link>
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