"use client";

import { useState } from "react";
import { Shield, UserCheck, UserX, Settings2, Check, X, Loader2, MailPlus, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { toggleUserStatus, updateUserPermissions } from "@/actions/adminActions";
import { sendUserInvite } from "@/actions/userActions"; 

interface UserManagementTableProps {
  users: any[];
  currentUserRole: string; 
}

export default function UserManagementTable({ users, currentUserRole }: UserManagementTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // --- INVITATION STATE ---
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("BUYER_REP");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState("");

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      setLoadingId(id);
      await toggleUserStatus(id, current);
    } catch (error: any) {
      alert("Failed to update status. Database might be out of sync.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleTogglePermission = async (id: string, field: string, current: boolean) => {
    try {
      setLoadingId(id + field);
      await updateUserPermissions(id, { [field]: !current });
    } catch (error: any) {
      console.error(error);
      alert(`Failed to update ${field}. Did you push the latest database schema to production?`);
    } finally {
      setLoadingId(null);
    }
  };

  // --- INVITATION HANDLER ---
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus("loading");
    setInviteMsg("");

    const res = await sendUserInvite(inviteEmail, inviteRole as any);

    if (res.success) {
      setInviteStatus("success");
      setInviteMsg("Invitation sent successfully!");
      setTimeout(() => {
        setIsInviteOpen(false);
        setInviteStatus("idle");
        setInviteEmail("");
        setInviteRole("BUYER_REP");
      }, 2000);
    } else {
      setInviteStatus("error");
      setInviteMsg(res.error || "Failed to send invitation.");
    }
  };

  const canEdit = currentUserRole === "ADMIN";

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col h-full relative">
        
        {/* HEADER WITH INVITE BUTTON */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Team Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {canEdit ? "Manage access, permissions, and roles." : "View team members and access levels."}
            </p>
          </div>
          
          {canEdit && (
            <button 
              onClick={() => setIsInviteOpen(true)}
              className="bg-black text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <MailPlus size={16} />
              <span className="hidden md:inline">Invite Member</span>
              <span className="md:hidden">Invite</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-blue-800 text-[10px] uppercase tracking-widest">
                <th className="p-3 md:p-4 font-black">User</th>
                <th className="p-3 md:p-4 font-black">Role</th>
                {/* Trading Permissions */}
                <th className="p-3 md:p-4 font-black text-center border-l border-slate-200">Add Deals</th>
                <th className="p-3 md:p-4 font-black text-center">Edit Deals</th>
                <th className="p-3 md:p-4 font-black text-center">Negotiate</th>
                {/* Task Permissions */}
                <th className="p-3 md:p-4 font-black text-center border-l border-slate-200">Create Tasks</th>
                <th className="p-3 md:p-4 font-black text-center">Edit Tasks</th>
                <th className="p-3 md:p-4 font-black text-center text-rose-600">Delete Tasks</th>
                
                <th className="p-3 md:p-4 font-black border-l border-slate-200">Status</th>
                <th className="p-3 md:p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm bg-white">
              {users.map((user) => {
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
                    
                    {/* Trading Permission Toggles */}
                    {["canAddDeals", "canEditDeals", "canNegotiate"].map((field, i) => (
                      <td key={field} className={`p-3 md:p-4 text-center ${i === 0 ? "border-l border-slate-100" : ""}`}>
                        <button 
                          disabled={!!loadingId || !canEdit || user.role === "ADMIN"} 
                          onClick={() => handleTogglePermission(user.id, field, user[field])}
                          className={`p-1.5 rounded-lg transition-all ${
                            user[field] 
                              ? "text-green-600 bg-green-50 border border-green-200" 
                              : "text-slate-400 bg-slate-100 border border-transparent"
                          } ${canEdit && user.role !== "ADMIN" ? "hover:scale-110 cursor-pointer" : "cursor-default opacity-50"} disabled:cursor-default`}
                        >
                          {loadingId === user.id + field ? <Loader2 size={16} className="animate-spin" /> : (user[field] ? <Check size={16} /> : <X size={16} />)}
                        </button>
                      </td>
                    ))}

                    {/* Task Permission Toggles */}
                    {["canCreateTasks", "canEditTasks", "canDeleteTasks"].map((field, i) => {
                      const isDestructive = field === "canDeleteTasks";
                      return (
                        <td key={field} className={`p-3 md:p-4 text-center ${i === 0 ? "border-l border-slate-100" : ""}`}>
                          <button 
                            disabled={!!loadingId || !canEdit || user.role === "ADMIN"} 
                            onClick={() => handleTogglePermission(user.id, field, user[field])}
                            className={`p-1.5 rounded-lg transition-all ${
                              user[field] 
                                ? (isDestructive ? "text-rose-600 bg-rose-50 border border-rose-200" : "text-green-600 bg-green-50 border border-green-200")
                                : "text-slate-400 bg-slate-100 border border-transparent"
                            } ${canEdit && user.role !== "ADMIN" ? "hover:scale-110 cursor-pointer" : "cursor-default opacity-50"} disabled:cursor-default`}
                          >
                            {loadingId === user.id + field ? <Loader2 size={16} className="animate-spin" /> : (user[field] ? <Check size={16} /> : <X size={16} />)}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-3 md:p-4 border-l border-slate-100">
                      <span className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${user.isActive ? "text-green-600" : "text-rose-600"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-rose-500"}`} />
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="p-3 md:p-4 text-right">
                      {canEdit && user.role !== "ADMIN" ? (
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
                      ) : !canEdit ? (
                        <span className="text-[10px] flex items-center justify-end gap-1 font-bold text-slate-400 uppercase tracking-widest">
                          <Shield size={12} /> Read Only
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MODAL OVERLAY */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Invite Team Member</h3>
              <p className="text-sm text-slate-500 mt-1">Send a secure setup link directly to their inbox.</p>
            </div>
            
            <form onSubmit={handleSendInvite} className="p-6 flex flex-col gap-5">
              
              {inviteStatus === "success" && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-bold rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" /> {inviteMsg}
                </div>
              )}

              {inviteStatus === "error" && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" /> {inviteMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@harjot.ae"
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assign Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
                >
                  <option value="BUYER_REP">Buyer Representative</option>
                  <option value="TRADING_REP">Trading Representative</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold p-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={inviteStatus === "loading"}
                  className="flex-1 bg-black text-white font-bold p-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {inviteStatus === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {inviteStatus === "loading" ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}