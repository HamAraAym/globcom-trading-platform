"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

// 1. Fetch Notifications for the current user
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
    take: 25, // Only load the 25 most recent alerts
  });
}

// 2. Mark a single notification as read
export async function markAsRead(notificationId: string) {
  const session = await getServerSession();
  if (!session) return;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
}

// 3. Mark all notifications as read
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
}

// 4. Send a Direct Ping to a Team Member
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
      link: "/", // You can update this to route to a specific chat/deal later if needed
      isRead: false,
    }
  });

  // Revalidate the layout so the target user's bell updates instantly if they refresh
  revalidatePath("/", "layout");
}