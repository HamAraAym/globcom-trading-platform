"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ClientType } from "@prisma/client";
import { put } from "@vercel/blob"; // NEW: Vercel Blob Storage

export async function createBuyer(formData: FormData) {
  // 1. Authenticate the action for audit logging
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  // 2. Extract Core Fields & Dual-Entity Type
  const type = (formData.get("type") as ClientType) || "CORPORATE";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string | null;

  // 3. Extract Corporate Fields (Ignored if Individual)
  const company = type === "CORPORATE" ? (formData.get("company") as string | null) : null;
  const registrationNo = type === "CORPORATE" ? (formData.get("registrationNo") as string | null) : null;
  const website = type === "CORPORATE" ? (formData.get("website") as string | null) : null;

  // 4. Catch the Google Places location fields
  const area = formData.get("area") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;

  // Combine into a beautifully formatted string
  const addressParts = [area, city, country].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  // 5. Handle KYC Document Uploads directly to Vercel Blob
  let tradeLicenseUrl = null;
  let passportUrl = null;

  if (type === "CORPORATE") {
    const tradeLicenseFile = formData.get("tradeLicense") as File | null;
    if (tradeLicenseFile && tradeLicenseFile.size > 0 && tradeLicenseFile.name !== 'undefined') {
      const timestamp = Date.now();
      const cleanFileName = tradeLicenseFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`kyc/${timestamp}-${cleanFileName}`, tradeLicenseFile, {
        access: 'public',
      });
      tradeLicenseUrl = blob.url;
    }
  }

  const passportFile = formData.get("passport") as File | null;
  if (passportFile && passportFile.size > 0 && passportFile.name !== 'undefined') {
    const timestamp = Date.now();
    const cleanFileName = passportFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`kyc/${timestamp}-${cleanFileName}`, passportFile, {
      access: 'public',
    });
    passportUrl = blob.url;
  }

  // 6. Save to Database
  const newClient = await prisma.client.create({
    data: {
      type,
      name,
      company,
      email,
      phone,
      address,
      country, // Saved specifically for global territory mapping
      registrationNo,
      website,
      tradeLicenseUrl,
      passportUrl,
      // Default new clients to PENDING status for compliance checks
      kycStatus: "PENDING", 
    }
  });

  // 7. Log to the Client's specific CRM Timeline
  await prisma.clientActivity.create({
    data: {
      type: "ACCOUNT_CREATED",
      description: `Client profile created as a ${type} entity.`,
      clientId: newClient.id,
      userId: user.id
    }
  });

  // 8. Log to the Global Audit System
  await prisma.auditLog.create({
    data: { 
      action: "CREATED_CLIENT", 
      details: `Added new client: ${name} ${company ? `(${company})` : ''}`, 
      userId: user.id 
    }
  });

  revalidatePath("/buyers");
  revalidatePath("/crm");
}

export async function assignRep(buyerId: string, formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) throw new Error("User not found");

  const repId = formData.get("repId") as string;
  const assignedRepId = repId === "unassigned" ? null : repId;

  await prisma.client.update({
    where: { id: buyerId },
    data: { assignedRepId }
  });

  // Fetch the name of the newly assigned rep to drop in the timeline
  const assignedUser = assignedRepId ? await prisma.user.findUnique({ where: { id: assignedRepId } }) : null;
  const repName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned';

  // Drop an event in the CRM Timeline
  await prisma.clientActivity.create({
    data: {
      type: "REP_ASSIGNED",
      description: `Account Executive assignment updated to: ${repName}`,
      clientId: buyerId,
      userId: currentUser.id
    }
  });

  revalidatePath("/buyers");
  revalidatePath(`/crm/${buyerId}`);
}

// NEW: Update KYC Status
export async function updateKycStatus(clientId: string, formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") throw new Error("Only Admins can update KYC Status");

  const newStatus = formData.get("kycStatus") as any;

  await prisma.client.update({
    where: { id: clientId },
    data: { kycStatus: newStatus }
  });

  await prisma.clientActivity.create({
    data: {
      type: "COMPLIANCE_UPDATE",
      description: `KYC Compliance Status updated to ${newStatus}.`,
      clientId: clientId,
      userId: user.id
    }
  });

  await prisma.auditLog.create({
    data: { 
      action: "UPDATED_KYC", 
      details: `Updated KYC status for client ${clientId} to ${newStatus}`, 
      userId: user.id 
    }
  });

  revalidatePath(`/crm/${clientId}`);
  revalidatePath("/buyers");
}