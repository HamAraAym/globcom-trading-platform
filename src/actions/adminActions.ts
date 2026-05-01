"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { put } from "@vercel/blob"; // NEW: Using Vercel Blob for cloud storage
import bcrypt from "bcryptjs"; // NEW: Securing passwords

// Security Middleware: Ensure only ADMINs can access these functions
async function ensureAdmin() {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (user?.role !== "ADMIN") {
    throw new Error("SOP Violation: Admin privileges required.");
  }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  await ensureAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !currentStatus }
  });
  revalidatePath("/users");
}

export async function updateUserPermissions(userId: string, permissions: {
  canAddDeals?: boolean,
  canEditDeals?: boolean,
  canNegotiate?: boolean,
  role?: Role
}) {
  await ensureAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: permissions
  });
  revalidatePath("/users");
}

export async function createNewUser(formData: FormData) {
  await ensureAdmin();
  
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const rawPassword = formData.get("password") as string; 
  const role = formData.get("role") as Role;

  // Hash the password securely before saving to Neon DB
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      canAddDeals: true,
      canEditDeals: true,
      canNegotiate: true
    }
  });

  revalidatePath("/users");
}

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================

// Fetch Global Settings (Available to all authenticated users for the sidebar)
export async function getGlobalSettings() {
  // Upsert ensures the global config row always exists, even on a fresh database
  return await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", companyName: "GlobCom International FZE" }
  });
}

// Update Global Settings (Admins Only)
export async function updateGlobalSettings(formData: FormData) {
  await ensureAdmin();

  const companyName = formData.get("companyName") as string;
  const logo = formData.get("logo") as File | null;
  const removeLogo = formData.get("removeLogo") === "true";

  // Get current settings to preserve the existing logo if not changed
  const currentSettings = await getGlobalSettings();
  let companyLogoUrl = currentSettings.companyLogoUrl;

  if (removeLogo) {
    companyLogoUrl = null;
  } else if (logo && logo.size > 0 && logo.name !== "undefined") {
    if (logo.size > 5242880) throw new Error("Image exceeds 5MB limit."); // 5MB Limit
    
    // NEW: Upload straight to Vercel Blob
    const timestamp = Date.now();
    const cleanFileName = logo.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    
    const blob = await put(`settings/${timestamp}-${cleanFileName}`, logo, {
      access: "public",
    });

    companyLogoUrl = blob.url;
  }

  // Update Database
  await prisma.systemSettings.update({
    where: { id: "global" },
    data: {
      companyName,
      companyLogoUrl
    }
  });

  // Revalidate the entire layout so the sidebar instantly reflects the change everywhere
  revalidatePath("/", "layout");
}