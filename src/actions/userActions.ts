"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; // Vercel Blob Storage
import crypto from "crypto";
import { Resend } from "resend";
import InviteEmail from "@/emails/InviteEmail";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// Initialize Resend for emails
const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// 1. UPDATE USER PROFILE (Existing Logic)
// ==========================================
export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User profile not found");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const letterhead = formData.get("letterhead") as File | null;
  const removeLetterhead = formData.get("removeLetterhead") === "true"; 

  let letterheadUrl = user.letterheadUrl; 

  if (user.role === "ADMIN") {
    if (removeLetterhead) {
      letterheadUrl = null;
    } else if (letterhead && letterhead.size > 0 && letterhead.name !== "undefined") {
      if (letterhead.size > 5242880) throw new Error("Image exceeds 5MB limit."); 
      
      const timestamp = Date.now();
      const cleanFileName = letterhead.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const blob = await put(`users/${timestamp}-${cleanFileName}`, letterhead, {
        access: 'public',
      });
      letterheadUrl = blob.url;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      ...(user.role === "ADMIN" && { letterheadUrl })
    }
  });

  revalidatePath("/settings");
  revalidatePath("/chat"); 
}

// ==========================================
// 2. SEND USER INVITATION (Admin Only)
// ==========================================
export async function sendUserInvite(email: string, role: Role) {
  try {
    // Basic auth check to ensure only logged-in users trigger this
    const session = await getServerSession();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "User already exists." };

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // Expires in 48 hours

    // Save token to database
    await prisma.invitation.upsert({
      where: { email },
      update: { token, role, expires },
      create: { email, role, token, expires },
    });

    // Construct the Magic Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; 
    const inviteLink = `${baseUrl}/accept-invite?token=${token}`;

    // Send the Email
    await resend.emails.send({
      from: "GlobCom Admin <admin@harjot.ae>", 
      to: email,
      subject: "Invitation to join GlobCom ERP",
      react: InviteEmail({ inviteLink, role }),
    });

    revalidatePath("/users"); // Refresh the users page to show pending invites if you add a table for it
    return { success: true };
  } catch (error) {
    console.error("Invite Error:", error);
    return { success: false, error: "Failed to send invite." };
  }
}

// ==========================================
// 3. ACCEPT INVITATION (Public Route)
// ==========================================
export async function acceptInvitation(formData: FormData) {
  const token = formData.get("token") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const password = formData.get("password") as string;

  if (!token || !firstName || !lastName || !password) {
    throw new Error("Missing required fields");
  }

  // Verify token
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.expires < new Date()) {
    throw new Error("Invalid or expired token");
  }

  // Hash the new password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the official user account
  await prisma.user.create({
    data: {
      email: invitation.email,
      firstName,
      lastName,
      password: hashedPassword,
      role: invitation.role,
    },
  });

  // Delete the used invitation so it can't be reused
  await prisma.invitation.delete({ where: { id: invitation.id } });

  // Send them to the login page!
  redirect("/login?registered=true");
}