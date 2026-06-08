import WorkspaceSidebar from "@/components/tasks/WorkspaceSidebar";
import { Menu, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { getGlobalSettings } from "@/actions/adminActions";
import NotificationBell from "@/components/NotificationBell";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  // Fetch global branding securely on the server
  const systemSettings = await getGlobalSettings();
  const brandName = systemSettings?.companyName || "GlobCom Workspace";
  const brandLogo = systemSettings?.companyLogoUrl;

  // Fetch current user for the topbar avatar
  const session = await getServerSession();
  const currentUser = session?.user?.email 
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { firstName: true, lastName: true } })
    : null;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50">
      
      {/* 📱 Mobile Top Bar (Only visible on phones) */}
      <div className="md:hidden flex-shrink-0 bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800 z-50">
        <Link href="/" className="flex items-center gap-3 group">
          {brandLogo ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-indigo-500 transition-colors">
              {brandName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col overflow-hidden max-w-[140px]">
            <span className="font-bold text-sm leading-tight text-slate-100 group-hover:text-white transition-colors truncate">
              {brandName}
            </span>
            <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold tracking-wider uppercase mt-0.5">
              <LayoutDashboard className="w-3 h-3" /> Global Hub
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-1">
            <Menu className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* 💻 Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 h-full z-10">
        <WorkspaceSidebar brandName={brandName} brandLogo={brandLogo} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col w-full relative z-0 bg-slate-50">
        
        {/* ⚡ 💻 Desktop Global Topbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 shrink-0 items-center justify-end px-6 z-50">
          <div className="flex items-center gap-5">
            
            {/* The Bell is now properly aligned in the layout */}
            <NotificationBell variant="light" />
            
            {/* Divider */}
            <div className="w-px h-6 bg-slate-200"></div>

            {/* Global User Profile Indicator */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Active</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white ring-1 ring-slate-200">
                {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : "ME"}
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-hidden flex flex-col w-full">
          {children}
        </div>

      </main>
    </div>
  );
}