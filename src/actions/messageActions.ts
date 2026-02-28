"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function sendMessage(chatId: string, formData: FormData) {
  // 1. Verify user identity securely
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized access");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) throw new Error("Authorized user profile not found");

  const content = formData.get("content") as string;
  if (!content || !content.trim()) return;

  // 2. Save the message to the database
  await prisma.message.create({
    data: {
      content,
      chatRoomId: chatId,
      senderId: user.id,
      attachments: [], 
      mentions: [],    
    }
  });

  // 3. 🧠 SMART NOTIFICATION ENGINE: Detect @mentions
  // Regex to find all words starting with '@' (e.g., @JohnDoe)
  const mentionMatches = content.match(/@(\w+)/g);

  if (mentionMatches && mentionMatches.length > 0) {
    // Remove the '@' and convert to lowercase for matching
    const mentionNames = mentionMatches.map(m => m.slice(1).toLowerCase());
    
    // Fetch all internal users to cross-reference the tagged names
    const allUsers = await prisma.user.findMany({ 
      select: { id: true, firstName: true, lastName: true } 
    });

    // Find the actual User IDs of the people mentioned
    const mentionedUserIds = allUsers
      .filter(u => mentionNames.includes(`${u.firstName.toLowerCase()}${u.lastName.toLowerCase()}`))
      .map(u => u.id);

    // Fetch the chat room to get the product title for a better alert message
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { demand: true, supply: true }
    });
    
    const productTitle = room?.demand?.title || room?.supply?.title || "a negotiation terminal";

    // 4. Dispatch the Real-Time Notifications
    if (mentionedUserIds.length > 0) {
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

  // 5. Instantly refresh the UI for everyone looking at this chat
  revalidatePath(`/chat/${chatId}`);
}