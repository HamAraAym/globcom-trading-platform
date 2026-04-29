"use client";

import { useState } from "react";
import { Shield, UserCheck, UserX, Settings2, Check, X, Loader2 } from "lucide-react";
import { toggleUserStatus, updateUserPermissions } from "@/actions/adminActions";

export default function UserManagementTable({ users }: { users: any[] }) {
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
            <th className="p-4 font-bold">User</th>
            <th className="p-4 font-bold">Role</th>
            <th className="p-4 font-bold text-center">Add Deals</th>
            <th className="p-4 font-bold text-center">Edit Deals</th>
            <th className="p-4 font-bold text-center">Negotiate</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {users.map((user) => (
            <tr key={user.id} className={`transition-colors ${user.isActive ? "hover:bg-slate-50" : "bg-rose-50/30 opacity-70"}`}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                  {user.role.replace("_", " ")}
                </span>
              </td>
              
              {/* Permission Toggles */}
              {["canAddDeals", "canEditDeals", "canNegotiate"].map((field) => (
                <td key={field} className="p-4 text-center">
                  <button 
                    disabled={!!loadingId || user.role === "ADMIN"}
                    onClick={() => handleTogglePermission(user.id, field, user[field])}
                    className={`p-1.5 rounded-lg transition-all ${user[field] ? "text-emerald-600 bg-emerald-50" : "text-slate-300 bg-slate-100"}`}
                  >
                    {loadingId === user.id + field ? <Loader2 size={16} className="animate-spin" /> : (user[field] ? <Check size={16} /> : <X size={16} />)}
                  </button>
                </td>
              ))}

              <td className="p-4">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${user.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {user.isActive ? "Active" : "Suspended"}
                </span>
              </td>

              <td className="p-4 text-right">
                {user.role !== "ADMIN" && (
                  <button 
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      user.isActive ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {user.isActive ? "Suspend Access" : "Restore Access"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}