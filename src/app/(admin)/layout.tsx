import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* The new dedicated Admin Sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <AdminSidebar />
      </div>
      
      {/* Main Admin Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}