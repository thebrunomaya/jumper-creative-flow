// Helper function to get file extension from filename or MIME type
function getFileExtension(fileName: string, mimeType: string): string {
  // If filename already has extension, keep it
  if (fileName && fileName.includes('.')) {
    const parts = fileName.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length > 0) {
      return `.${parts[parts.length - 1]}`;
    }
  }
  
  // Infer from MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/json': '.json',
    'application/octet-stream': '.bin'
  };
  
  return mimeToExt[mimeType] || '.bin';
}

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

  // Create unique filename with timestamp and ensure extension
  const timestamp = Date.now();
  const extension = getFileExtension(fileName, mimeType);
  const baseName = fileName.includes('.') ? fileName.split('.')[0] : fileName;
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueFileName = `${timestamp}-${sanitizedBaseName}${extension}`;

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