"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; 

export async function createDemand(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  const targetPriceRaw = formData.get("targetPrice") as string | null;
  const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;
  const timeline = formData.get("timeline") as string;
  const specs = formData.get("specs") as string;

  const origin = formData.get("origin") as string | null;
  const destination = formData.get("destination") as string | null;
  const incoterms = formData.get("incoterms") as string | null;
  const paymentTerms = formData.get("paymentTerms") as string | null;
  const inspection = formData.get("inspection") as string | null;
  const packaging = formData.get("packaging") as string | null;
  const insurance = formData.get("insurance") as string | null;
  const loadPort = formData.get("loadPort") as string | null;

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
    const blob = await put(`demands/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, file, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const blob = await put(`demands/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, pdf, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const newDemand = await prisma.demand.create({
    data: {
      title, quantity, quantityUnit, tolerance, targetPrice, timeline, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      keyTerms, creatorId: user.id, status: "ACTIVE", attachments: uploadedUrls,
    }
  });

  await prisma.auditLog.create({
    data: { action: "CREATED_DEMAND", details: `Demand posted: ${title}`, userId: user.id }
  });

  // 🔔 NOTIFICATION: Alert active traders about the new Demand
  const traders = await prisma.user.findMany({ 
    where: { id: { not: user.id }, role: { in: ["ADMIN", "TRADING_REP"] } } 
  });
  
  if (traders.length > 0) {
    await prisma.notification.createMany({
      data: traders.map(t => ({
        userId: t.id,
        title: "New Demand Board Listing",
        message: `${user.firstName} just posted a demand for ${new Intl.NumberFormat().format(quantity)} ${quantityUnit} of ${title}.`,
        link: `/demands`,
      }))
    });
  }

  revalidatePath("/demands");
}

export async function updateDemand(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Demand ID is missing");

  const existingDemand = await prisma.demand.findUnique({ where: { id } });
  if (!existingDemand) throw new Error("Demand not found");

  // 🔐 SERVER-SIDE RBAC ENFORCEMENT
  if (user.role !== "ADMIN" && existingDemand.creatorId !== user.id) {
    throw new Error("You do not have permission to edit this demand.");
  }

  const title = formData.get("title") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const quantityUnit = (formData.get("quantityUnit") as string) || "MT";
  const tolerance = formData.get("tolerance") as string | null;
  const targetPriceRaw = formData.get("targetPrice") as string | null;
  const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;
  const timeline = formData.get("timeline") as string;
  const specs = formData.get("specs") as string;

  const origin = formData.get("origin") as string | null;
  const destination = formData.get("destination") as string | null;
  const incoterms = formData.get("incoterms") as string | null;
  const paymentTerms = formData.get("paymentTerms") as string | null;
  const inspection = formData.get("inspection") as string | null;
  const packaging = formData.get("packaging") as string | null;
  const insurance = formData.get("insurance") as string | null;
  const loadPort = formData.get("loadPort") as string | null;

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
    const blob = await put(`demands/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, file, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const pdf = formData.get("pdf") as File | null;
  if (pdf && pdf.size > 0 && pdf.name !== 'undefined') {
    if (pdf.size > 10485760) throw new Error("PDF exceeds 10MB limit.");
    const blob = await put(`demands/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`, pdf, { access: 'public' });
    uploadedUrls.push(blob.url);
  }

  const finalAttachments = [...existingDemand.attachments, ...uploadedUrls];

  await prisma.demand.update({
    where: { id },
    data: {
      title, quantity, quantityUnit, tolerance, targetPrice, timeline, specs,
      origin, destination, incoterms, paymentTerms, inspection, packaging, insurance, loadPort,
      keyTerms, attachments: finalAttachments,
    }
  });

  await prisma.auditLog.create({
    data: { action: "UPDATED_DEMAND", details: `Demand updated: ${title}`, userId: user.id }
  });

  revalidatePath("/demands");
  revalidatePath(`/chat/${existingDemand.id}`); 
}

// 🗑️ SECURE DELETE ACTION
export async function deleteDemand(id: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const existingDemand = await prisma.demand.findUnique({ where: { id } });
  if (!existingDemand) throw new Error("Demand not found");

  // 🔐 SERVER-SIDE RBAC ENFORCEMENT
  if (user.role !== "ADMIN" && existingDemand.creatorId !== user.id) {
    throw new Error("You do not have permission to delete this demand.");
  }

  await prisma.demand.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { action: "DELETED_DEMAND", details: `Demand deleted: ${existingDemand.title}`, userId: user.id }
  });

  revalidatePath("/demands");
}