"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getMyNotifications() {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user) return [];

  // Fetch the 10 most recent notifications for this user
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function markAsRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
  revalidatePath("/"); // Force the UI to update the unread count
}

export async function markAllAsRead() {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });
  revalidatePath("/");
}

// NEW: Send a direct 1-on-1 Ping to a specific user
export async function sendPing(targetUserId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Find who is sending the ping
  const sender = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!sender) throw new Error("Sender not found");

  // Create the notification for the target user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: "Direct Ping",
      message: `${sender.firstName} ${sender.lastName} just pinged you.`,
      link: null, // Generic pings don't need a specific link
      isRead: false,
    }
  });

  revalidatePath("/");
}