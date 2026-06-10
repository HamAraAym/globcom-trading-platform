"use client";

import { useState, useEffect } from "react";
import { createTask, updateTaskDetails } from "@/actions/taskActions";
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

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  priority: string;
  estimatedHours?: number | null;
  dueDate?: Date | null;
  assignees: { id: string }[];
  isRecurring: boolean;
  cronExpression?: string | null;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  initialData?: TaskData | null;
}

const ISSUE_TYPES = [
  { id: "TASK", label: "Task", icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "MEETING", label: "Meeting", icon: MeetingIcon, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "ISSUE", label: "Issue", icon: Bug, color: "text-red-600", bg: "bg-red-100" },
  { id: "FEATURE", label: "Feature", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-100" },
];

export default function TaskModal({ isOpen, onClose, users, currentUserId, initialData }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("DAILY"); 
  const [recurringTime, setRecurringTime] = useState("09:00");
  const [dayOfWeek, setDayOfWeek] = useState("1"); 
  const [dayOfMonth, setDayOfMonth] = useState("15"); 

  useEffect(() => {
    if (initialData && isOpen) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setType(initialData.type);
      setPriority(initialData.priority);
      setEstimatedHours(initialData.estimatedHours ? initialData.estimatedHours.toString() : "");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "");
      setSelectedAssignees(initialData.assignees.map(a => a.id));
      
      setIsRecurring(initialData.isRecurring);
      
      if (initialData.isRecurring && initialData.cronExpression) {
        const parts = initialData.cronExpression.split(" ");
        if (parts.length === 5) {
          setRecurringTime(`${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')}`);
          if (parts[4] !== "*") { 
            setFrequency("WEEKLY"); 
            setDayOfWeek(parts[4]); 
          } else if (parts[2] !== "*") { 
            setFrequency("MONTHLY"); 
            setDayOfMonth(parts[2]); 
          } else { 
            setFrequency("DAILY"); 
          }
        }
      }
    } else if (isOpen && !initialData) {
      setTitle(""); setDescription(""); setType("TASK"); setPriority("MEDIUM");
      setEstimatedHours(""); setDueDate(""); setSelectedAssignees([]);
      setIsRecurring(false); setFrequency("DAILY"); setRecurringTime("09:00");
    }
  }, [initialData, isOpen]);

  // Prevent background scrolling on iOS
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setSelectedAssignees(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const calculateRecurringData = () => {
    if (!isRecurring) return { cron: undefined, next: undefined };

    const [hours, minutes] = recurringTime.split(":").map(Number);
    let cron = `${minutes} ${hours} * * *`; 
    let next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (frequency === "WEEKLY") {
      cron = `${minutes} ${hours} * * ${dayOfWeek}`; 
      next.setDate(next.getDate() + ((parseInt(dayOfWeek) + 7 - next.getDay()) % 7));
      if (next <= new Date()) next.setDate(next.getDate() + 7);

    } else if (frequency === "MONTHLY") {
      cron = `${minutes} ${hours} ${dayOfMonth} * *`; 
      next.setDate(parseInt(dayOfMonth));
      if (next <= new Date()) next.setMonth(next.getMonth() + 1);
    } else {
      if (next <= new Date()) next.setDate(next.getDate() + 1);
    }

    return { cron, next };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const { cron, next } = calculateRecurringData();

    if (initialData) {
      await updateTaskDetails(initialData.id, {
        title, description, priority,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        assigneeIds: selectedAssignees,
        isRecurring, cronExpression: cron, nextRunAt: next,
      });
    } else {
      await createTask({
        title, description, type, priority,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        creatorId: currentUserId, assigneeIds: selectedAssignees,
        isRecurring, cronExpression: cron, nextRunAt: next,
      });
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    // ⚡ FIX: Use items-end on mobile for Bottom Sheet styling, DVH for height limits
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      
      <div className="bg-white w-full max-w-4xl h-[95dvh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            {initialData ? "Edit Enterprise Ticket" : "Create Enterprise Ticket"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* ⚡ FIX: Single wrapper for scrolling, stops nested squishing */}
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto custom-scrollbar">
            
            {/* LEFT COLUMN */}
            <div className="flex-1 p-5 md:p-6 space-y-6 md:border-r border-slate-200 shrink-0">
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Category</label>
                <div className="flex flex-wrap gap-2.5">
                  {ISSUE_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isActive = type === t.id;
                    return (
                      <button
                        key={t.id} type="button" 
                        onClick={() => !initialData && setType(t.id)}
                        disabled={!!initialData}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isActive 
                            ? `border-indigo-200 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-100` 
                            : `border-slate-100 bg-white text-slate-500 ${!initialData && 'hover:bg-slate-50'}`
                        } ${initialData && !isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
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

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Summary <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Briefly describe the task or deposit item..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Context & Acceptance Criteria</label>
                <textarea 
                  rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none text-slate-800 text-sm leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">Recurring Schedule</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Auto-recreate and notify assignees</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Frequency</label>
                      <select 
                        value={frequency} onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="DAILY">Every Day</option>
                        <option value="WEEKLY">Specific Day of Week</option>
                        <option value="MONTHLY">Specific Date of Month</option>
                      </select>
                    </div>

                    {frequency === "WEEKLY" && (
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Which Day?</label>
                        <select 
                          value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                          <option value="0">Sunday</option>
                        </select>
                      </div>
                    )}

                    {frequency === "MONTHLY" && (
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Which Date?</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                          <span className="text-xs font-bold text-slate-400">The</span>
                          <input 
                            type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
                            className="w-12 outline-none text-xs font-bold text-center"
                          />
                          <span className="text-xs font-bold text-slate-400">of the month</span>
                        </div>
                      </div>
                    )}

                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alert Time</label>
                      <input 
                        type="time" value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-indigo-600 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      <BellRing className="w-4 h-4 shrink-0" />
                      <p className="text-[10px] font-bold">This will trigger Push, In-App, and Email notifications automatically.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full md:w-80 bg-slate-50 p-5 md:p-6 space-y-6 shrink-0">
              
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                  />
                </div>
              </div>

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
                        </div>
                        {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* ⚡ FIX: Global Pinned Footer */}
          <div 
            className="px-4 md:px-6 py-4 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 shrink-0" 
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button 
              type="button" onClick={onClose}
              className="px-4 py-3 sm:py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isSubmitting || !title.trim()}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all w-full sm:w-auto shrink-0"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (initialData ? "Save Changes" : "Publish Ticket")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}