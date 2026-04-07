"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DealStatus } from "@prisma/client"; // <-- NEW: Import the strict Enum type

export async function openChatRoom(type: "demand" | "supply", itemId: string) {
  let chatRoomId = "";

  if (type === "demand") {
    // Check if room exists
    let room = await prisma.chatRoom.findUnique({ where: { demandId: itemId } });
    
    // If not, create it
    if (!room) {
      room = await prisma.chatRoom.create({ data: { demandId: itemId } });
    }
    chatRoomId = room.id;

  } else if (type === "supply") {
    // Check if room exists
    let room = await prisma.chatRoom.findUnique({ where: { supplyId: itemId } });
    
    // If not, create it
    if (!room) {
      room = await prisma.chatRoom.create({ data: { supplyId: itemId } });
    }
    chatRoomId = room.id;
  }

  // Instantly redirect the user to the new chat room page
  redirect(`/chat/${chatRoomId}`);
}

// Update the phase of a negotiation (SOP Phase 6 Compliance)
export async function updateDealStatus(
  itemId: string, 
  type: "DEMAND" | "SUPPLY", 
  newStatus: string, 
  chatId: string
) {
  // We cast newStatus as DealStatus to satisfy TypeScript's strict Enum requirement
  if (type === "DEMAND") {
    await prisma.demand.update({ 
      where: { id: itemId }, 
      data: { status: newStatus as DealStatus } 
    });
  } else {
    await prisma.supply.update({ 
      where: { id: itemId }, 
      data: { status: newStatus as DealStatus } 
    });
  }
  
  // Refresh the UI across the whole platform to reflect the new status
  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/demands");
  revalidatePath("/supplies");
  revalidatePath("/");
}