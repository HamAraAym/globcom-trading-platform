"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { updateDealStatus } from "@/actions/chatActions";

const STATUSES = [
  { id: "DRAFT", label: "DRAFT", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { id: "ACTIVE", label: "ACTIVE", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "UNDER_NEGOTIATION", label: "UNDER NEGOTIATION", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "SENT_TO_BUYER", label: "SENT TO BUYER", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "CLOSED_WON", label: "CLOSED WON", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "CLOSED_LOST", label: "CLOSED LOST", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "CANCELLED", label: "CANCELLED", color: "bg-slate-800 text-slate-300 border-slate-700" },
];

interface Props {
  itemId: string;
  currentStatus: string;
  type: "DEMAND" | "SUPPLY";
  chatId: string;
  canEdit: boolean;
}

export default function DealStatusManager({ itemId, currentStatus, type, chatId, canEdit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeStatus = STATUSES.find(s => s.id === currentStatus) || STATUSES[1];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setIsUpdating(true);
    setIsOpen(false);
    try {
      await updateDealStatus(itemId, type, newStatus, chatId);
    } catch (error) {
      console.error("Failed to update status");
      alert("Failed to update deal status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canEdit) {
    return (
      <span className={`px-2 md:px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-bold tracking-widest border ${activeStatus.color} shadow-sm shrink-0 whitespace-nowrap`}>
        {activeStatus.label}
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold tracking-widest border shadow-sm transition-all hover:opacity-80 ${activeStatus.color} ${isUpdating ? "opacity-50 cursor-not-allowed" : ""} shrink-0 whitespace-nowrap`}
      >
        {isUpdating ? <Loader2 size={12} className="animate-spin md:w-3.5 md:h-3.5" /> : activeStatus.label}
        <ChevronDown size={12} className="md:w-3.5 md:h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 md:w-48 bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="bg-slate-50 px-3 md:px-4 py-2 border-b border-slate-100 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Update Phase
          </div>
          <div className="p-1 md:p-1.5 flex flex-col gap-0.5 md:gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStatusChange(s.id)}
                className={`flex items-center justify-between px-3 py-2.5 md:py-2 rounded-lg text-xs font-bold transition-colors ${
                  currentStatus === s.id ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {s.label}
                {currentStatus === s.id && <Check size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}