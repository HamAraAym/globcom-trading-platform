"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, GripVertical, MoreVertical, Trash2, Edit2, Loader2, X, CheckCircle2, Users, ListTodo, MessageSquare, Send, Plus, Trash } from "lucide-react";
import { deleteTask, updateTaskDetails, addSubtask, toggleSubtask, deleteSubtask, addTaskComment } from "@/actions/taskActions";
import { TaskStatus } from "@prisma/client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    status: TaskStatus;
    estimatedHours?: number | null;
    actualHours: number;
    assignees: { id: string; firstName: string; lastName: string }[];
    // ⚡ NEW: Types for our advanced Jira features
    subtasks?: { id: string; title: string; isDone: boolean }[];
    comments?: { id: string; text: string; createdAt: Date; author: { firstName: string; lastName: string } }[];
  };
  provided: any; 
  snapshot: any; 
  users: any[]; 
  currentUserId: string; // ⚡ NEW: Needed to log who wrote a comment
}

export default function TaskCard({ task, provided, snapshot, users, currentUserId }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    estimatedHours: task.estimatedHours?.toString() || "",
    actualHours: task.actualHours?.toString() || "0",
    assigneeIds: task.assignees.map(a => a.id)
  });
  const [isSaving, setIsSaving] = useState(false);

  // ⚡ Subtask & Comment State
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

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

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    
    const res = await updateTaskDetails(task.id, {
      title: editData.title,
      description: editData.description,
      priority: editData.priority,
      estimatedHours: editData.estimatedHours ? parseFloat(editData.estimatedHours) : undefined,
      actualHours: editData.actualHours ? parseFloat(editData.actualHours) : 0,
      assigneeIds: editData.assigneeIds
    });

    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
      setIsMenuOpen(false);
    } else {
      alert("Failed to update task.");
    }
  };

  const toggleAssignee = (id: string) => {
    setEditData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(id) 
        ? prev.assigneeIds.filter(aId => aId !== id) 
        : [...prev.assigneeIds, id]
    }));
  };

  // ⚡ New Feature Handlers
  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setIsAddingSubtask(true);
    await addSubtask(task.id, newSubtask);
    setNewSubtask("");
    setIsAddingSubtask(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    setIsAddingComment(true);
    await addTaskComment(task.id, currentUserId, newComment);
    setNewComment("");
    setIsAddingComment(false);
  };

  if (isDeleting) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center min-h-[120px] animate-pulse">
        <Loader2 className="w-5 h-5 text-rose-500 animate-spin mb-2" />
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Deleting...</span>
      </div>
    );
  }

  // Calculate metrics for the card face
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isDone).length || 0;
  const commentCount = task.comments?.length || 0;

  return (
    <>
      {/* ⚡ THE MAIN KANBAN CARD */}
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        onClick={() => setIsEditing(true)}
        className={`p-4 rounded-xl shadow-sm border bg-white group transition-all select-none relative cursor-pointer flex flex-col gap-3 ${
          snapshot.isDragging 
            ? "shadow-2xl ring-2 ring-indigo-500/80 border-transparent rotate-[2deg] scale-105 z-40" 
            : "border-slate-200 hover:border-slate-300/90 hover:shadow"
        }`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            task.priority === "URGENT" ? "bg-red-50 text-red-700 border border-red-100" :
            task.priority === "HIGH" ? "bg-orange-50 text-orange-700 border border-orange-100" :
            "bg-slate-50 text-slate-600 border border-slate-200/60"
          }`}>
            {task.priority}
          </span>
          
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
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left">
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

        {/* ⚡ NEW: Checklist Progress on Card Face */}
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

      {/* ⚡ THE BEAUTIFUL ENTERPRISE EDIT MODAL */}
      {isEditing && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} 
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Premium Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Ticket Details</h2>
                  <p className="text-xs font-medium text-slate-500">Update scope, manage subtasks, and collaborate.</p>
                </div>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
              
              {/* LEFT COLUMN: Scope & Checklists */}
              <div className="flex-1 p-6 space-y-6 lg:border-r border-slate-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                    <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none h-28 text-slate-800" />
                  </div>
                </div>

                {/* ⚡ NEW: Subtask Engine */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> Action Checklist</span>
                    {totalSubtasks > 0 && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{completedSubtasks}/{totalSubtasks} Done</span>}
                  </label>
                  
                  <div className="space-y-2">
                    {task.subtasks?.map(st => (
                      <div key={st.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors group ${st.isDone ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-100'}`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input type="checkbox" checked={st.isDone} onChange={() => toggleSubtask(st.id, !st.isDone)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                          <span className={`text-sm font-medium transition-all ${st.isDone ? "line-through text-slate-400" : "text-slate-700"}`}>{st.title}</span>
                        </label>
                        <button type="button" onClick={() => deleteSubtask(st.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())} placeholder="Add a new subtask..." className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" />
                    <button type="button" onClick={handleAddSubtask} disabled={isAddingSubtask || !newSubtask.trim()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1">
                      {isAddingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Metadata & Comments */}
              <div className="w-full lg:w-80 bg-slate-50 flex flex-col">
                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  
                  {/* Time Tracking & Priority */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Hours</label>
                        <input type="number" min="0" step="0.5" value={editData.estimatedHours} onChange={(e) => setEditData({...editData, estimatedHours: e.target.value})} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actual</label>
                        <input type="number" min="0" step="0.5" value={editData.actualHours} onChange={(e) => setEditData({...editData, actualHours: e.target.value})} className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-indigo-50 font-bold text-indigo-900 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                      <select value={editData.priority} onChange={(e) => setEditData({...editData, priority: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Assignees */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <Users className="w-3.5 h-3.5" /> Assignees
                    </label>
                    <div className="space-y-1">
                      {users?.map(user => {
                        const isSelected = editData.assigneeIds.includes(user.id);
                        return (
                          <button type="button" key={user.id} onClick={() => toggleAssignee(user.id)} className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left ${isSelected ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-white border-transparent hover:bg-slate-100 text-slate-700'}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                                {user.firstName[0]}{user.lastName[0]}
                              </div>
                              <span className="text-xs font-medium">{user.firstName} {user.lastName}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ⚡ NEW: Live Activity Feed */}
                  <div className="pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      <MessageSquare className="w-3.5 h-3.5" /> Activity Feed
                    </label>
                    <div className="space-y-3 mb-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {task.comments?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No comments yet.</p>
                      ) : (
                        task.comments?.map(comment => (
                          <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-900">{comment.author.firstName} {comment.author.lastName}</span>
                              <span className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex items-end gap-2 bg-white p-1.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 max-h-24 min-h-[36px] bg-transparent text-sm px-2 py-1.5 focus:outline-none resize-none" />
                      <button type="button" onClick={handleAddComment} disabled={isAddingComment || !newComment.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0">
                        {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Save Button Sidebar Footer */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                  <button type="button" onClick={handleSaveEdit} disabled={isSaving} className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : "Save Ticket Details"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}