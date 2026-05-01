"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob"; // NEW: Vercel Blob Storage
import { DocumentType } from "@prisma/client";

export async function saveGeneratedDocument(formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    // Extract fields from the form data
    const clientId = formData.get("clientId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as DocumentType;
    const pdfFile = formData.get("pdf") as File;
    const demandId = formData.get("demandId") as string | null;
    const supplyId = formData.get("supplyId") as string | null;

    if (!pdfFile || pdfFile.size === 0) {
      throw new Error("No valid PDF generated.");
    }

    // 1. Upload the generated PDF to Vercel Blob
    const timestamp = Date.now();
    const cleanFileName = pdfFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const blob = await put(`documents/${timestamp}-${cleanFileName}`, pdfFile, {
      access: 'public',
    });
    const fileUrl = blob.url;

    if (!fileUrl) {
      throw new Error("Failed to upload document to secure storage.");
    }

    // 2. Save the Document record in the database
    const document = await prisma.document.create({
      data: {
        title,
        type,
        fileUrl,
        clientId,
        generatedById: user.id,
        demandId: demandId || null,
        supplyId: supplyId || null,
      }
    });

    // 3. Automatically log this action to the CRM Activity Timeline
    await prisma.clientActivity.create({
      data: {
        type: "DOCUMENT_GENERATED",
        description: `Generated official ${type}: ${title}`,
        clientId,
        userId: user.id,
      }
    });

    // 4. Log to the Master Audit Log for admin compliance
    await prisma.auditLog.create({
      data: {
        action: "DOCUMENT_GENERATED",
        details: `Generated ${type} for client ${clientId}`,
        userId: user.id,
      }
    });

    // Refresh the client profile so the timeline updates instantly in the UI
    revalidatePath(`/crm/${clientId}`);
    
    return { success: true, document };
    
  } catch (error) {
    console.error("Document Generation Error:", error);
    throw new Error("Failed to save the generated document.");
  }
}