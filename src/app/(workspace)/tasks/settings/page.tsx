import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Settings, Bell, Eye, ShieldAlert, Save, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TaskSettingsPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  // Fetch current user details
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { firstName: true, lastName: true, email: true, role: true }
  });

  if (!currentUser) redirect("/login");

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 md:px-8 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Manage your personal preferences and notification rules.</p>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-4xl space-y-8">
        
        {/* Profile Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</h2>
            <p className="text-sm text-slate-500 font-medium">{currentUser.email}</p>
            <span className="inline-block mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-widest">
              Role: {currentUser.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Bell className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Email on Assignment</p>
                  <p className="text-[11px] text-slate-500">Receive an email when a task is assigned to you.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
              </label>
              <div className="h-px bg-slate-100 w-full" />
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Daily Digest</p>
                  <p className="text-[11px] text-slate-500">Get a morning summary of due tasks.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
              </label>
            </div>
          </div>

          {/* Display Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Eye className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Display</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Default Board Filter</label>
                <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700">
                  <option>Show All Tasks</option>
                  <option>Only My Tasks</option>
                  <option>High Priority Only</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Time Format</label>
                <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700">
                  <option>12-Hour (AM/PM)</option>
                  <option>24-Hour</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
}