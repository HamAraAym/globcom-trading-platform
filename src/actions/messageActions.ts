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

  // 2. 🧠 SMART NOTIFICATION ENGINE: Detect @mentions BEFORE saving
  // Regex to find all words starting with '@' (e.g., @JohnDoe)
  const mentionMatches = content.match(/@(\w+)/g) || [];
  
  // Remove the '@' and convert to lowercase for clean database storage & matching
  const mentionNames = mentionMatches.map(m => m.slice(1).toLowerCase());

  // 3. Save the message to the database (Now storing the actual mentions!)
  await prisma.message.create({
    data: {
      content,
      chatRoomId: chatId,
      senderId: user.id,
      attachments: [], 
      mentions: mentionNames, // <-- FIX: Saves the array of tagged names to DB
    }
  });

  // 4. Cross-reference and Dispatch Notifications
  if (mentionNames.length > 0) {
    // Fetch all internal users to cross-reference the tagged names
    const allUsers = await prisma.user.findMany({ 
      select: { id: true, firstName: true, lastName: true } 
    });

    // Find the actual User IDs of the people mentioned
    const mentionedUserIds = allUsers
      .filter(u => 
        u.id !== user.id && // PREVENT self-notifications
        mentionNames.includes(`${u.firstName.toLowerCase()}${u.lastName.toLowerCase()}`)
      )
      .map(u => u.id);

    // If we have valid users to notify, fetch the room context and dispatch!
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

  // 5. Instantly refresh the UI for everyone looking at this chat
  revalidatePath(`/chat/${chatId}`);
}