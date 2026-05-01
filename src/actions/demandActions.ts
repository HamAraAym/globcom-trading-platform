"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; // NEW: Vercel Blob Storage

// ==========================================
// 1. CREATE DEMAND
// ==========================================
export async function createDemand(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  // --- Core Base Fields ---
  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  
  const targetPriceRaw = formData.get("targetPrice") as string | null;
  const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;
  
  const timeline = formData.get("timeline") as string;
  const specs = formData.get("specs") as string;

  // --- Strict Business Logistics Fields ---
  const origin = formData.get("origin") as string | null;
  const destination = formData.get("destination") as string | null;
  const incoterms = formData.get("incoterms") as string | null;
  const paymentTerms = formData.get("paymentTerms") as string | null;
  const inspection = formData.get("inspection") as string | null;
  const packaging = formData.get("packaging") as string | null;
  const insurance = formData.get("insurance") as string | null;
  const loadPort = formData.get("loadPort") as string | null;

  // --- Dynamic Specifications (Parse from JSON String) ---
  const keyTermsRaw = formData.get("keyTerms") as string | null;
  let keyTerms = null;
  if (keyTermsRaw) {
    try {
      keyTerms = JSON.parse(keyTermsRaw);
    } catch (e) {
      console.error("Failed to parse dynamic key terms", e);
    }
  }

  const uploadedUrls: string[] = [];

  // 1. Process Images using Vercel Blob
  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  if (validImages.length > 5) throw new Error("Maximum 5 images allowed.");

  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`demands/${timestamp}-${cleanFileName}`, file, {
      access: 'public',
    });
    uploadedUrls.push(blob.url);
  }

  // 2. Process PDF using Vercel Blob
  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const timestamp = Date.now();
    const cleanFileName = pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`demands/${timestamp}-${cleanFileName}`, pdf, {
      access: 'public',
    });
    uploadedUrls.push(blob.url);
  }

  // Save to Database via Prisma
  await prisma.demand.create({
    data: {
      title, quantity, quantityUnit, tolerance, targetPrice, timeline, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      keyTerms,
      creatorId: user.id,
      status: "ACTIVE",
      attachments: uploadedUrls,
    }
  });

  // Log the creation
  await prisma.auditLog.create({
    data: { action: "CREATED_DEMAND", details: `Demand posted: ${title}`, userId: user.id }
  });

  revalidatePath("/demands");
}

// ==========================================
// 2. UPDATE DEMAND (EDIT MODE)
// ==========================================
export async function updateDemand(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Demand ID is missing");

  // Fetch existing demand to verify permissions and get old attachments
  const existingDemand = await prisma.demand.findUnique({ where: { id } });
  if (!existingDemand) throw new Error("Demand not found");

  // Security Verification: Only Admins, Trading Reps, or the original creator can edit
  if (user.role !== "ADMIN" && user.role !== "TRADING_REP" && existingDemand.creatorId !== user.id) {
    throw new Error("You do not have permission to edit this demand.");
  }

  // --- Core Base Fields ---
  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  
  const targetPriceRaw = formData.get("targetPrice") as string | null;
  const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;
  
  const timeline = formData.get("timeline") as string;
  const specs = formData.get("specs") as string;

  // --- Strict Business Logistics Fields ---
  const origin = formData.get("origin") as string | null;
  const destination = formData.get("destination") as string | null;
  const incoterms = formData.get("incoterms") as string | null;
  const paymentTerms = formData.get("paymentTerms") as string | null;
  const inspection = formData.get("inspection") as string | null;
  const packaging = formData.get("packaging") as string | null;
  const insurance = formData.get("insurance") as string | null;
  const loadPort = formData.get("loadPort") as string | null;

  // --- Dynamic Specifications ---
  const keyTermsRaw = formData.get("keyTerms") as string | null;
  let keyTerms = null;
  if (keyTermsRaw) {
    try {
      keyTerms = JSON.parse(keyTermsRaw);
    } catch (e) {
      console.error("Failed to parse dynamic key terms", e);
    }
  }

  const uploadedUrls: string[] = [];

  // 1. Process New Images using Vercel Blob
  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`demands/${timestamp}-${cleanFileName}`, file, {
      access: 'public',
    });
    uploadedUrls.push(blob.url);
  }

  // 2. Process New PDF using Vercel Blob
  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const timestamp = Date.now();
    const cleanFileName = pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`demands/${timestamp}-${cleanFileName}`, pdf, {
      access: 'public',
    });
    uploadedUrls.push(blob.url);
  }

  // Combine existing attachments with any newly uploaded files
  const finalAttachments = [...existingDemand.attachments, ...uploadedUrls];

  // Update Database via Prisma
  await prisma.demand.update({
    where: { id },
    data: {
      title, quantity, quantityUnit, tolerance, targetPrice, timeline, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      keyTerms,
      attachments: finalAttachments,
    }
  });

  // Log the update
  await prisma.auditLog.create({
    data: { action: "UPDATED_DEMAND", details: `Demand updated: ${title}`, userId: user.id }
  });

  revalidatePath("/demands");
  revalidatePath(`/chat/${existingDemand.id}`); // Also refresh the deal desk if active!
}