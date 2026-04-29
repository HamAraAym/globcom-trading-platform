import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your enterprise profile and formal document branding.</p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}