"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function extractDealData(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    // 1. Convert the PDF into a Base64 string so the API can read it
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Google API Key is missing");

    // 2. Use Gemini 2.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive' // ⚡ THE FIX: Prevents ECONNRESET on large file uploads
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { 
              text: `You are an expert commodity trading assistant. Extract the trading parameters from the provided document.
              
              Return ONLY a valid JSON object. Do NOT wrap it in markdown formatting like \`\`\`json.
              
              Expected Schema:
              {
                "title": "Concise professional summary (e.g. 25,000 MT Sulphur)",
                "quantity": 25000, 
                "quantityUnit": "MT", 
                "price": 150, 
                "tolerance": "+/- 10% Vessel Option",
                "timeline": "1st week Jan 2026",
                "origin": "Oman", 
                "destination": "India", 
                "loadPort": "One safe port",
                "insurance": "Covered by seller",
                "incoterms": "CIF", 
                "paymentTerms": "100% LC at sight",
                "inspection": "SGS at loading port",
                "specs": "Brief 2-3 sentence summary of specs.",
                "keyTerms": [
                  {"label": "Purity", "value": "99.80% minimum"},
                  {"label": "Moisture", "value": "0.50% max"},
                  {"label": "Form", "value": "Granular"}
                ]
              }
              
              Extract any highly specific technical properties (like Purity, Ash, Moisture, Colour, etc.) into the keyTerms array.
              If a field is missing, use "" for text or null for numbers.`
            },
            { 
              // Native Gemini payload structure for documents
              inline_data: { 
                mime_type: file.type, 
                data: base64Data 
              } 
            }
          ]
        }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || "Google API Error");
    }

    // 3. Extract and parse the returned JSON
    const textOutput = result.candidates[0].content.parts[0].text;
    
    // Clean the output in case Gemini returns markdown code fences
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return { success: true, data: parsedData };
    
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return { success: false, error: "Failed to extract data from document." };
  }
}

export async function processAIPrompt(message: string) {
  const session = await getServerSession();
  
  let userName = "Team Member";
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userName = user.firstName;
  }

  // 1. Try to use the real Gemini AI API
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive' // ⚡ THE FIX: Applied here too for stability
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ 
              text: `You are the GlobCom AI Assistant, an internal ERP guide for GlobCom International FZE.
              The user you are speaking to is named ${userName}.
              Keep responses concise, helpful, and professional. Do not use complex markdown, just basic bolding/bullet points.
              
              Domain Knowledge:
              - SCO: Soft Corporate Offer (non-binding initial offer).
              - FCO: Full Corporate Offer (legally binding, requires approved KYC).
              - KYC: Requires Passport, Trade License, Proof of Funds (POF), Bank Reference Letter (BRL). Only Admins can approve KYC.
              
              User's Message: ${message}` 
            }]
          }]
        })
      });

      const result = await response.json();
      if (response.ok && result.candidates?.[0]?.content?.parts?.[0]?.text) {
         return result.candidates[0].content.parts[0].text;
      }
    }
  } catch(e) {
    console.error("Gemini Chat API Error:", e);
    // Suppress error and fall through to the local rules engine
  }

  // 2. FALLBACK: Local Rules Engine (If API fails or is missing)
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate thinking

  const prompt = message.toLowerCase();

  if (prompt.includes("sco") || prompt.includes("soft corporate offer")) {
    return `An **SCO (Soft Corporate Offer)** is a preliminary, non-binding document outlining the initial terms of supply.\n\n**How to draft one:**\n1. Open a Client profile in the CRM or go to the Trading board.\n2. Click the "Generate Official Proposal" button.\n3. Select "SCO" from the document type dropdown.`;
  }
  
  if (prompt.includes("fco") || prompt.includes("full corporate offer")) {
    return `An **FCO (Full Corporate Offer)** is a legally binding document issued after preliminary negotiations are complete.\n\nMake sure the client has an 'Approved' KYC Status before issuing an FCO to ensure compliance!`;
  }

  if (prompt.includes("kyc") || prompt.includes("compliance")) {
    return `**KYC (Know Your Customer) Requirements:**\nTo clear a corporate client, you must upload:\n- Signatory Passport\n- Official Trade License\n- Proof of Funds (POF)\n- Bank Reference Letter (BRL)\n\n*Note: Only users with the ADMIN role can change a client's status from PENDING to VERIFIED.*`;
  }

  if (prompt.includes("role") || prompt.includes("access") || prompt.includes("admin")) {
    return `**GlobCom Access Tiers:**\n- **Admin:** Supreme control. Can edit anyone's access, change global branding, and force-approve KYC.\n- **Management:** High-level oversight. Can manage standard users, but cannot edit Admin profiles.\n- **Trading Rep:** Standard Account Executive. Manages clients, demands, and deals.`;
  }

  if (prompt.includes("hello") || prompt.includes("hi") || prompt.includes("hey")) {
    return `Hello ${userName}! I am your GlobCom AI Assistant. I can help you understand the dashboard, guide you on how to draft contracts, or explain compliance rules. What do you need help with?`;
  }

  return `I am currently operating on my local fallback network and didn't quite catch that. \n\nI can answer questions about **SCOs, FCOs, KYC Compliance, and User Roles**.`;
}