"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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