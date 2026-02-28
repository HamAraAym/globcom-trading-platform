"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { uploadFileToSupabase } from "@/lib/supabase";

export async function createDemand(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const targetPrice = parseFloat(formData.get("targetPrice") as string);
  const timeline = formData.get("timeline") as string;
  const specs = formData.get("specs") as string;

  const uploadedUrls: string[] = [];

  // 1. Process Images
  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  if (validImages.length > 5) throw new Error("Maximum 5 images allowed.");

  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const url = await uploadFileToSupabase(file);
    if (url) uploadedUrls.push(url);
  }

  // 2. Process PDF
  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const url = await uploadFileToSupabase(pdf);
    if (url) uploadedUrls.push(url);
  }

  // Save to DB
  await prisma.demand.create({
    data: {
      title, quantity, targetPrice, timeline, specs,
      creatorId: user.id,
      status: "ACTIVE",
      attachments: uploadedUrls,
    }
  });

  await prisma.auditLog.create({
    data: { action: "CREATED_DEMAND", details: `Demand posted: ${title}`, userId: user.id }
  });

  revalidatePath("/demands");
}