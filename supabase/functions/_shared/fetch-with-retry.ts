/**
 * HTTP Request Retry Utility
 *
 * Provides resilient HTTP fetching with automatic retry logic,
 * exponential backoff, and timeout handling.
 *
 * @module fetch-with-retry
 */

/**
 * Fetch options with retry configuration
 */
export interface FetchRetryOptions extends RequestInit {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Whether to retry on 5xx server errors (default: true) */
  retryOn5xx?: boolean;
  /** Whether to retry on network errors (default: true) */
  retryOnNetworkError?: boolean;
}

/**
 * Creates a timeout error for fetch requests
 */
class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms: ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Fetches a URL with automatic timeout handling.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Response promise
 * @throws {FetchTimeoutError} If request exceeds timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw error;
  }
}

/**
 * Fetches a URL with automatic retry logic and exponential backoff.
 *
 * Retry behavior:
 * - Retries on network errors (ECONNREFUSED, ETIMEDOUT, etc.)
 * - Retries on 5xx server errors (configurable)
 * - Does NOT retry on 4xx client errors (bad request, not found, etc.)
 * - Uses exponential backoff: 1s, 2s, 4s, 8s...
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Response promise
 * @throws {Error} If all retry attempts fail
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (3 retries, 30s timeout)
 * const response = await fetchWithRetry('https://api.example.com/data');
 *
 * // Custom retry configuration
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   maxRetries: 5,
 *   timeoutMs: 60000,
 *   retryOn5xx: true,
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    timeoutMs = 30000,
    retryOn5xx = true,
    retryOnNetworkError = true,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeoutMs);

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      // Store response for potential return
      lastResponse = response;

      // Don't retry 4xx client errors (bad request, unauthorized, not found, etc.)
      if (response.status >= 400 && response.status < 500) {
        console.warn(`[fetchWithRetry] Client error ${response.status} (not retrying): ${url}`);
        return response; // Return error response without retry
      }

      // Retry 5xx server errors if configured
      if (response.status >= 500 && retryOn5xx) {
        lastError = new Error(`HTTP ${response.status}: ${url}`);
        console.warn(`[fetchWithRetry] Attempt ${attempt}/${maxRetries} failed with ${response.status}`);
      } else {
        // Don't retry if retryOn5xx is false
        return response;
      }
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's not a network error and retryOnNetworkError is false
      if (!retryOnNetworkError && !(error instanceof FetchTimeoutError)) {
        throw error;
      }

      console.warn(`[fetchWithRetry] Attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        url: url.substring(0, 100), // Truncate long URLs
      });
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`[fetchWithRetry] Waiting ${delayMs}ms before retry ${attempt + 1}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted
  if (lastError) {
    lastError.message = `Failed after ${maxRetries} attempts: ${lastError.message}`;
    throw lastError;
  }

  if (lastResponse) {
    // Return last error response if no exception was thrown
    return lastResponse;
  }

  // Should never reach here, but TypeScript needs this
  throw new Error(`Unexpected error in fetchWithRetry: ${url}`);
}

/**
 * Fetches a URL and decodes the response as UTF-8 text with retry logic.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Decoded text content
 * @throws {Error} If request fails after all retries or response is not OK
 *
 * @example
 * ```typescript
 * const html = await fetchTextWithRetry('https://example.com/template.html');
 * console.log('Fetched', html.length, 'characters');
 * ```
 */
export async function fetchTextWithRetry(
  url: string,
  options: FetchRetryOptions = {}
): Promise<string> {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  const decoder = new TextDecoder('utf-8');
  const arrayBuffer = await response.arrayBuffer();
  return decoder.decode(arrayBuffer);
}

/**
 * Fetches a URL and parses the response as JSON with retry logic.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Parsed JSON object
 * @throws {Error} If request fails or response is not valid JSON
 *
 * @example
 * ```typescript
 * const data = await fetchJsonWithRetry<{ users: User[] }>('https://api.example.com/users');
 * console.log('Found', data.users.length, 'users');
 * ```
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: FetchRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return await response.json();
}
