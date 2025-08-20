// Transactional file upload system with automatic rollback
// Ensures file uploads are atomic - either all succeed or all are cleaned up

interface UploadTransaction {
  id: string;
  uploadedFiles: Array<{
    fileName: string;
    publicUrl: string;
    bucket: string;
  }>;
  timestamp: number;
}

interface TransactionalUploadResult {
  success: boolean;
  files: Array<{
    name: string;
    url: string;
    format?: string;
  }>;
  transactionId: string;
  error?: any;
}

// Global transaction registry to track uploads in progress
const activeTransactions = new Map<string, UploadTransaction>();

// Generate unique transaction ID
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Upload files as a transaction - all succeed or all are rolled back
export async function uploadFilesTransactionally(
  fileInfos: Array<{ name: string; type: string; size: number; format?: string; base64Data?: string; url?: string; instagramUrl?: string }>,
  supabase: any,
  bucketName = 'creative-files'
): Promise<TransactionalUploadResult> {
  const transactionId = generateTransactionId();
  console.log(`🔄 Starting transactional upload: ${transactionId} (${fileInfos.length} files)`);
  
  const transaction: UploadTransaction = {
    id: transactionId,
    uploadedFiles: [],
    timestamp: Date.now()
  };
  
  activeTransactions.set(transactionId, transaction);
  
  const uploadedFiles: Array<{ name: string; url: string; format?: string }> = [];
  let lastError: any = null;
  
  try {
    for (const fileInfo of fileInfos) {
      try {
        if (fileInfo.base64Data) {
          console.log(`📤 Uploading file: ${fileInfo.name} (${fileInfo.size} bytes)`);
          
          // Convert base64 to blob
          const binaryString = atob(fileInfo.base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create unique filename with timestamp
          const timestamp = Date.now();
          const extension = getFileExtension(fileInfo.name, fileInfo.type);
          const baseName = fileInfo.name.includes('.') ? fileInfo.name.split('.')[0] : fileInfo.name;
          const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
          const uniqueFileName = `tx_${transactionId}_${timestamp}_${sanitizedBaseName}${extension}`;

          // Upload to Supabase Storage with transaction prefix
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uniqueFileName, bytes, {
              contentType: fileInfo.type,
              upsert: false
            });

          if (error) {
            throw new Error(`Upload failed for ${fileInfo.name}: ${error.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uniqueFileName);

          // Track in transaction
          transaction.uploadedFiles.push({
            fileName: uniqueFileName,
            publicUrl: urlData.publicUrl,
            bucket: bucketName
          });

          uploadedFiles.push({
            name: fileInfo.name,
            url: urlData.publicUrl,
            format: fileInfo.format
          });

          console.log(`✅ File uploaded successfully: ${fileInfo.name} -> ${uniqueFileName}`);
          
        } else if (fileInfo.url) {
          // File already uploaded, just track it
          console.log(`🔗 Using existing file URL: ${fileInfo.name} -> ${fileInfo.url}`);
          uploadedFiles.push({
            name: fileInfo.name,
            url: fileInfo.url,
            format: fileInfo.format
          });
          
        } else if (fileInfo.instagramUrl) {
          // Instagram URL, just track it
          console.log(`🔗 Using Instagram URL: ${fileInfo.instagramUrl}`);
          uploadedFiles.push({
            name: fileInfo.name,
            url: fileInfo.instagramUrl,
            format: fileInfo.format
          });
          
        } else {
          console.warn(`⚠️ No valid data source for file: ${fileInfo.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Upload failed for file ${fileInfo.name}:`, error);
        lastError = error;
        
        // Rollback all uploaded files in this transaction
        await rollbackTransaction(transactionId, supabase);
        
        return {
          success: false,
          files: [],
          transactionId,
          error: error
        };
      }
    }
    
    // All uploads successful - commit transaction
    console.log(`✅ Transaction ${transactionId} completed successfully`);
    activeTransactions.delete(transactionId);
    
    return {
      success: true,
      files: uploadedFiles,
      transactionId
    };
    
  } catch (error) {
    console.error(`❌ Transaction ${transactionId} failed:`, error);
    await rollbackTransaction(transactionId, supabase);
    
    return {
      success: false,
      files: [],
      transactionId,
      error: error
    };
  }
}

// Rollback a transaction by deleting all uploaded files
async function rollbackTransaction(transactionId: string, supabase: any): Promise<void> {
  const transaction = activeTransactions.get(transactionId);
  if (!transaction) {
    console.warn(`⚠️ Transaction ${transactionId} not found for rollback`);
    return;
  }
  
  console.log(`🔄 Rolling back transaction ${transactionId} (${transaction.uploadedFiles.length} files)`);
  
  const deletionPromises = transaction.uploadedFiles.map(async (file) => {
    try {
      const { error } = await supabase.storage
        .from(file.bucket)
        .remove([file.fileName]);
      
      if (error) {
        console.error(`❌ Failed to delete file ${file.fileName}:`, error);
      } else {
        console.log(`🗑️ Deleted file: ${file.fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting file ${file.fileName}:`, error);
    }
  });
  
  // Wait for all deletions to complete (best effort)
  await Promise.allSettled(deletionPromises);
  
  // Remove transaction from registry
  activeTransactions.delete(transactionId);
  console.log(`✅ Transaction ${transactionId} rollback completed`);
}

// Cleanup old transactions (safety mechanism for orphaned files)
export async function cleanupOldTransactions(supabase: any, maxAgeMs = 24 * 60 * 60 * 1000): Promise<void> {
  const now = Date.now();
  const expiredTransactions = Array.from(activeTransactions.entries())
    .filter(([_, transaction]) => now - transaction.timestamp > maxAgeMs);
  
  if (expiredTransactions.length === 0) {
    return;
  }
  
  console.log(`🧹 Cleaning up ${expiredTransactions.length} expired transactions`);
  
  for (const [transactionId, _] of expiredTransactions) {
    await rollbackTransaction(transactionId, supabase);
  }
}

// Helper function to get file extension
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
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi'
  };
  
  return mimeToExt[mimeType] || '.bin';
}

// Enhanced file upload with transaction support
export async function uploadFileToSupabaseTransactional(
  fileName: string,
  base64Data: string,
  mimeType: string,
  supabase: any,
  transactionId?: string
): Promise<string> {
  const effectiveTransactionId = transactionId || generateTransactionId();
  
  const result = await uploadFilesTransactionally(
    [{
      name: fileName,
      type: mimeType,
      size: base64Data.length,
      base64Data: base64Data
    }],
    supabase
  );
  
  if (!result.success) {
    throw new Error(`Transactional upload failed: ${result.error?.message}`);
  }
  
  return result.files[0].url;
}