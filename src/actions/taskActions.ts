"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { createSystemNotification } from "./notificationActions"; // ⚡ Injected Notification Engine

interface TaskFilters {
  userId?: string;
  priority?: string;
  search?: string;
}

// ==========================================
// 1. FETCH ALL TASKS (With Admin Filters)
// ==========================================
export async function getTasks(filters?: TaskFilters) {
  try {
    const whereClause: any = {};

    if (filters?.userId && filters.userId !== "ALL") {
      whereClause.assignees = {
        some: { id: filters.userId }
      };
    }

    if (filters?.priority && filters.priority !== "ALL") {
      whereClause.priority = filters.priority;
    }

    if (filters?.search && filters.search.trim() !== "") {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        subtasks: {
          orderBy: { createdAt: "asc" }
        },
        comments: {
          include: {
            author: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        attachments: true
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return { success: true, data: tasks };
  } catch (error: any) {
    console.error("Failed to fetch filtered tasks:", error);
    return { success: false, error: "Failed to load the sprint board." };
  }
}

// ==========================================
// 2. MOVE A CARD (Drag & Drop Action)
// ==========================================
export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    revalidatePath("/tasks"); 
    return { success: true, data: updatedTask };
  } catch (error: any) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "Failed to move the card." };
  }
}

// ==========================================
// 3. CREATE A NEW TICKET (JIRA-STYLE)
// ==========================================
export async function createTask(data: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  estimatedHours?: number;
  dueDate?: Date;
  creatorId: string;
  assigneeIds?: string[];
  clientId?: string;
}) {
  try {
    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type as any,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        dueDate: data.dueDate,
        status: "TODO",
        creatorId: data.creatorId,
        clientId: data.clientId || undefined,
        assignees: data.assigneeIds && data.assigneeIds.length > 0
          ? { connect: data.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    // ⚡ TRIGGER: Notify all assigned users
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      for (const userId of data.assigneeIds) {
        if (userId === data.creatorId) continue; // Don't notify the creator
        
        await createSystemNotification({
          userId,
          title: "New Task Assigned",
          message: `You have been assigned to a new ticket: ${data.title}`,
          link: "/tasks",
        });
      }
    }

    revalidatePath("/tasks");
    return { success: true, data: newTask };
  } catch (error: any) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create the new task." };
  }
}

// ==========================================
// 4. DELETE A TICKET
// ==========================================
export async function deleteTask(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete the task." };
  }
}

// ==========================================
// 5. UPDATE A TICKET (Edit details & log time)
// ==========================================
export async function updateTaskDetails(taskId: string, data: {
  title: string;
  description?: string;
  priority: string;
  estimatedHours?: number;
  actualHours?: number;
  assigneeIds?: string[];
}) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        assignees: {
          set: [],
          connect: data.assigneeIds?.map((id) => ({ id })) || [],
        },
      },
    });

    // ⚡ TRIGGER: Notify assigned users of scope/priority changes
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      for (const userId of data.assigneeIds) {
        await createSystemNotification({
          userId,
          title: "Ticket Updated",
          message: `Scope or assignments were updated for: ${data.title}`,
          link: "/tasks",
        });
      }
    }

    revalidatePath("/tasks");
    return { success: true, data: updatedTask };
  } catch (error: any) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Failed to update task details." };
  }
}

// ==========================================
// 6. SUBTASKS (Checklists)
// ==========================================
export async function addSubtask(taskId: string, title: string) {
  try {
    const subtask = await prisma.subtask.create({
      data: { taskId, title }
    });
    revalidatePath("/tasks");
    return { success: true, data: subtask };
  } catch (error: any) {
    return { success: false, error: "Failed to add subtask." };
  }
}

export async function toggleSubtask(subtaskId: string, isDone: boolean) {
  try {
    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isDone }
    });
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update subtask." };
  }
}

export async function deleteSubtask(subtaskId: string) {
  try {
    await prisma.subtask.delete({
      where: { id: subtaskId }
    });
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete subtask." };
  }
}

// ==========================================
// 7. COMMENTS (Activity Feed)
// ==========================================
export async function addTaskComment(taskId: string, authorId: string, text: string) {
  try {
    const comment = await prisma.taskComment.create({
      data: { taskId, authorId, text }
    });

    // ⚡ TRIGGER: Notify other assignees that a comment was added
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true }
    });

    if (task && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        if (assignee.id === authorId) continue; // Don't notify the person who wrote the comment

        await createSystemNotification({
          userId: assignee.id,
          title: "New Task Comment",
          message: `New activity on "${task.title}": ${text.substring(0, 40)}${text.length > 40 ? "..." : ""}`,
          link: "/tasks",
        });
      }
    }

    revalidatePath("/tasks");
    return { success: true, data: comment };
  } catch (error: any) {
    return { success: false, error: "Failed to add comment." };
  }
}