"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

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
  const password = formData.get("password") as string; // In production, use an auto-gen + email invite system
  const role = formData.get("role") as Role;

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password, // Note: Ensure you hash passwords if not using a provider like Auth0
      role,
      isActive: true,
      canAddDeals: true,
      canEditDeals: true,
      canNegotiate: true
    }
  });

  revalidatePath("/users");
}