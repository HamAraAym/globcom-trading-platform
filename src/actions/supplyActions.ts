"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; 

export async function createSupply(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  const priceRaw = formData.get("price") as string | null;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const location = formData.get("location") as string;
  const specs = formData.get("specs") as string;

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

  const keyTermsRaw = formData.get("keyTerms") as string | null;
  let keyTerms = null;
  if (keyTermsRaw) {
    try { keyTerms = JSON.parse(keyTermsRaw); } catch (e) { console.error(e); }
  }

  const uploadedUrls: string[] = [];

  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  if (validImages.length > 5) throw new Error("Maximum 5 images allowed.");

  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const blob = await put(`supplies/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, file, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const blob = await put(`supplies/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, pdf, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const newSupply = await prisma.supply.create({
    data: {
      title, quantity, quantityUnit, tolerance, price, location, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      validityDate, keyTerms, creatorId: user.id, status: "ACTIVE", attachments: uploadedUrls,
    }
  });

  await prisma.auditLog.create({
    data: { action: "CREATED_SUPPLY", details: `Supply posted: ${title}`, userId: user.id }
  });

  // 🔔 NOTIFICATION: Alert active traders about the new Inventory
  const traders = await prisma.user.findMany({ 
    where: { id: { not: user.id }, role: { in: ["ADMIN", "TRADING_REP"] } } 
  });
  
  if (traders.length > 0) {
    await prisma.notification.createMany({
      data: traders.map(t => ({
        userId: t.id,
        title: "New Inventory Added",
        message: `${user.firstName} just added ${new Intl.NumberFormat().format(quantity)} ${quantityUnit} of ${title} to the global supply board.`,
        link: `/supplies`,
      }))
    });
  }

  revalidatePath("/supplies");
}

export async function updateSupply(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Supply ID is missing");

  const existingSupply = await prisma.supply.findUnique({ where: { id } });
  if (!existingSupply) throw new Error("Supply not found");

  // 🔐 SERVER-SIDE RBAC ENFORCEMENT
  if (user.role !== "ADMIN" && existingSupply.creatorId !== user.id) {
    throw new Error("You do not have permission to edit this supply.");
  }

  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  const priceRaw = formData.get("price") as string | null;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const location = formData.get("location") as string;
  const specs = formData.get("specs") as string;

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

  const keyTermsRaw = formData.get("keyTerms") as string | null;
  let keyTerms = null;
  if (keyTermsRaw) {
    try { keyTerms = JSON.parse(keyTermsRaw); } catch (e) { console.error(e); }
  }

  const uploadedUrls: string[] = [];

  const images = formData.getAll("images") as File[];
  const validImages = images.filter(file => file.size > 0 && file.name !== 'undefined');
  
  for (const file of validImages) {
    if (file.size > 10485760) throw new Error("File exceeds 10MB limit.");
    const blob = await put(`supplies/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, file, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const blob = await put(`supplies/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, pdf, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  // Safely combine existing attachments with new ones
  const finalAttachments = [...(existingSupply.attachments || []), ...uploadedUrls];

  await prisma.supply.update({
    where: { id },
    data: {
      title, quantity, quantityUnit, tolerance, price, location, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      validityDate, keyTerms, attachments: finalAttachments,
    }
  });

  await prisma.auditLog.create({
    data: { action: "UPDATED_SUPPLY", details: `Supply updated: ${title}`, userId: user.id }
  });

  revalidatePath("/supplies");
  revalidatePath(`/chat/${existingSupply.id}`); 
}

// 🗑️ SECURE DELETE ACTION
export async function deleteSupply(id: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const existingSupply = await prisma.supply.findUnique({ where: { id } });
  if (!existingSupply) throw new Error("Supply not found");

  // 🔐 SERVER-SIDE RBAC ENFORCEMENT
  if (user.role !== "ADMIN" && existingSupply.creatorId !== user.id) {
    throw new Error("You do not have permission to delete this supply.");
  }

  await prisma.supply.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { action: "DELETED_SUPPLY", details: `Supply deleted: ${existingSupply.title}`, userId: user.id }
  });

  revalidatePath("/supplies");
}