"use client";

import { updateKycStatus } from "@/actions/buyerActions";

export default function KycStatusUpdater({ clientId, currentStatus }: { clientId: string, currentStatus: string }) {
  return (
    <form action={updateKycStatus.bind(null, clientId)} className="inline-flex items-center">
      <select 
        name="kycStatus" 
        defaultValue={currentStatus}
        onChange={(e) => e.target.form?.requestSubmit()} // This requires the "use client" directive!
        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
          currentStatus === "VERIFIED" ? "text-emerald-700 bg-emerald-100 border-emerald-200" :
          currentStatus === "PENDING" ? "text-amber-700 bg-amber-100 border-amber-200" :
          "text-rose-700 bg-rose-100 border-rose-200"
        }`}
      >
        <option value="PENDING">Pending Docs</option>
        <option value="VERIFIED">Verified</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </form>
  );
}