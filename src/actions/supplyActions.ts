"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { uploadFileToSupabase } from "@/lib/supabase";

// ==========================================
// 1. CREATE SUPPLY
// ==========================================
export async function createSupply(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  // --- Core Base Fields ---
  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  
  const priceRaw = formData.get("price") as string | null;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  
  const location = formData.get("location") as string;
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

  // --- Offer Validity Date ---
  const validityDateRaw = formData.get("validityDate") as string | null;
  const validityDate = validityDateRaw ? new Date(validityDateRaw) : null;

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

  // 1. Process Images separately
  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  if (validImages.length > 5) throw new Error("Maximum 5 images allowed.");

  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const url = await uploadFileToSupabase(file);
    if (url) uploadedUrls.push(url);
  }

  // 2. Process PDF separately
  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const url = await uploadFileToSupabase(pdf);
    if (url) uploadedUrls.push(url);
  }

  // Save to DB
  await prisma.supply.create({
    data: {
      title, quantity, quantityUnit, tolerance, price, location, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      validityDate, keyTerms,
      creatorId: user.id,
      status: "ACTIVE",
      attachments: uploadedUrls,
    }
  });

  await prisma.auditLog.create({
    data: { action: "CREATED_SUPPLY", details: `Supply posted: ${title}`, userId: user.id }
  });

  revalidatePath("/supplies");
}

// ==========================================
// 2. UPDATE SUPPLY (EDIT MODE)
// ==========================================
export async function updateSupply(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Supply ID is missing");

  // Fetch existing supply to verify permissions and get old attachments
  const existingSupply = await prisma.supply.findUnique({ where: { id } });
  if (!existingSupply) throw new Error("Supply not found");

  // Security Verification: Only Admins, Trading Reps, or the original creator can edit
  if (user.role !== "ADMIN" && user.role !== "TRADING_REP" && existingSupply.creatorId !== user.id) {
    throw new Error("You do not have permission to edit this supply.");
  }

  // --- Core Base Fields ---
  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  
  const priceRaw = formData.get("price") as string | null;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  
  const location = formData.get("location") as string;
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

  const validityDateRaw = formData.get("validityDate") as string | null;
  const validityDate = validityDateRaw ? new Date(validityDateRaw) : null;

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

  // 1. Process New Images
  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const url = await uploadFileToSupabase(file);
    if (url) uploadedUrls.push(url);
  }

  // 2. Process New PDF
  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const url = await uploadFileToSupabase(pdf);
    if (url) uploadedUrls.push(url);
  }

  // Combine existing attachments with any newly uploaded files
  const finalAttachments = [...existingSupply.attachments, ...uploadedUrls];

  // Update Database via Prisma
  await prisma.supply.update({
    where: { id },
    data: {
      title, quantity, quantityUnit, tolerance, price, location, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      validityDate, keyTerms,
      attachments: finalAttachments,
    }
  });

  // Log the update
  await prisma.auditLog.create({
    data: { action: "UPDATED_SUPPLY", details: `Supply updated: ${title}`, userId: user.id }
  });

  revalidatePath("/supplies");
  revalidatePath(`/chat/${existingSupply.id}`); // Also refresh the deal desk if active!
}