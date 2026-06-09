"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { sendSystemAlertEmail } from "./emailActions"; 
import * as admin from "firebase-admin"; // ⚡ Injected Firebase Admin SDK

// ==========================================
// FIREBASE ADMIN INITIALIZATION
// ==========================================
// Prevents Next.js hot-reloads from initializing Firebase multiple times
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Safely parses the escaped newlines from the .env string
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log("🔥 Firebase Admin SDK Initialized");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

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
    take: 25, 
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
  
  revalidatePath("/", "layout"); 
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

  // ⚡ Refactored to use the central engine so Pings also trigger mobile push!
  await createSystemNotification({
    userId: targetUserId,
    title: "Incoming Team Ping",
    message: `${sender.firstName} ${sender.lastName} has directly pinged you from the Command Center.`,
    link: "/team-chat",
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
export async function createSystemNotification(data: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    // 1. Save to Database (Triggers the UI Bell & Dashboard Feed)
    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      }
    });

    // 2. Fetch User Email AND Native Push Tokens
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true, pushTokens: true }
    });

    if (user) {
      // 3. Dispatch the Email via Resend
      if (user.email) {
        await sendSystemAlertEmail({
          toEmail: user.email,
          userName: user.firstName,
          title: data.title,
          message: data.message,
          link: data.link,
        }).catch(err => console.error("Email Dispatch Error:", err));
      }

      // 4. ⚡ DISPATCH NATIVE PUSH TO iOS/ANDROID
      if (user.pushTokens && user.pushTokens.length > 0) {
        const messagePayload = {
          notification: {
            title: data.title,
            body: data.message,
          },
          data: {
            link: data.link || "/", // Deep link support if they tap the lock screen notification
          },
          tokens: user.pushTokens,
        };

        try {
          const pushResponse = await admin.messaging().sendEachForMulticast(messagePayload);
          
          // Optional: Log failures to clean up dead device tokens later
          if (pushResponse.failureCount > 0) {
            console.warn(`Push Notice: ${pushResponse.failureCount} tokens failed to receive the message.`);
          }
        } catch (pushError) {
          console.error("Firebase FCM Push Error:", pushError);
        }
      }
    }
  } catch (error) {
    console.error("Failed to create system notification:", error);
  }
}