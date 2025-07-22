import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ErrorLogData {
  error_type: string;
  message: string;
  stack_trace?: string;
  url?: string;
  component_name?: string;
  severity?: 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

export const useErrorLogger = () => {
  const { currentUser } = useAuth();

  const logError = useCallback(async (errorData: ErrorLogData) => {
    try {
      const logPayload = {
        ...errorData,
        url: errorData.url || window.location.href,
        user_email: currentUser?.email || 'anonymous',
        user_agent: navigator.userAgent,
        severity: errorData.severity || 'error',
        metadata: {
          ...errorData.metadata,
          timestamp: new Date().toISOString(),
          user_id: currentUser?.id,
          manager_name: currentUser?.name
        }
      };

      console.log('Logging error:', errorData.error_type, '-', errorData.message);

      const { data, error } = await supabase.functions.invoke('log-error', {
        body: logPayload
      });

      if (error) {
        console.error('Failed to log error:', error);
        return false;
      }

      console.log('✅ Error logged successfully:', data?.log_id);
      return true;

    } catch (err) {
      console.error('Error in useErrorLogger:', err);
      return false;
    }
  }, [currentUser]);

  const logComponentError = useCallback((error: Error, componentName: string, metadata?: Record<string, any>) => {
    return logError({
      error_type: 'React Component Error',
      message: error.message,
      stack_trace: error.stack,
      component_name: componentName,
      severity: 'error',
      metadata
    });
  }, [logError]);

  const logApiError = useCallback((error: any, apiName: string, endpoint?: string, metadata?: Record<string, any>) => {
    const errorMessage = error?.message || error?.error || String(error);
    return logError({
      error_type: 'API Error',
      message: `${apiName}: ${errorMessage}`,
      stack_trace: error?.stack,
      component_name: apiName,
      severity: 'error',
      metadata: {
        ...metadata,
        endpoint,
        status: error?.status,
        statusText: error?.statusText
      }
    });
  }, [logError]);

  const logValidationError = useCallback((fieldName: string, message: string, formData?: any) => {
    return logError({
      error_type: 'Validation Error',
      message: `${fieldName}: ${message}`,
      component_name: 'Form Validation',
      severity: 'warning',
      metadata: {
        field_name: fieldName,
        form_data: formData
      }
    });
  }, [logError]);

  const logUploadError = useCallback((fileName: string, error: any, metadata?: Record<string, any>) => {
    return logError({
      error_type: 'Upload Error',
      message: `Failed to upload ${fileName}: ${error?.message || String(error)}`,
      component_name: 'File Upload',
      severity: 'error',
      metadata: {
        ...metadata,
        file_name: fileName,
        file_size: metadata?.file_size,
        file_type: metadata?.file_type
      }
    });
  }, [logError]);

  return {
    logError,
    logComponentError,
    logApiError,
    logValidationError,
    logUploadError
  };
};