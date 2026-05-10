"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; // Vercel Blob Storage

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User profile not found");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const letterhead = formData.get("letterhead") as File | null;
  const removeLetterhead = formData.get("removeLetterhead") === "true"; // Catch the wipe signal

  let letterheadUrl = user.letterheadUrl; // Default to existing

  // 🔐 SERVER-SIDE SECURITY: Only Admins can upload/modify letterheads
  if (user.role === "ADMIN") {
    // 1. If Admin cleared the image, wipe it from DB
    if (removeLetterhead) {
      letterheadUrl = null;
    } 
    // 2. Otherwise, if they uploaded a new one, save it to Vercel Blob
    else if (letterhead && letterhead.size > 0 && letterhead.name !== "undefined") {
      if (letterhead.size > 5242880) throw new Error("Image exceeds 5MB limit."); // 5MB limit
      
      const timestamp = Date.now();
      const cleanFileName = letterhead.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`users/${timestamp}-${cleanFileName}`, letterhead, {
        access: 'public',
      });
      letterheadUrl = blob.url;
    }
  }

  // Update the database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      // Only inject the letterheadUrl into the update payload if the user is an Admin
      ...(user.role === "ADMIN" && { letterheadUrl })
    }
  });

  // Refresh the settings page to show the new data instantly
  revalidatePath("/settings");
  // Refresh the chat page so the DocumentGenerator gets the latest letterhead
  revalidatePath("/chat"); 
}