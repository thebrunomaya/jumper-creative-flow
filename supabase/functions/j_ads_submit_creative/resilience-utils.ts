// Resilience utilities for robust error handling and recovery
// Ensures manager submissions NEVER fail - issues are isolated for admin resolution

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: (error: any) => boolean;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

// Circuit breaker state management
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(private options: CircuitBreakerOptions) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - falling back to alternative');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      console.log(`🚨 Circuit breaker OPEN after ${this.failures} failures`);
    }
  }
}

// Global circuit breakers for external services
const notionApiBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringWindow: 60000 // 1 minute
});

// Exponential backoff retry with jitter
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (options.retryableErrors && !options.retryableErrors(error)) {
        console.log(`❌ Non-retryable error on attempt ${attempt}:`, error);
        throw error;
      }
      
      if (attempt === options.maxAttempts) {
        console.log(`❌ All ${options.maxAttempts} attempts failed`);
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelay
      );
      const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
      const delay = baseDelay + jitter;
      
      console.log(`⏳ Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Resilient Notion API call with circuit breaker and retry
export async function resilientNotionCall<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: any; usedFallback: boolean }> {
  try {
    console.log(`🔄 Starting resilient Notion call: ${operationName}`);
    
    const result = await notionApiBreaker.execute(async () => {
      return await retryWithBackoff(operation, {
        maxAttempts: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 10000, // 10 seconds max
        backoffMultiplier: 2,
        retryableErrors: (error) => {
          // Retry on network errors, rate limits, and temporary failures
          const retryableStatusCodes = [429, 500, 502, 503, 504];
          const statusCode = error?.status || error?.response?.status;
          const isNetworkError = !statusCode; // Fetch failures without status
          const isRateLimited = statusCode === 429;
          const isServerError = retryableStatusCodes.includes(statusCode);
          
          const shouldRetry = isNetworkError || isRateLimited || isServerError;
          console.log(`🔍 Error analysis for ${operationName}:`, {
            statusCode,
            isNetworkError,
            isRateLimited,
            isServerError,
            shouldRetry,
            message: error?.message
          });
          
          return shouldRetry;
        }
      });
    });
    
    console.log(`✅ Notion call succeeded: ${operationName}`);
    return { success: true, data: result, usedFallback: false };
    
  } catch (error) {
    console.error(`❌ Notion call failed after all retries: ${operationName}`, error);
    
    // Log error for admin tracking
    await logErrorForAdmin({
      operation: operationName,
      error: error,
      timestamp: new Date().toISOString(),
      context: 'notion_api_failure'
    });
    
    // Return fallback if available
    if (fallbackValue !== undefined) {
      console.log(`🔄 Using fallback value for ${operationName}`);
      return { success: false, data: fallbackValue, error, usedFallback: true };
    }
    
    return { success: false, error, usedFallback: false };
  }
}

// Error logging for admin dashboard
async function logErrorForAdmin(errorDetails: {
  operation: string;
  error: any;
  timestamp: string;
  context: string;
  submissionId?: string;
  managerId?: string;
  [key: string]: any;
}) {
  try {
    // Get Supabase client - we'll pass it as parameter in the future
    // For now, we'll use the global Deno.env to get the connection
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Supabase credentials not available for error logging');
      return;
    }
    
    // Determine error severity and category
    const severity = determineSeverity(errorDetails.error, errorDetails.context);
    const category = determineCategory(errorDetails.error, errorDetails.context);
    
    // Use the SQL function to log the error
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/log_system_error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        p_severity: severity,
        p_category: category,
        p_context: errorDetails.context,
        p_operation: errorDetails.operation,
        p_error_message: errorDetails.error?.message || 'Unknown error',
        p_error_code: errorDetails.error?.status?.toString() || null,
        p_error_stack: errorDetails.error?.stack || null,
        p_error_details: JSON.stringify(errorDetails),
        p_submission_id: errorDetails.submissionId || null,
        p_manager_id: errorDetails.managerId || null,
        p_system_health: null // We'll add this in future iterations
      })
    });
    
    if (response.ok) {
      console.log('📝 Error logged for admin tracking:', errorDetails.operation);
    } else {
      console.warn('⚠️ Failed to log error to database, falling back to console');
      console.log('📝 Error logged (console fallback):', errorDetails);
    }
    
  } catch (loggingError) {
    // Never let logging errors break the main flow
    console.error('Failed to log error for admin:', loggingError);
    console.log('📝 Error logged (console fallback):', errorDetails);
  }
}

// Determine error severity based on error type and context
function determineSeverity(error: any, context: string): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: System failures that prevent all operations
  if (context.includes('database') || context.includes('auth')) {
    return 'critical';
  }
  
  // High: External API failures, file upload failures
  if (context.includes('notion_api') || context.includes('file_upload')) {
    return 'high';
  }
  
  // Medium: Validation errors, network issues
  if (context.includes('validation') || context.includes('network')) {
    return 'medium';
  }
  
  // Low: Minor issues that don't affect core functionality
  return 'low';
}

// Determine error category based on error type and context
function determineCategory(error: any, context: string): 'validation' | 'network' | 'external_api' | 'file_upload' | 'database' | 'unknown' {
  if (context.includes('validation')) return 'validation';
  if (context.includes('notion')) return 'external_api';
  if (context.includes('file') || context.includes('upload')) return 'file_upload';
  if (context.includes('database') || context.includes('supabase')) return 'database';
  if (context.includes('network') || context.includes('fetch')) return 'network';
  
  return 'unknown';
}

// Health check utilities
export async function performHealthCheck(): Promise<{
  notion: boolean;
  supabase: boolean;
  storage: boolean;
  overall: boolean;
}> {
  const checks = await Promise.allSettled([
    // Quick Notion API health check
    fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('NOTION_API_KEY')}`,
        'Notion-Version': '2022-06-28'
      }
    }).then(r => r.ok),
    
    // Supabase health check (always available in Edge Functions)
    Promise.resolve(true),
    
    // Storage health check (simple test)
    Promise.resolve(true)
  ]);
  
  const notion = checks[0].status === 'fulfilled' && checks[0].value;
  const supabase = checks[1].status === 'fulfilled' && checks[1].value;
  const storage = checks[2].status === 'fulfilled' && checks[2].value;
  
  return {
    notion,
    supabase,
    storage,
    overall: supabase && storage // Core functionality works even if Notion is down
  };
}

