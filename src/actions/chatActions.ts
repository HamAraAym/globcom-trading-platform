"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { DealStatus } from "@prisma/client"; 

// ==========================================
// 1. OPEN / CREATE DEAL DESK
// ==========================================
export async function openChatRoom(type: "demand" | "supply", itemId: string) {
  let chatRoomId = "";

  if (type === "demand") {
    let room = await prisma.chatRoom.findUnique({ where: { demandId: itemId } });
    if (!room) room = await prisma.chatRoom.create({ data: { demandId: itemId } });
    chatRoomId = room.id;
  } else if (type === "supply") {
    let room = await prisma.chatRoom.findUnique({ where: { supplyId: itemId } });
    if (!room) room = await prisma.chatRoom.create({ data: { supplyId: itemId } });
    chatRoomId = room.id;
  }

  redirect(`/chat/${chatRoomId}`);
}

// ==========================================
// 2. UPDATE DEAL STATUS (W/ NOTIFICATIONS)
// ==========================================
export async function updateDealStatus(itemId: string, type: "DEMAND" | "SUPPLY", newStatus: string, chatId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  let itemName = "";
  let creatorId = "";

  // 1. Update the corresponding table
  if (type === "DEMAND") {
    const demand = await prisma.demand.update({
      where: { id: itemId },
      data: { status: newStatus as DealStatus } // Strict Enum Casting
    });
    itemName = demand.title;
    creatorId = demand.creatorId;
  } else {
    const supply = await prisma.supply.update({
      where: { id: itemId },
      data: { status: newStatus as DealStatus } // Strict Enum Casting
    });
    itemName = supply.title;
    creatorId = supply.creatorId;
  }

  // 2. Global Audit Log
  await prisma.auditLog.create({
    data: {
      action: "UPDATED_DEAL_STATUS",
      details: `Changed ${type} status to ${newStatus} for: ${itemName}`,
      userId: user.id
    }
  });

  // 3. 🔔 NOTIFICATION ENGINE: Alert the original creator of the deal!
  if (user.id !== creatorId) {
    await prisma.notification.create({
      data: {
        userId: creatorId,
        title: `Deal Status: ${newStatus.replace("_", " ")}`,
        message: `${user.firstName} ${user.lastName} changed the status of your ${type.toLowerCase()} "${itemName}".`,
        link: `/chat/${chatId}`,
      }
    });
  }

  // 4. Drop a silent system message into the chat room
  await prisma.message.create({
    data: {
      content: `SYSTEM_ALERT: The deal status was updated to **${newStatus.replace("_", " ")}** by ${user.firstName}.`,
      chatRoomId: chatId,
      senderId: user.id, 
    }
  });

  // 5. Revalidate Paths
  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/demands");
  revalidatePath("/supplies");
  revalidatePath("/");
}