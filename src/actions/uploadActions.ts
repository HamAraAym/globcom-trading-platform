"use server";

import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";

/**
 * Uploads a file to Vercel Blob Storage.
 * @param formData FormData containing the 'file' object.
 * @returns The secure URL of the uploaded file.
 */
export async function uploadFileToCloud(formData: FormData) {
  // 1. Secure the route
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized upload attempt.");

  // 2. Extract the file from the payload
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided.");

  // 3. Generate a clean, unique filename
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, ""); // Sanitize
  const uniquePath = `uploads/${timestamp}-${cleanFileName}`;

  // 4. Beam it to Vercel Blob
  const blob = await put(uniquePath, file, {
    access: "public", // Makes the URL accessible for viewing/downloading
    addRandomSuffix: false, // We already made it unique above
  });

  // 5. Return the permanent cloud URL
  return blob.url;
}