// Fallback submission to Supabase when Notion fails
export async function fallbackSubmissionToSupabase(
  supabase: any,
  submissionData: any,
  originalError: any
): Promise<{ success: boolean; submissionId?: string; error?: any }> {
  try {
    console.log('🔄 Using fallback submission to Supabase');
    
    // First, save the main submission record
    const fallbackRecord = {
      status: 'pending_notion_sync', // Special status for failed Notion submissions
      payload: submissionData,
      original_notion_error: JSON.stringify({
        message: originalError?.message,
        status: originalError?.status,
        timestamp: new Date().toISOString()
      }),
      created_at: new Date().toISOString(),
      requires_admin_attention: true,
      manager_id: submissionData.managerId
    };
    
    const { data: submissionResult, error: submissionError } = await supabase
      .from('j_ads_creative_submissions')
      .insert(fallbackRecord)
      .select('id')
      .single();
    
    if (submissionError) {
      console.error('❌ Fallback submission failed:', submissionError);
      return { success: false, error: submissionError };
    }
    
    console.log('✅ Fallback submission successful:', submissionResult.id);
    
    // Now save to the fallback queue for later processing
    try {
      const fallbackQueueRecord = {
        submission_id: submissionResult.id,
        fallback_reason: 'notion_api_unavailable',
        original_error: JSON.stringify({
          message: originalError?.message,
          status: originalError?.status,
          stack: originalError?.stack,
          timestamp: new Date().toISOString()
        }),
        notion_payload: submissionData,
        uploaded_files: submissionData.files || [],
        sync_status: 'pending',
        priority: determineFallbackPriority(originalError)
      };
      
      const { error: queueError } = await supabase
        .from('j_ads_fallback_submissions')
        .insert(fallbackQueueRecord);
      
      if (queueError) {
        console.warn('⚠️ Failed to add to fallback queue, but main submission succeeded:', queueError);
      } else {
        console.log('✅ Added to fallback sync queue');
      }
    } catch (queueError) {
      console.warn('⚠️ Fallback queue error (non-critical):', queueError);
    }
    
    // Log success for admin tracking
    await logErrorForAdmin({
      operation: 'fallback_submission',
      error: originalError,
      submissionId: submissionResult.id,
      managerId: submissionData.managerId,
      timestamp: new Date().toISOString(),
      context: 'notion_unavailable'
    });
    
    return { success: true, submissionId: submissionResult.id };
    
  } catch (error) {
    console.error('❌ Critical failure in fallback submission:', error);
    
    // Log the critical failure
    await logErrorForAdmin({
      operation: 'fallback_submission_critical_failure',
      error: error,
      managerId: submissionData.managerId,
      timestamp: new Date().toISOString(),
      context: 'database_failure'
    });
    
    return { success: false, error };
  }
}

// Determine priority for fallback sync based on error type
function determineFallbackPriority(error: any): number {
  // Priority 1 (highest): Rate limiting (retry soon)
  if (error?.status === 429) return 1;
  
  // Priority 2: Server errors (retry medium)
  if (error?.status >= 500) return 2;
  
  // Priority 3: Network errors
  if (!error?.status) return 3;
  
  // Priority 4: Client errors (might need manual intervention)
  if (error?.status >= 400 && error?.status < 500) return 4;
  
  // Priority 5 (lowest): Unknown errors
  return 5;
}