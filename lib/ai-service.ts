/**
 * AI Service utilities for resilient model handling and retries
 */

import { logger } from './logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry logic with exponential backoff
 * Useful for flaky APIs like Gemini
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let delay = finalConfig.initialDelayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === finalConfig.maxRetries;

      // Log retry attempt
      if (!isLastAttempt) {
        logger.warn(
          context,
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          { error: String(error), attempt }
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs);
      } else {
        logger.error(context, 'All retry attempts exhausted', { error: String(error), totalAttempts: finalConfig.maxRetries + 1 });
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable (temporary vs permanent)
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Retryable errors
  const retryablePatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    '429', // Rate limit
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504', // Gateway timeout
  ];

  return retryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Extract error code and severity from Gemini API error
 */
export function parseGeminiError(error: unknown): {
  code: string;
  message: string;
  statusCode?: number;
  isRetryable: boolean;
} {
  if (!(error instanceof Error)) {
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      isRetryable: false,
    };
  }

  const message = error.message;

  // Parse status code from error message
  const statusMatch = message.match(/\[(\d{3})\s+/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

  // Determine error code
  let code = 'GEMINI_ERROR';
  if (message.includes('403') || message.includes('Forbidden')) {
    code = 'FORBIDDEN_API_KEY';
  } else if (message.includes('401') || message.includes('Unauthorized')) {
    code = 'INVALID_API_KEY';
  } else if (message.includes('429')) {
    code = 'RATE_LIMITED';
  } else if (message.includes('500') || message.includes('Internal Server Error')) {
    code = 'GEMINI_SERVER_ERROR';
  } else if (message.includes('503') || message.includes('Service Unavailable')) {
    code = 'GEMINI_UNAVAILABLE';
  }

  const isRetryable = isRetryableError(error);

  return {
    code,
    message,
    statusCode,
    isRetryable,
  };
}

/**
 * Fallback response when AI service fails
 */
export const FALLBACK_RESPONSE = `I'm currently experiencing technical difficulties accessing my full knowledge base. Here's what I can help with:

**Available:**
- Viewing your schedule, grades, and financials (if loaded)
- Answering basic questions about LCC and school policies
- Providing general study tips

**Try:**
1. Refreshing the page and asking again
2. Checking your internet connection
3. Coming back in a few moments

If this persists, please report it to support. Sorry for the inconvenience!`;

/**
 * User-friendly error messages for different error types
 */
export function getUserFriendlyErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    INVALID_API_KEY: 'Configuration error: AI service is not properly configured. Please contact support.',
    FORBIDDEN_API_KEY: 'Access denied to AI service. Please contact support.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    GEMINI_SERVER_ERROR: 'The AI service is experiencing issues. Please try again in a moment.',
    GEMINI_UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}
