"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Pusher from "pusher"; // Server-side Pusher SDK

// Initialize the Pusher Server SDK using your secure environment variables
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function sendMessage(chatId: string, formData: FormData): Promise<void> {
  // 1. Verify user identity securely
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized access");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error("Authorized user profile not found");

  const content = formData.get("content") as string;
  if (!content || !content.trim()) return;

  // 2. 🧠 SMART NOTIFICATION ENGINE: Handle standard text AND JSON structured offers
  let textToParseForMentions = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "COUNTER_OFFER") {
      // If it's an offer, only scan the 'notes' field for @mentions
      textToParseForMentions = parsed.notes || "";
    }
  } catch (e) {
    // Standard text message, proceed safely
  }

  // Regex to find all words starting with '@' (e.g., @JohnDoe)
  const mentionMatches = textToParseForMentions.match(/@(\w+)/g) || [];
  
  // Remove the '@' and convert to lowercase for clean database storage & matching
  const mentionNames = mentionMatches.map(m => m.slice(1).toLowerCase());

  // 3. Save the message to the database
  const newMessage = await prisma.message.create({
    data: {
      content: content.trim(),
      chatRoomId: chatId,
      senderId: user.id,
      attachments: [], 
      mentions: mentionNames, 
    },
    // Include sender so the UI knows whose name to put on the chat bubble when broadcasted
    include: {
      sender: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  // 4. 🔥 LIVE WEBSOCKET BROADCAST
  try {
    await pusherServer.trigger(`chat-${chatId}`, "new-message", newMessage);
  } catch (error) {
    console.error("Pusher broadcast failed:", error);
  }

  // 5. Cross-reference and Dispatch Notifications
  if (mentionNames.length > 0) {
    const allUsers = await prisma.user.findMany({ 
      select: { id: true, firstName: true, lastName: true } 
    });

    const mentionedUserIds = allUsers
      .filter(u => 
        u.id !== user.id && // PREVENT self-notifications
        mentionNames.includes(`${u.firstName.toLowerCase()}${u.lastName.toLowerCase()}`)
      )
      .map(u => u.id);

    if (mentionedUserIds.length > 0) {
      const room = await prisma.chatRoom.findUnique({
        where: { id: chatId },
        include: { demand: true, supply: true }
      });
      
      const productTitle = room?.demand?.title || room?.supply?.title || "a negotiation terminal";

      await prisma.notification.createMany({
        data: mentionedUserIds.map(targetUserId => ({
          userId: targetUserId,
          title: "New Mention Alert",
          message: `${user.firstName} ${user.lastName} tagged you regarding: ${productTitle}`,
          link: `/chat/${chatId}`,
        }))
      });
    }
  }

  // 6. Refresh the server caches for fallback
  revalidatePath(`/chat/${chatId}`);
}