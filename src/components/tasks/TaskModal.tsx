"use client";

import { useState } from "react";
import { createTask } from "@/actions/taskActions";
import { 
  X, Users, AlertCircle, CheckSquare, 
  Bug, Users as MeetingIcon, Zap, Clock, Calendar, Loader2,
  RefreshCw, BellRing
} from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
}

const ISSUE_TYPES = [
  { id: "TASK", label: "Task", icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "MEETING", label: "Meeting", icon: MeetingIcon, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "ISSUE", label: "Issue", icon: Bug, color: "text-red-600", bg: "bg-red-100" },
  { id: "FEATURE", label: "Feature", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-100" },
];

export default function TaskModal({ isOpen, onClose, users, currentUserId }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⚡ NEW: Recurring Alert State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("DAILY"); // DAILY, WEEKLY, MONTHLY
  const [recurringTime, setRecurringTime] = useState("09:00");

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setSelectedAssignees(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  // Helper to generate a basic Cron Expression and Next Run Date
  const calculateRecurringData = () => {
    if (!isRecurring) return { cron: undefined, next: undefined };

    const [hours, minutes] = recurringTime.split(":").map(Number);
    let cron = `${minutes} ${hours} * * *`; // Default Daily
    let next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (frequency === "WEEKLY") {
      cron = `${minutes} ${hours} * * 1`; // Every Monday
    } else if (frequency === "MONTHLY") {
      cron = `${minutes} ${hours} 1 * *`; // 1st of every month
    }

    // Ensure next run isn't in the past
    if (next < new Date()) {
      if (frequency === "DAILY") next.setDate(next.getDate() + 1);
      if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
      if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
    }

    return { cron, next };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    
    const { cron, next } = calculateRecurringData();

    const res = await createTask({
      title,
      description,
      type,
      priority,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      creatorId: currentUserId,
      assigneeIds: selectedAssignees,
      // ⚡ Pass Recurring Data to Server Action
      isRecurring,
      cronExpression: cron,
      nextRunAt: next,
    });

    setIsSubmitting(false);
    if (res.success) {
      setTitle("");
      setDescription("");
      setType("TASK");
      setPriority("MEDIUM");
      setEstimatedHours("");
      setDueDate("");
      setSelectedAssignees([]);
      setIsRecurring(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl shrink-0">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Create Enterprise Ticket
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Form Layout */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: Scope & Details */}
          <div className="flex-1 p-6 space-y-6 border-r border-slate-200 overflow-y-auto custom-scrollbar">
            
            {/* Issue Type Selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Category</label>
              <div className="flex flex-wrap gap-2.5">
                {ISSUE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = type === t.id;
                  return (
                    <button
                      key={t.id} type="button" onClick={() => setType(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isActive 
                          ? `border-indigo-200 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-100` 
                          : `border-slate-100 hover:bg-slate-50 text-slate-500`
                      }`}
                    >
                      <div className={`p-1 rounded-lg ${t.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      </div>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Summary */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Summary <span className="text-rose-500">*</span></label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Briefly describe the task or deposit item..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Context & Acceptance Criteria</label>
              <textarea 
                rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed context for the assigned team members..."
                className="w-full bg-slate-50 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none text-slate-800 text-sm leading-relaxed"
              />
            </div>

            {/* ⚡ NEW: Automation & Recurring Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Recurring Alert</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Auto-notify assignees on a schedule</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Frequency</label>
                    <select 
                      value={frequency} onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Every Monday</option>
                      <option value="MONTHLY">1st of Month</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alert Time</label>
                    <input 
                      type="time" value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-indigo-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <BellRing className="w-3 h-3 shrink-0" />
                    <p className="text-[10px] font-bold">This will trigger Push, In-App, and Email notifications.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Metadata & Assignments */}
          <div className="w-full md:w-80 bg-slate-50 p-6 space-y-6 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
            
            <div className="space-y-6">
              {/* Priority */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p} type="button" onClick={() => setPriority(p)}
                      className={`py-2 text-[10px] font-black rounded-xl border transition-all ${
                        priority === p 
                          ? p === "URGENT" ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20"
                          : p === "HIGH" ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                          : "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date & Estimate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <Calendar className="w-3 h-3" /> Due Date
                  </label>
                  <input 
                    type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <Clock className="w-3 h-3" /> Est. (Hrs)
                  </label>
                  <input 
                    type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                  />
                </div>
              </div>

              {/* Assignees Matrix */}
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Assignees</div>
                  <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-lg text-[8px]">{selectedAssignees.length}</span>
                </label>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white shadow-inner custom-scrollbar">
                  {users.map((user) => {
                    const isSelected = selectedAssignees.includes(user.id);
                    return (
                      <button
                        key={user.id} type="button" onClick={() => toggleAssignee(user.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left text-xs transition-all border-b border-slate-50 last:border-0 ${
                          isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                        }`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate">{user.email}</span>
                        </div>
                        {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons Pinned to Bottom Right */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col gap-2 shrink-0">
              <button 
                type="submit" disabled={isSubmitting || !title.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</> : "Publish Ticket"}
              </button>
              <button 
                type="button" onClick={onClose}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Discard Draft
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}