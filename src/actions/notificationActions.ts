"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { sendSystemAlertEmail } from "./emailActions"; // ⚡ Injected Email Engine

// ==========================================
// 1. FETCH CURRENT USER'S NOTIFICATIONS
// ==========================================
export async function getMyNotifications() {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true } 
  });
  
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 25, // Only load the 25 most recent alerts to prevent payload bloat
  });
}

// ==========================================
// 2. MARK SINGLE AS READ
// ==========================================
export async function markAsRead(notificationId: string) {
  const session = await getServerSession();
  if (!session) return;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
  
  revalidatePath("/", "layout"); // Instantly updates the Bell badge
}

// ==========================================
// 3. MARK ALL AS READ
// ==========================================
export async function markAllAsRead() {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true }
  });
  
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });

  revalidatePath("/", "layout");
}

// ==========================================
// 4. SEND DIRECT PING (Team Collaboration)
// ==========================================
export async function sendPing(targetUserId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const sender = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { firstName: true, lastName: true }
  });
  
  if (!sender) throw new Error("User not found");

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: "Incoming Team Ping",
      message: `${sender.firstName} ${sender.lastName} has directly pinged you from the Command Center.`,
      link: "/team-chat", 
      isRead: false,
    }
  });

  revalidatePath("/", "layout");
}

// ==========================================
// 5. GET UNREAD COUNT (For the Bell Badge)
// ==========================================
export async function getUnreadNotificationCount() {
  const session = await getServerSession();
  if (!session?.user?.email) return 0;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) return 0;

  return prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    }
  });
}

// ==========================================
// 6. INTERNAL UTILITY: CREATE SYSTEM ALERT
// ==========================================
// Other action files (like taskActions) will import and use this!
export async function createSystemNotification(data: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    // 1. Save to Database (Triggers the UI Bell)
    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      }
    });

    // 2. Fetch User Email for Resend
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true }
    });

    // 3. Dispatch the Email via Resend
    if (user && user.email) {
      await sendSystemAlertEmail({
        toEmail: user.email,
        userName: user.firstName,
        title: data.title,
        message: data.message,
        link: data.link,
      });
    }

    // Deliberately skipping revalidatePath here, as the action calling this 
    // (like createTask) will usually run its own revalidation.
  } catch (error) {
    console.error("Failed to create system notification:", error);
  }
}