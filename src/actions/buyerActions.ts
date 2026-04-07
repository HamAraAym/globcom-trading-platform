"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBuyer(formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // 1. Catch the new Google Places location fields
  const area = formData.get("area") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;

  // 2. Combine them into a beautifully formatted, standardized address string
  // (Using filter(Boolean) ensures we don't get weird commas if a field is empty)
  const addressParts = [area, city, country].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  await prisma.client.create({
    data: {
      name,
      company,
      email,
      phone,
      address, // Save the combined Google Maps location!
    }
  });

  revalidatePath("/buyers");
}

export async function assignRep(buyerId: string, formData: FormData) {
  const repId = formData.get("repId") as string;

  await prisma.client.update({
    where: { id: buyerId },
    data: { assignedRepId: repId === "unassigned" ? null : repId }
  });

  revalidatePath("/buyers");
}