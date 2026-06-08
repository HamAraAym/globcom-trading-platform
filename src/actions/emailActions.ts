"use server";

import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import OfficialProposalEmail from "@/emails/OfficialProposalEmail";
import SystemAlertEmail from "@/emails/SystemAlertEmail"; // ⚡ New Template
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// 1. EXTERNAL: CLIENT PROPOSAL DISPATCH
// ==========================================
export async function dispatchToClient(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, firstName: true, lastName: true, role: true }
  });

  if (!sender) throw new Error("User not found");

  const buyerId = formData.get("buyerId") as string;
  const contextId = formData.get("contextId") as string;
  const contextType = formData.get("contextType") as string;
  const title = formData.get("title") as string;
  const dispatchType = formData.get("dispatchType") as string;
  const customMessage = formData.get("customMessage") as string;
  const attachedDocsString = formData.get("attachedDocs") as string;
  const attachedDocs: string[] = attachedDocsString ? JSON.parse(attachedDocsString) : [];

  const buyer = await prisma.client.findUnique({ where: { id: buyerId } });
  if (!buyer) throw new Error("Buyer not found");

  let contextItem: any = null;
  if (contextType === "DEMAND") {
    contextItem = await prisma.demand.findUnique({ where: { id: contextId } });
  } else {
    contextItem = await prisma.supply.findUnique({ where: { id: contextId } });
  }

  if (!contextItem) throw new Error("Deal context not found");

  const getSubject = () => {
    switch (dispatchType) {
      case "LOI": return `Official Letter of Interest (LOI): ${title}`;
      case "FCO": return `Full Corporate Offer (FCO): ${title}`;
      case "SCO": return `Soft Corporate Offer (SCO): ${title}`;
      default: return `GlobCom Private Listing: ${title}`;
    }
  };

  const getOpeningText = () => {
    switch (dispatchType) {
      case "LOI": return "We are pleased to issue the following Letter of Interest (LOI) declaring our readiness to purchase the commodity detailed below:";
      case "FCO": return "We are pleased to issue this binding Full Corporate Offer (FCO) for the supply of the commodity detailed below:";
      case "SCO": return "For preliminary discussion purposes, please review this Soft Corporate Offer (SCO) for the following commodity:";
      default: return "Please find the requested details for our currently available commodity below:";
    }
  };

  const price = contextItem.price || contextItem.targetPrice;
  const displayPrice = price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price) : "TBD";
  const quantity = new Intl.NumberFormat().format(contextItem.quantity);
  const unit = contextItem.quantityUnit || "MT";
  const location = contextItem.location || contextItem.timeline || "Not specified";

  // Process attachments for Resend
  const processedAttachments = await Promise.all(
    attachedDocs.map(async (url, index) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return {
        filename: `${dispatchType}_${title.replace(/\s+/g, '_')}_Document_${index + 1}.pdf`,
        content: buffer,
      };
    })
  );

  // Send the Email via Resend
  const { data, error } = await resend.emails.send({
    from: "GlobCom Trading <onboarding@resend.dev>", 
    to: [buyer.email],
    subject: getSubject(),
    react: OfficialProposalEmail({
      buyerName: buyer.name,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderRole: sender.role,
      title: title,
      dispatchType: dispatchType,
      customMessage: customMessage,
      openingText: getOpeningText(),
      displayPrice: displayPrice,
      quantity: quantity,
      unit: unit,
      location: location,
      specs: contextItem.specs || "",
      attachedDocsCount: attachedDocs.length,
      dealLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/proposal/${contextId}`,
    }) as React.ReactElement,
    attachments: processedAttachments
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error("Failed to send email");
  }

  // Log the action
  await prisma.clientActivity.create({
    data: {
      type: "EMAIL_SENT",
      description: `Dispatched ${dispatchType} email: "${title}" with ${attachedDocs.length} attachment(s).`,
      clientId: buyer.id,
      userId: sender.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "CLIENT_EMAIL_DISPATCHED",
      details: `Sent ${dispatchType} regarding ${title} to ${buyer.company || buyer.name} (${buyer.email})`,
      userId: sender.id
    }
  });

  revalidatePath(`/crm/${buyer.id}`);
  revalidatePath(`/chat/${contextId}`);

  return { success: true, message: `Email dispatched to ${buyer.email}` };
}

// ==========================================
// 2. INTERNAL: SYSTEM ALERT NOTIFICATIONS
// ==========================================
export async function sendSystemAlertEmail(data: {
  toEmail: string;
  userName: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: "GlobCom Alerts <onboarding@resend.dev>", // NOTE: Change to verified domain later
      to: [data.toEmail],
      subject: `System Alert: ${data.title}`,
      react: SystemAlertEmail({
        userName: data.userName,
        title: data.title,
        message: data.message,
        link: data.link ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${data.link}` : undefined,
      }) as React.ReactElement,
    });

    if (error) {
      console.error("Resend System Alert Error:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send system alert email:", error);
    return { success: false, error };
  }
}