"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Pusher from "pusher";
import { put } from "@vercel/blob"; // ⚡ Required for Vercel Blob uploads

// Initialize Pusher Server
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
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

// ⚡ FIX: Now correctly accepts FormData instead of a string
export async function sendTeamMessage(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  // Safely extract the content and attachments from the FormData object
  const content = (formData.get("content") as string) || "";
  const files = formData.getAll("attachments") as File[];

  if (!content.trim() && files.length === 0) {
    throw new Error("Message cannot be empty");
  }

  const uploadedUrls: string[] = [];

  // 1. Upload any attached files to Vercel Blob
  for (const file of files) {
    if (file.size > 0 && file.name !== 'undefined') {
      if (file.size > 10485760) throw new Error("File exceeds 10MB limit."); // 10MB limit
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`team-chat/${timestamp}-${cleanFileName}`, file, { access: 'public' });
      uploadedUrls.push(blob.url);
    }
  }

  // 2. Save to Database
  const newMessage = await prisma.teamMessage.create({
    data: {
      content,
      attachments: uploadedUrls, // Save the generated Vercel Blob URLs
      senderId: user.id
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true }
      }
    }
  });

  // 3. Broadcast to all users instantly via Pusher WebSocket
  await pusherServer.trigger("global-team-chat", "new-message", newMessage);

  return newMessage;
}