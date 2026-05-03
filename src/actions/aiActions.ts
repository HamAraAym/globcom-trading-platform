"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export async function extractDealData(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    // Convert the uploaded file into a buffer the AI can read
    const buffer = Buffer.from(await file.arrayBuffer());

    // Call Gemini 1.5 Flash (Super fast and perfectly suited for document reading)
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: `You are an expert commodity trading assistant. Your job is to extract trading parameters from the provided document (SCO, FCO, or Spec Sheet) and return them as strict JSON. 
      If a field is not found in the document, return an empty string for text, or null for numbers.
      For the title, create a concise, professional summary (e.g., '50,000 MT Granular Urea').
      For the specs field, write a brief 2-3 sentence summary of the product specifications or purity.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the exact deal terms from this document." },
            
            // FIX: Cast as 'any' to bypass the overly strict/outdated FilePart TS definition, 
            // while ensuring Gemini still gets the required mimeType payload.
            { type: "file", mimeType: file.type, data: buffer } as any 
          ]
        }
      ],
      // ZOD ensures the AI returns EXACTLY this format, so it never breaks our app
      schema: z.object({
        title: z.string().describe("A professional title for the deal"),
        quantity: z.number().nullable().describe("The exact numerical quantity"),
        quantityUnit: z.string().describe("Unit of measurement, usually MT, BBL, or Gallons"),
        price: z.number().nullable().describe("The exact numerical price per unit"),
        incoterms: z.string().describe("Shipping terms like FOB, CIF, DAP"),
        origin: z.string().describe("Country or port of origin"),
        destination: z.string().describe("Destination port or country"),
        specs: z.string().describe("Summary of the product specs and purity"),
      })
    });

    return { success: true, data: object };
    
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return { success: false, error: "Failed to extract data from document." };
  }
}