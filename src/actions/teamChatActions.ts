"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Pusher from "pusher";

// Initialize Pusher Server (Ensure these are in your .env.local)
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!, // <-- Changed this line
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function getTeamMessages() {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Fetch the last 100 messages to populate the chat history
  const messages = await prisma.teamMessage.findMany({
    take: 100,
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true }
      }
    }
  });

  return messages;
}

export async function sendTeamMessage(content: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  if (!content.trim()) throw new Error("Message cannot be empty");

  // 1. Save to Database
  const newMessage = await prisma.teamMessage.create({
    data: {
      content,
      senderId: user.id
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true }
      }
    }
  });

  // 2. Broadcast to all users instantly via Pusher WebSocket
  await pusherServer.trigger("global-team-chat", "new-message", newMessage);

  return newMessage;
}