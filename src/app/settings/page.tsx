import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import { getGlobalSettings } from "@/actions/adminActions"; 

export const metadata = {
  title: "Account Settings | GlobCom CRM",
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

  if (!user) {
    redirect("/login");
  }

  // 3. Fetch Global System Settings (Required for the Admin form)
  const systemSettings = await getGlobalSettings();

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-10 bg-slate-50 min-h-full">
      <div className="max-w-4xl mx-auto w-full mb-6 md:mb-8 shrink-0">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1 md:mt-2">Manage your enterprise profile and formal document branding.</p>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col pb-6">
        <SettingsForm user={user} systemSettings={systemSettings} />
      </div>
    </div>
  );
}