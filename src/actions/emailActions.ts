"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function dispatchToClient(formData: FormData) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const buyerId = formData.get("buyerId") as string;
  const contextId = formData.get("contextId") as string;
  const contextType = formData.get("contextType") as string; // 'DEMAND' or 'SUPPLY'
  const title = formData.get("title") as string;

  // 1. Verify the buyer exists
  const buyer = await prisma.externalBuyer.findUnique({ where: { id: buyerId } });
  if (!buyer) throw new Error("Buyer not found");

  // =========================================================================
  // 📧 PRODUCTION EMAIL INTEGRATION POINT
  // =========================================================================
  // In production, you would use Resend, SendGrid, or Nodemailer here.
  // Example using Resend (https://resend.com):
  // 
  // await resend.emails.send({
  //   from: 'trading@globcom.com',
  //   to: buyer.email,
  //   subject: `GlobCom Private Listing: ${title}`,
  //   html: `<h1>GlobCom Internal FZE</h1><p>Dear ${buyer.name}, here are the details...</p>`,
  //   attachments: [...] // Fetch from your Supabase storage
  // });
  // =========================================================================

  // Simulate network delay for the email server
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 2. Log this action in your Audit Trail (Crucial for SOP Compliance!)
  console.log(`[AUDIT] User ${session.user?.email} dispatched ${contextType} (${contextId}) to ${buyer.email}`);

  return { success: true, message: `Secure email dispatched to ${buyer.email}` };
}