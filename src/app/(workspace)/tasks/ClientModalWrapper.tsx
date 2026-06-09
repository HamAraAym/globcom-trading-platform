"use client";

import { useState, useMemo } from "react";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TaskModal from "@/components/tasks/TaskModal";
import { Plus, Search, SlidersHorizontal, UserCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";

// Strict typing to replace 'any'
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: string; // ⚡ Added to fix Vercel build
  priority: string;
  status: TaskStatus;
  estimatedHours?: number | null;
  actualHours: number;
  dueDate?: Date | null; // ⚡ Added to fix Vercel build
  isRecurring: boolean; // ⚡ Added to fix Vercel build
  cronExpression?: string | null; // ⚡ Added to fix Vercel build
  assignees: { id: string; firstName: string; lastName: string }[];
  subtasks?: { id: string; title: string; isDone: boolean }[];
  comments?: { id: string; text: string; createdAt: Date; author: { firstName: string; lastName: string } }[];
}

interface ClientModalWrapperProps {
  tasks: Task[];
  users: User[];
  currentUserId: string;
  userRole: string;
}

export default function ClientModalWrapper({ tasks: initialTasks, users, currentUserId, userRole }: ClientModalWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ⚡ Advanced Jira Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // Instant Client-Side Filtering Logic
  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      // 1. Match Search (Title or Description)
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Match Priority
      const matchesPriority = selectedPriority === "ALL" || task.priority === selectedPriority;
      
      // 3. Match Assigned User
      const matchesUser = selectedUser === "ALL" || task.assignees.some((u) => u.id === selectedUser);

      return matchesSearch && matchesPriority && matchesUser;
    });
  }, [initialTasks, searchQuery, selectedPriority, selectedUser]);

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full">
      {/* 1. Header & Quick Metrics */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Sprint Dashboard</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">Showing {filteredTasks.length} active tasks.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>

        {/* 2. Admin Control Deck (Wraps on mobile) */}
        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3 pt-2 border-t border-slate-100">
          
          {/* Live Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700 font-medium"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer w-full"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🚨 Urgent</option>
              <option value="HIGH">🔥 High</option>
              <option value="MEDIUM">⚡ Medium</option>
              <option value="LOW">⏳ Low</option>
            </select>
          </div>

          {/* ADMIN ONLY: Operator Switcher */}
          {userRole === "ADMIN" && (
            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-2 rounded-lg border border-indigo-100 w-full md:w-auto md:ml-auto">
              <UserCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-[10px] md:text-xs font-bold text-indigo-800 uppercase tracking-wider hidden sm:block">Admin View:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent text-sm font-bold text-indigo-900 focus:outline-none cursor-pointer w-full"
              >
                <option value="ALL">Global Board</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* 3. Board Container */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <KanbanBoard 
          initialTasks={filteredTasks} 
          onOpenModal={() => setIsModalOpen(true)} 
          users={users}
          currentUserId={currentUserId}
        />
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} users={users} currentUserId={currentUserId} />
    </div>
  );
}