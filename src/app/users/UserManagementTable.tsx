"use client";

import { useState } from "react";
import { Shield, UserCheck, UserX, Settings2, Check, X, Loader2 } from "lucide-react";
import { toggleUserStatus, updateUserPermissions } from "@/actions/adminActions";

interface UserManagementTableProps {
  users: any[];
  currentUserRole: string; // Passed down from the server to enforce UI locks
}

export default function UserManagementTable({ users, currentUserRole }: UserManagementTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, current: boolean) => {
    setLoadingId(id);
    await toggleUserStatus(id, current);
    setLoadingId(null);
  };

  const handleTogglePermission = async (id: string, field: string, current: boolean) => {
    setLoadingId(id + field);
    await updateUserPermissions(id, { [field]: !current });
    setLoadingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
            <tr className="text-blue-800 text-[10px] uppercase tracking-widest">
              <th className="p-3 md:p-4 font-black">User</th>
              <th className="p-3 md:p-4 font-black">Role</th>
              <th className="p-3 md:p-4 font-black text-center">Add Deals</th>
              <th className="p-3 md:p-4 font-black text-center">Edit Deals</th>
              <th className="p-3 md:p-4 font-black text-center">Negotiate</th>
              <th className="p-3 md:p-4 font-black">Status</th>
              <th className="p-3 md:p-4 font-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm bg-white">
            {users.map((user) => {
              
              // 🔐 HIERARCHY LOGIC: Admins edit anyone. Management edits ONLY non-Admins/non-Management.
              const isTargetSuperior = user.role === "ADMIN" || user.role === "MANAGEMENT";
              const canEdit = currentUserRole === "ADMIN" ? true : (currentUserRole === "MANAGEMENT" && !isTargetSuperior);

              return (
                <tr key={user.id} className={`transition-colors group ${user.isActive ? "hover:bg-blue-50/30" : "bg-rose-50/30 opacity-70"}`}>
                  <td className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-800 text-[10px] md:text-xs shrink-0 border border-blue-200">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 md:p-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[9px] md:text-[10px] font-bold uppercase border border-slate-200 tracking-wider">
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  
                  {/* Permission Toggles */}
                  {["canAddDeals", "canEditDeals", "canNegotiate"].map((field) => (
                    <td key={field} className="p-3 md:p-4 text-center">
                      <button 
                        disabled={!!loadingId || !canEdit || user.role === "ADMIN"} // Admins always have all perms, cannot be toggled off
                        onClick={() => handleTogglePermission(user.id, field, user[field])}
                        className={`p-1.5 rounded-lg transition-all ${
                          user[field] 
                            ? "text-green-600 bg-green-50 hover:bg-green-100 border border-green-200" 
                            : "text-slate-400 bg-slate-100 hover:bg-slate-200 border border-transparent"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loadingId === user.id + field ? <Loader2 size={16} className="animate-spin" /> : (user[field] ? <Check size={16} /> : <X size={16} />)}
                      </button>
                    </td>
                  ))}

                  <td className="p-3 md:p-4">
                    <span className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${user.isActive ? "text-green-600" : "text-rose-600"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-rose-500"}`} />
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>

                  <td className="p-3 md:p-4 text-right">
                    {/* Hide the action button entirely if the user lacks hierarchical clearance or target is Admin */}
                    {user.role !== "ADMIN" && canEdit && (
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-lg border transition-all ${
                          user.isActive 
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100" 
                            : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {user.isActive ? "Suspend Access" : "Restore Access"}
                      </button>
                    )}
                    {/* If cannot edit, show a subtle locked indicator */}
                    {!canEdit && user.role !== "ADMIN" && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locked</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}