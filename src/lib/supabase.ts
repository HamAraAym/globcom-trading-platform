import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to upload a file and return its public URL
export async function uploadFileToSupabase(file: File) {
  try {
    // 1. Create a unique file name so files don't overwrite each other
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // 2. Upload the file to your 'globcom-media' bucket
    const { data, error } = await supabase.storage
      .from('globcom-media')
      .upload(filePath, file);

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // 3. Get the public URL so we can save it to your database
    const { data: publicUrlData } = supabase.storage
      .from('globcom-media')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}