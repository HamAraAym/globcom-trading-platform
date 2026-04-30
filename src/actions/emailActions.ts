"use server";

import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function dispatchToClient(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Fetch the sender's details for the email signature
  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, firstName: true, lastName: true, role: true }
  });

  if (!sender) throw new Error("User not found");

  // Parse incoming FormData
  const buyerId = formData.get("buyerId") as string;
  const contextId = formData.get("contextId") as string;
  const contextType = formData.get("contextType") as string;
  const title = formData.get("title") as string;
  const dispatchType = formData.get("dispatchType") as string;
  const customMessage = formData.get("customMessage") as string;
  const attachedDocsString = formData.get("attachedDocs") as string;

  const attachedDocs: string[] = attachedDocsString ? JSON.parse(attachedDocsString) : [];

  // 1. Verify the buyer exists
  const buyer = await prisma.client.findUnique({ where: { id: buyerId } });
  if (!buyer) throw new Error("Buyer not found");

  // 2. Fetch the Context Item (Demand or Supply) to get details for the email body
  let contextItem: any = null;
  if (contextType === "DEMAND") {
    contextItem = await prisma.demand.findUnique({ where: { id: contextId } });
  } else {
    contextItem = await prisma.supply.findUnique({ where: { id: contextId } });
  }

  if (!contextItem) throw new Error("Deal context not found");

  // 3. Configure SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Helpers for email content
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

  // 4. Build the Enterprise HTML Template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getSubject()}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
              
              <tr>
                <td style="background-color: #0f172a; padding: 30px 40px; text-align: left; border-bottom: 4px solid #4f46e5;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 1px;">GLOBCOM</h1>
                  <p style="margin: 4px 0 0 0; color: #818cf8; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">International FZE</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">Dear ${buyer.name},</p>
                  
                  ${customMessage ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #cbd5e1; color: #334155; font-style: italic;">
                      "${customMessage.replace(/\n/g, "<br>")}"
                    </div>
                  ` : ''}

                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                    ${getOpeningText()}
                  </p>

                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                    <div style="background-color: #4f46e5; height: 4px; width: 100%;"></div>
                    <div style="padding: 20px;">
                      <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #0f172a;">${title}</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 14px;">
                        <tr>
                          <td style="padding-bottom: 8px; color: #64748b;"><strong>Price:</strong> <span style="color: #059669;">${displayPrice}</span></td>
                          <td style="padding-bottom: 8px; color: #64748b;"><strong>Volume:</strong> <span style="color: #0f172a;">${quantity} ${unit}</span></td>
                        </tr>
                        <tr>
                          <td colspan="2" style="color: #64748b;"><strong>Timeline/Location:</strong> <span style="color: #0f172a;">${location}</span></td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  ${contextItem.specs ? `
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-wrap;">
                      ${contextItem.specs}
                    </p>
                  ` : ''}

                  ${attachedDocs.length > 0 ? `
                    <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Attached Official Documents</p>
                      <p style="margin: 0; color: #64748b; font-size: 12px;">Please find the official ${dispatchType} PDFs attached directly to this email.</p>
                    </div>
                  ` : ''}
                  
                  <p style="margin: 30px 0 0 0; font-size: 15px; color: #334155;">Best Regards,</p>
                  <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: bold; color: #0f172a;">GlobCom Trading Team</p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #f1f5f9; padding: 30px 40px; text-align: left; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${sender.firstName} ${sender.lastName}</p>
                  <p style="margin: 0 0 15px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">${sender.role.replace("_", " ")}</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; line-height: 1.5;">
                        <strong>GLOBCOM INTERNATIONAL FZE</strong><br>
                        P1-ELOB, Office No. E-10F-05<br>
                        Hamriyah Free Zone, Sharjah (UAE), P.O. 50096<br>
                        +971 50 5587858 | sales@globcomfze.com
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
            
            <p style="margin: 20px 0 0 0; font-size: 10px; color: #94a3b8; text-align: center;">
              This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 5. Send the Email via SMTP
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'GlobCom'}" <${process.env.SMTP_FROM_EMAIL || 'sales@globcomfze.com'}>`,
    to: buyer.email,
    subject: getSubject(),
    html: htmlTemplate,
    // Nodemailer will fetch the URLs and attach them as physical files to the email!
    attachments: attachedDocs.map((url, index) => ({
      filename: `${dispatchType}_${title.replace(/\s+/g, '_')}_Document_${index + 1}.pdf`,
      path: url 
    }))
  };

  await transporter.sendMail(mailOptions);

  // 6. Log the action in the CRM
  await prisma.clientActivity.create({
    data: {
      type: "EMAIL_SENT",
      description: `Dispatched ${dispatchType} email: "${title}" with ${attachedDocs.length} attachment(s).`,
      clientId: buyer.id,
      userId: sender.id,
    }
  });

  // 7. Log globally in the Audit Trail
  await prisma.auditLog.create({
    data: {
      action: "CLIENT_EMAIL_DISPATCHED",
      details: `Sent ${dispatchType} regarding ${title} to ${buyer.company || buyer.name} (${buyer.email})`,
      userId: sender.id
    }
  });

  // 8. Revalidate UI caches so the CRM and Chat reflect the newly sent email instantly
  revalidatePath(`/crm/${buyer.id}`);
  revalidatePath(`/chat/${contextId}`);

  return { success: true, message: `Secure email dispatched to ${buyer.email}` };
}