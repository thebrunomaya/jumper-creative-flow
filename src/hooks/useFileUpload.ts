import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  statusCode?: number;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFileToStorage = async (
    file: File,
    fileName: string,
    bucketName: string = 'creative-files'
  ): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      console.log(`🔄 Uploading file: ${fileName} (${Math.round(file.size / 1024 / 1024)}MB)`);
      
      // Check file size before upload (different limits for different file types)
      const fileSizeMB = Math.round(file.size / 1024 / 1024);
      const maxSizeMB = 200; // 200MB limit aligned with Supabase bucket
      
      console.log(`📊 File size check: ${fileSizeMB}MB (limit: ${maxSizeMB}MB)`);
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        const errorMsg = `Arquivo muito grande: ${fileSizeMB}MB. Limite máximo: ${maxSizeMB}MB`;
        console.error(`❌ File size exceeded: ${fileSizeMB}MB > ${maxSizeMB}MB`);
        toast({
          title: "Arquivo muito grande",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false, error: errorMsg };
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        
        let errorMessage = "Erro no upload do arquivo";
        let statusCode = 500;
        
        // Handle specific error types
        if (error.message?.includes('413') || error.message?.includes('too large')) {
          errorMessage = "Arquivo acima do limite do Storage (1GB máx)";
          statusCode = 413;
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          errorMessage = "Não autorizado para fazer upload";
          statusCode = 401;
        } else if (error.message?.includes('409') || error.message?.includes('already exists')) {
          errorMessage = "Arquivo já existe";
          statusCode = 409;
        }
        
        toast({
          title: "Erro no upload",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: errorMessage, 
          statusCode 
        };
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      console.log(`✅ File uploaded successfully: ${urlData.publicUrl}`);
      
      return { 
        success: true, 
        url: urlData.publicUrl 
      };
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = `Erro inesperado no upload: ${error.message}`;
      
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFileToStorage,
    isUploading
  };
};