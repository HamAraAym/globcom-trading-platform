"use client";

import { useState, useEffect, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { updateTaskStatus } from "@/actions/taskActions";
import { TaskStatus } from "@prisma/client";
import { CheckCircle2, Inbox } from "lucide-react";
import TaskCard from "./TaskCard"; 

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: TaskStatus;
  estimatedHours?: number | null; 
  actualHours: number;            
  assignees: { id: string; firstName: string; lastName: string }[];
  // ⚡ Added subtasks and comments to match the backend
  subtasks?: { id: string; title: string; isDone: boolean }[];
  comments?: { id: string; text: string; createdAt: Date; author: { firstName: string; lastName: string } }[];
};

interface KanbanBoardProps {
  initialTasks: Task[];
  onOpenModal?: () => void; 
  users: any[]; 
  currentUserId: string; // ⚡ Added to pass down to TaskCard
}

const COLUMNS: { id: TaskStatus; label: string; bg: string; border: string; accent: string }[] = [
  { id: "TODO", label: "To Do", bg: "bg-slate-50", border: "border-slate-200/80", accent: "indigo" },
  { id: "IN_PROGRESS", label: "In Progress", bg: "bg-blue-50/40", border: "border-blue-100", accent: "blue" },
  { id: "IN_REVIEW", label: "In Review", bg: "bg-amber-50/40", border: "border-amber-100", accent: "amber" },
  { id: "DONE", label: "Done", bg: "bg-emerald-50/20", border: "border-emerald-100/60", accent: "emerald" },
];

export default function KanbanBoard({ initialTasks, onOpenModal, users, currentUserId }: KanbanBoardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="p-8 text-slate-500 font-medium animate-pulse">Initializing Workspace...</div>;

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    startTransition(() => {
      updateTaskStatus(draggableId, newStatus)
        .then((res) => {
          if (!res?.success) setTasks(initialTasks);
        })
        .catch(() => setTasks(initialTasks));
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 md:gap-6 h-full items-start pb-6 px-4 md:px-0 overflow-x-auto w-full custom-scrollbar">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="flex flex-col w-80 shrink-0 h-full max-h-[calc(100vh-180px)]">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    col.id === "TODO" ? "bg-indigo-500" :
                    col.id === "IN_PROGRESS" ? "bg-blue-500" :
                    col.id === "IN_REVIEW" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <h3 className="font-semibold text-sm text-slate-800 tracking-tight">{col.label}</h3>
                </div>
                <span className="text-xs font-bold bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 rounded-2xl border transition-all flex flex-col gap-3 min-h-[350px] ${
                      snapshot.isDraggingOver 
                        ? `${col.bg} ${col.border} shadow-inner` 
                        : "bg-slate-100/70 border-slate-200/60"
                    }`}
                  >
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-300 rounded-xl bg-white/50 text-center my-auto transition-all">
                        {col.id === "DONE" ? <CheckCircle2 className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" /> : <Inbox className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />}
                        <p className="text-xs font-semibold text-slate-700">No tasks {col.label.toLowerCase()}</p>
                        <p className="text-[11px] text-slate-400 max-w-[160px] mt-0.5 leading-relaxed">
                          {col.id === "TODO" ? "Create a ticket to kickstart your next team workflow." : "Drag a card here to sync team operations."}
                        </p>
                        {col.id === "TODO" && onOpenModal && (
                          <button onClick={onOpenModal} className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-4 py-2 rounded-lg transition-colors cursor-pointer border border-indigo-100">
                            + Add Ticket
                          </button>
                        )}
                      </div>
                    ) : (
                      columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <TaskCard 
                              task={task} 
                              provided={provided} 
                              snapshot={snapshot} 
                              users={users} 
                              currentUserId={currentUserId} // ⚡ Passing it securely down to the modal
                            />
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}