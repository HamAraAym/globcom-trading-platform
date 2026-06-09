"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { createSystemNotification } from "./notificationActions";
import { Resend } from "resend";

// Initialize the Resend Email Engine
const resend = new Resend(process.env.RESEND_API_KEY);

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
// 3. CREATE A NEW TICKET (With Email & Recurring Hooks)
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
  // ⚡ NEW: Recurring Engine Hooks
  isRecurring?: boolean;
  cronExpression?: string;
  nextRunAt?: Date;
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
        isRecurring: data.isRecurring || false,
        cronExpression: data.cronExpression,
        nextRunAt: data.nextRunAt,
        assignees: data.assigneeIds && data.assigneeIds.length > 0
          ? { connect: data.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    // ⚡ TRIGGER: Multi-Channel Notifications (In-App + Email)
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      // Fetch user data so we have their actual emails
      const assignees = await prisma.user.findMany({
        where: { id: { in: data.assigneeIds } },
        select: { id: true, email: true, firstName: true }
      });

      for (const user of assignees) {
        if (user.id === data.creatorId) continue; 
        
        // 1. Dispatch In-App Notification (Global Hub & Bell Icon)
        await createSystemNotification({
          userId: user.id,
          title: data.isRecurring ? "Recurring Alert Setup" : "New Task Assigned",
          message: `You have been assigned to: ${data.title}`,
          link: "/tasks",
        });

        // 2. Dispatch Official Email via Resend
        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: 'GlobCom Enterprise <onboarding@resend.dev>', // Update this to your verified domain later!
              to: user.email,
              subject: data.isRecurring ? `Recurring Alert Active: ${data.title}` : `New Task Assigned: ${data.title}`,
              html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #0f172a;">Hello ${user.firstName},</h2>
                  <p style="color: #475569;">You have been assigned to a new operational ticket in the GlobCom Enterprise system.</p>
                  
                  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 8px 0; color: #1e293b;">${data.title}</h3>
                    <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Priority:</strong> ${data.priority}</p>
                    ${data.isRecurring ? `<p style="margin: 8px 0 0 0; color: #0284c7; font-size: 14px; font-weight: bold;">🔄 This is a recurring alert (${data.cronExpression}).</p>` : ''}
                  </div>
                  
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Launch Task Engine</a>
                </div>
              `
            });
          } catch (emailError) {
            console.error("Failed to dispatch Resend email:", emailError);
          }
        }
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
  // ⚡ NEW: Allow updating to recurring mid-sprint
  isRecurring?: boolean;
  cronExpression?: string;
  nextRunAt?: Date;
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
        isRecurring: data.isRecurring,
        cronExpression: data.cronExpression,
        nextRunAt: data.nextRunAt,
        assignees: {
          set: [],
          connect: data.assigneeIds?.map((id) => ({ id })) || [],
        },
      },
    });

    // ⚡ TRIGGER: Notify assigned users of scope/priority changes (or newly setup recurring alerts)
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assignees = await prisma.user.findMany({
        where: { id: { in: data.assigneeIds } },
        select: { id: true, email: true, firstName: true }
      });

      for (const user of assignees) {
        // In-App
        await createSystemNotification({
          userId: user.id,
          title: data.isRecurring ? "Recurring Alert Updated" : "Ticket Updated",
          message: `Scope or assignments were updated for: ${data.title}`,
          link: "/tasks",
        });

        // Email Alert if they set up a new recurring rule mid-sprint
        if (data.isRecurring && process.env.RESEND_API_KEY) {
           await resend.emails.send({
             from: 'GlobCom Enterprise <onboarding@resend.dev>', 
             to: user.email,
             subject: `System Alert: Task set to Recurring`,
             html: `<p>The task <strong>${data.title}</strong> has been configured as a recurring workflow (${data.cronExpression}).</p>`
           });
        }
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true }
    });

    if (task && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        if (assignee.id === authorId) continue; 

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