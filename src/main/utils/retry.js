/**
 * Retry utility with exponential backoff and jitter
 * Implements intelligent retry mechanism for handling transient errors
 */

/**
 * Retry a function with exponential backoff and jitter
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 60000)
 * @param {number} options.multiplier - Delay multiplier (default: 2)
 * @param {number} options.jitter - Jitter factor 0-1 (default: 0.25)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable (default: retry all errors)
 * @param {Function} options.onRetry - Callback called before each retry (receives attempt, error, delay)
 * @returns {Promise} Result of the function or throws last error
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 60000,
    multiplier = 2,
    jitter = 0.25,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this error should be retried
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(multiplier, attempt),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitterAmount = delay * jitter * (Math.random() * 2 - 1);
      const finalDelay = Math.max(delay + jitterAmount, 0);

      // Log retry attempt
      if (onRetry) {
        onRetry(attempt + 1, error, finalDelay);
      } else {
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(finalDelay)}ms. Error: ${error.message}`);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Default retry configuration for different scenarios
 */
export const RetryConfig = {
  // For network operations (page.goto, etc.)
  NETWORK: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    multiplier: 2,
    jitter: 0.3
  },
  // For DOM operations (click, waitForSelector)
  DOM: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 15000,
    multiplier: 1.5,
    jitter: 0.2
  },
  // For API calls
  API: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 60000,
    multiplier: 2,
    jitter: 0.25
  },
  // For cookie loading
  COOKIE: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    multiplier: 2,
    jitter: 0.1
  }
};

/**
 * Helper to check if error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.name === 'TimeoutError') return true;
  if (error.name === 'NetworkError') return true;
  
  // Playwright specific errors
  if (error.message?.includes('net::ERR_')) return true;
  if (error.message?.includes('Timeout')) return true;
  if (error.message?.includes('Target closed')) return false;
  if (error.message?.includes('Session closed')) return false;
  
  // Default to retry
  return true;
}
