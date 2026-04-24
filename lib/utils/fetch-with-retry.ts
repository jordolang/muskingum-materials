interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function shouldRetry(
  method: string,
  status: number | null,
  attempt: number,
  maxRetries: number,
  retryableStatuses: number[]
): boolean {
  // Only retry GET requests
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  // Check if we have retries left
  if (attempt >= maxRetries) {
    return false;
  }

  // Retry on network errors (status is null)
  if (status === null) {
    return true;
  }

  // Retry on specific HTTP status codes
  return retryableStatuses.includes(status);
}

function getRetryDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  // attempt 0: 1000ms, attempt 1: 2000ms, attempt 2: 4000ms
  return baseDelay * Math.pow(2, attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
    retryableStatuses = DEFAULT_CONFIG.retryableStatuses,
    ...fetchOptions
  } = options;

  const method = fetchOptions.method || "GET";
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // If response is OK or shouldn't retry, return it
      if (
        response.ok ||
        !shouldRetry(method, response.status, attempt, maxRetries, retryableStatuses)
      ) {
        return response;
      }

      // Store the response for potential retry
      lastResponse = response;

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries - 1) {
        await sleep(getRetryDelay(attempt, retryDelay));
      }
    } catch (error: unknown) {
      // Network error or fetch failure
      lastError = error instanceof Error ? error : new Error("Network request failed");

      // Check if we should retry
      if (!shouldRetry(method, null, attempt, maxRetries, retryableStatuses)) {
        throw lastError;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries - 1) {
        await sleep(getRetryDelay(attempt, retryDelay));
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    throw lastError;
  }

  if (lastResponse) {
    return lastResponse;
  }

  // This should never happen, but TypeScript needs it
  throw new Error("Fetch failed after retries");
}
