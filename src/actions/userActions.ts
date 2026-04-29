"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { uploadFileToSupabase } from "@/lib/supabase";

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User profile not found");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const letterhead = formData.get("letterhead") as File | null;

  let letterheadUrl = user.letterheadUrl; // Default to existing

  // If the user uploaded a new letterhead, send it to Supabase
  if (letterhead && letterhead.size > 0 && letterhead.name !== "undefined") {
    if (letterhead.size > 5242880) throw new Error("Image exceeds 5MB limit."); // 5MB limit
    const url = await uploadFileToSupabase(letterhead);
    if (url) letterheadUrl = url;
  }

  // Update the database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      letterheadUrl
    }
  });

  // Refresh the settings page to show the new data instantly
  revalidatePath("/settings");
}