"use client";

import { useState } from "react";
import { createTask } from "@/actions/taskActions";
import { 
  X, Users, AlertCircle, CheckSquare, 
  Bug, Users as MeetingIcon, Zap, Clock, Calendar, Loader2 
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

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setSelectedAssignees(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const res = await createTask({
      title,
      description,
      type,
      priority,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      creatorId: currentUserId,
      assigneeIds: selectedAssignees,
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Create Issue
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Form Layout */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          
          {/* LEFT COLUMN: Scope & Details */}
          <div className="flex-1 p-6 space-y-6 border-r border-slate-200">
            
            {/* Issue Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Issue Type</label>
              <div className="flex flex-wrap gap-3">
                {ISSUE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = type === t.id;
                  return (
                    <button
                      key={t.id} type="button" onClick={() => setType(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        isActive 
                          ? `border-slate-300 bg-white shadow-sm ring-1 ring-slate-200` 
                          : `border-transparent hover:bg-slate-100 text-slate-500`
                      }`}
                    >
                      <div className={`p-1 rounded-md ${t.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      </div>
                      <span className={isActive ? "text-slate-900" : ""}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Summary <span className="text-red-500">*</span></label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-900 placeholder:font-normal"
              />
            </div>

            {/* Description */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, acceptance criteria, or meeting agendas..."
                className="w-full h-40 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none text-slate-800"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Metadata & Assignments */}
          <div className="w-full md:w-80 bg-slate-50 p-6 space-y-6 flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p} type="button" onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-bold rounded-md border transition-all ${
                        priority === p 
                          ? p === "URGENT" ? "bg-red-50 text-red-700 border-red-200 shadow-sm"
                          : p === "HIGH" ? "bg-orange-50 text-orange-700 border-orange-200 shadow-sm"
                          : "bg-white text-slate-800 border-slate-300 shadow-sm"
                          : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50"
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
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                  </label>
                  <input 
                    type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Est. (Hours)
                  </label>
                  <input 
                    type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              {/* Assignees Matrix */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> Assignees</div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{selectedAssignees.length} selected</span>
                </label>
                <div className="border border-slate-300 rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-white shadow-inner">
                  {users.map((user) => {
                    const isSelected = selectedAssignees.includes(user.id);
                    return (
                      <button
                        key={user.id} type="button" onClick={() => toggleAssignee(user.id)}
                        className={`w-full flex items-center gap-3 p-2.5 text-left text-xs transition-all border-b border-slate-100 last:border-0 ${
                          isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`font-semibold truncate ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                        </div>
                        {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons Pinned to Bottom Right */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-2">
              <button 
                type="button" onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg transition-all shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : "Create Issue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}