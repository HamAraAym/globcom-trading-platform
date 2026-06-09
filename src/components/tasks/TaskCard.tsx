"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, GripVertical, MoreVertical, Trash2, Edit2, Loader2, ListTodo, MessageSquare } from "lucide-react";
import { deleteTask } from "@/actions/taskActions";
import { TaskStatus } from "@prisma/client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    status: TaskStatus;
    type: string;
    estimatedHours?: number | null;
    actualHours: number;
    isRecurring: boolean;
    cronExpression?: string | null;
    assignees: { id: string; firstName: string; lastName: string }[];
    subtasks?: { id: string; title: string; isDone: boolean }[];
    comments?: { id: string; text: string; createdAt: Date; author: { firstName: string; lastName: string } }[];
  };
  provided: any; 
  snapshot: any; 
  users: any[]; 
  currentUserId: string; 
  onEdit: (taskData: any) => void; // ⚡ NEW: We pass the click up to the KanbanBoard!
}

export default function TaskCard({ task, provided, snapshot, users, currentUserId, onEdit }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
    setIsDeleting(true);
    const res = await deleteTask(task.id);
    if (!res.success) {
      alert("Failed to delete task.");
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  if (isDeleting) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center min-h-[120px] animate-pulse">
        <Loader2 className="w-5 h-5 text-rose-500 animate-spin mb-2" />
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Deleting...</span>
      </div>
    );
  }

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isDone).length || 0;
  const commentCount = task.comments?.length || 0;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      // ⚡ TRIGGER: Open the central Smart Modal instead of a local edit state
      onClick={() => onEdit(task)}
      className={`p-4 rounded-xl shadow-sm border bg-white group transition-all select-none relative cursor-pointer flex flex-col gap-3 ${
        snapshot.isDragging 
          ? "shadow-2xl ring-2 ring-indigo-500/80 border-transparent rotate-[2deg] scale-105 z-40" 
          : "border-slate-200 hover:border-slate-300/90 hover:shadow"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            task.priority === "URGENT" ? "bg-red-50 text-red-700 border border-red-100" :
            task.priority === "HIGH" ? "bg-orange-50 text-orange-700 border border-orange-100" :
            "bg-slate-50 text-slate-600 border border-slate-200/60"
          }`}>
            {task.priority}
          </span>
          {task.isRecurring && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              Recurring
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
              className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button onClick={(e) => { e.stopPropagation(); onEdit(task); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Ticket
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>

          <div {...provided.dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-slate-900 leading-snug tracking-tight mb-1 pr-4">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {totalSubtasks > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><ListTodo className="w-3 h-3 text-slate-400" /> Checklist</span>
            <span className="text-slate-700 font-semibold">{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${completedSubtasks === totalSubtasks ? "bg-emerald-500" : "bg-indigo-500"}`} 
              style={{ width: `${Math.min((completedSubtasks / totalSubtasks) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              <MessageSquare className="w-3 h-3" /> {commentCount}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.actualHours}/{task.estimatedHours || 0}h
          </span>
        </div>
        
        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignees.map((user) => (
            <div key={user.id} className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white ring-1 ring-slate-200 shadow-sm" title={`${user.firstName} ${user.lastName}`}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}