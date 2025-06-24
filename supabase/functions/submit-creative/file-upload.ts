
export const uploadFileToSupabase = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  supabase: any
): Promise<string> => {
  console.log(`🔄 Starting upload for file: ${fileName}, type: ${mimeType}, size: ${base64Data.length} chars`);
  
  // Convert base64 to blob
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${timestamp}-${fileName}`;

  console.log(`📤 Uploading to Supabase with filename: ${uniqueFileName}`);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('creative-files')
    .upload(uniqueFileName, bytes, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase storage error:', error);
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  console.log(`✅ File uploaded successfully:`, data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('creative-files')
    .getPublicUrl(uniqueFileName);

  console.log(`🔗 Generated public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
};
