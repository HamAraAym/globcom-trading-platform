"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Pusher from "pusher";
import { put } from "@vercel/blob"; 

// Initialize Pusher Server
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// ==========================================
// 1. FETCH USER CHANNELS (Sidebar)
// ==========================================
export async function getUserChannels() {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true }
  });
  if (!user) return [];

  return prisma.teamChannel.findMany({
    where: {
      members: {
        some: { id: user.id }
      }
    },
    include: {
      members: {
        select: { id: true, firstName: true, lastName: true, email: true, onlineStatus: true }
      },
      // Peek at the last message for the sidebar preview
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { content: true, fileName: true, createdAt: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// ==========================================
// 2. CREATE NEW CHANNEL OR DM
// ==========================================
export async function createChannel(memberIds: string[], name?: string, isGroup: boolean = false) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) throw new Error("User not found");

  // Ensure current user is in the channel
  const allMemberIds = Array.from(new Set([...memberIds, currentUser.id]));

  // If it's a DM (not a group), check if one already exists between these 2 users to avoid duplicates
  if (!isGroup && allMemberIds.length === 2) {
    const existingChannel = await prisma.teamChannel.findFirst({
      where: {
        isGroup: false,
        AND: allMemberIds.map(id => ({
          members: { some: { id } }
        }))
      }
    });
    if (existingChannel) return existingChannel;
  }

  // Create the new channel
  const newChannel = await prisma.teamChannel.create({
    data: {
      name: isGroup ? name : null,
      isGroup,
      members: {
        connect: allMemberIds.map(id => ({ id }))
      }
    }
  });

  return newChannel;
}

// ==========================================
// 3. FETCH MESSAGES FOR A CHANNEL
// ==========================================
export async function getChannelMessages(channelId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  return prisma.teamMessage.findMany({
    where: { channelId },
    take: 100,
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true }
      }
    }
  });
}

// ==========================================
// 4. SEND MESSAGE (Supports Vercel Blob Files)
// ==========================================
export async function sendChannelMessage(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const channelId = formData.get("channelId") as string;
  const content = (formData.get("content") as string) || "";
  const file = formData.get("file") as File | null;

  if (!channelId) throw new Error("Channel ID is required");
  if (!content.trim() && (!file || file.size === 0)) {
    throw new Error("Message cannot be empty");
  }

  let fileUrl = null;
  let fileName = null;
  let fileType = null;

  // Upload to Vercel Blob if a file is attached
  if (file && file.size > 0 && file.name !== 'undefined') {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit."); // 10MB limit
    
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    
    // Determine Type
    if (file.type.startsWith("image/")) fileType = "IMAGE";
    else if (file.type === "application/pdf") fileType = "PDF";
    else fileType = "DOCUMENT";

    const blob = await put(`team-chat/${timestamp}-${cleanFileName}`, file, { access: 'public' });
    fileUrl = blob.url;
    fileName = file.name;
  }

  // Save to Database
  const newMessage = await prisma.teamMessage.create({
    data: {
      content: content.trim() !== "" ? content : null,
      fileUrl,
      fileName,
      fileType,
      senderId: user.id,
      channelId
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true }
      }
    }
  });

  // Bump the Channel's updatedAt timestamp so it jumps to the top of the sidebar
  await prisma.teamChannel.update({
    where: { id: channelId },
    data: { updatedAt: new Date() }
  });

  // Broadcast instantly via Pusher WebSocket (Isolated to this specific channel)
  await pusherServer.trigger(`channel-${channelId}`, "new-message", newMessage);

  return newMessage;
}