"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ClientType } from "@prisma/client";
import { put } from "@vercel/blob"; 

export async function createBuyer(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const type = (formData.get("type") as ClientType) || "CORPORATE";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string | null;

  const company = type === "CORPORATE" ? (formData.get("company") as string | null) : null;
  const registrationNo = type === "CORPORATE" ? (formData.get("registrationNo") as string | null) : null;
  const website = type === "CORPORATE" ? (formData.get("website") as string | null) : null;

  const area = formData.get("area") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;

  const addressParts = [area, city, country].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  // File URL Variables
  let tradeLicenseUrl = null;
  let passportUrl = null;
  let proofOfFundsUrl = null;
  let bankReferenceUrl = null;
  let companyProfileUrl = null;

  // 1. Process Passport (For Both Types)
  const passportFile = formData.get("passport") as File | null;
  if (passportFile && passportFile.size > 0 && passportFile.name !== 'undefined') {
    const timestamp = Date.now();
    const cleanFileName = passportFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`kyc/${timestamp}-${cleanFileName}`, passportFile, { access: 'public' });
    passportUrl = blob.url;
  }

  // 2. Process Proof of Funds (POF)
  const pofFile = formData.get("proofOfFunds") as File | null;
  if (pofFile && pofFile.size > 0 && pofFile.name !== 'undefined') {
    const timestamp = Date.now();
    const cleanFileName = pofFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`kyc/${timestamp}-${cleanFileName}`, pofFile, { access: 'public' });
    proofOfFundsUrl = blob.url;
  }

  // 3. Process Bank Reference Letter (BRL)
  const brlFile = formData.get("bankReference") as File | null;
  if (brlFile && brlFile.size > 0 && brlFile.name !== 'undefined') {
    const timestamp = Date.now();
    const cleanFileName = brlFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`kyc/${timestamp}-${cleanFileName}`, brlFile, { access: 'public' });
    bankReferenceUrl = blob.url;
  }

  // 4. Process Corporate-Specific Documents
  if (type === "CORPORATE") {
    const tradeLicenseFile = formData.get("tradeLicense") as File | null;
    if (tradeLicenseFile && tradeLicenseFile.size > 0 && tradeLicenseFile.name !== 'undefined') {
      const timestamp = Date.now();
      const cleanFileName = tradeLicenseFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`kyc/${timestamp}-${cleanFileName}`, tradeLicenseFile, { access: 'public' });
      tradeLicenseUrl = blob.url;
    }

    const profileFile = formData.get("companyProfile") as File | null;
    if (profileFile && profileFile.size > 0 && profileFile.name !== 'undefined') {
      const timestamp = Date.now();
      const cleanFileName = profileFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`kyc/${timestamp}-${cleanFileName}`, profileFile, { access: 'public' });
      companyProfileUrl = blob.url;
    }
  }

  // Save to Database
  const newClient = await prisma.client.create({
    data: {
      type, name, company, email, phone, address, country,
      registrationNo, website, 
      tradeLicenseUrl, 
      passportUrl,
      proofOfFundsUrl,    // NEW
      bankReferenceUrl,   // NEW
      companyProfileUrl,  // NEW
      kycStatus: "PENDING", 
    }
  });

  await prisma.clientActivity.create({
    data: { type: "ACCOUNT_CREATED", description: `Client profile created as a ${type} entity.`, clientId: newClient.id, userId: user.id }
  });

  await prisma.auditLog.create({
    data: { action: "CREATED_CLIENT", details: `Added new client: ${name} ${company ? `(${company})` : ''}`, userId: user.id }
  });

  // 🔔 NOTIFICATION: Alert Admins about pending KYC
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: "KYC Pending: New Client",
        message: `${user.firstName} registered ${company || name}. Compliance review required.`,
        link: `/crm/${newClient.id}`,
      }))
    });
  }

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

  const client = await prisma.client.update({
    where: { id: buyerId },
    data: { assignedRepId }
  });

  const assignedUser = assignedRepId ? await prisma.user.findUnique({ where: { id: assignedRepId } }) : null;
  const repName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned';

  await prisma.clientActivity.create({
    data: { type: "REP_ASSIGNED", description: `Account Executive assignment updated to: ${repName}`, clientId: buyerId, userId: currentUser.id }
  });

  // 🔔 NOTIFICATION: Alert the new Rep they were assigned
  if (assignedUser && assignedUser.id !== currentUser.id) {
    await prisma.notification.create({
      data: {
        userId: assignedUser.id,
        title: "New Account Assigned",
        message: `You have been assigned as the Account Executive for ${client.company || client.name}.`,
        link: `/crm/${client.id}`,
      }
    });
  }

  revalidatePath("/buyers");
  revalidatePath(`/crm/${buyerId}`);
}

export async function updateKycStatus(clientId: string, formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") throw new Error("Only Admins can update KYC Status");

  const newStatus = formData.get("kycStatus") as any;

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { kycStatus: newStatus }
  });

  await prisma.clientActivity.create({
    data: { type: "COMPLIANCE_UPDATE", description: `KYC Compliance Status updated to ${newStatus}.`, clientId: clientId, userId: user.id }
  });

  await prisma.auditLog.create({
    data: { action: "UPDATED_KYC", details: `Updated KYC status for client ${clientId} to ${newStatus}`, userId: user.id }
  });

  // 🔔 NOTIFICATION: Alert the assigned rep of the KYC decision
  if (client.assignedRepId && client.assignedRepId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: client.assignedRepId,
        title: `KYC Status: ${newStatus}`,
        message: `The compliance status for ${client.company || client.name} has been updated to ${newStatus}.`,
        link: `/crm/${client.id}`,
      }
    });
  }

  revalidatePath(`/crm/${clientId}`);
  revalidatePath("/buyers");
}

export async function updateBuyer(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Client ID is missing");

  const name = formData.get("name") as string;
  const company = formData.get("company") as string | null;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string | null;
  const address = formData.get("address") as string | null;
  const website = formData.get("website") as string | null;
  const registrationNo = formData.get("registrationNo") as string | null;

  await prisma.client.update({
    where: { id },
    data: { name, company, email, phone, address, website, registrationNo }
  });

  await prisma.auditLog.create({
    data: { action: "UPDATED_CLIENT", details: `Updated profile for client: ${company || name}`, userId: user.id }
  });

  revalidatePath(`/crm/${id}`);
  revalidatePath("/buyers");
  
  return { success: true };
}