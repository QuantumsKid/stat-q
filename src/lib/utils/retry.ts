/**
 * Retry mechanism with exponential backoff
 * Automatically retries failed operations with increasing delays
 * Integrates with error handler for smart retry decisions
 */

import { logger } from './logger';
import { isNetworkError } from './error-handler';
import type { AppError } from '../types/error.types';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffFactor?: number;
  retryableErrors?: string[]; // Error messages that should trigger retry
  onRetry?: (attempt: number, error: Error) => void;
  operationName?: string; // For logging
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'network',
    'timeout',
    'fetch failed',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
  onRetry: () => {},
  operationName: '',
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number
): number {
  // Exponential backoff: delay = initialDelay * (backoffFactor ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);

  // Add jitter (random variation ±25%)
  const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);

  // Cap at maxDelay
  return Math.min(jitter, maxDelay);
}

/**
 * Check if error should trigger a retry
 * Uses smart detection with error handler integration
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  // Use error handler's network detection
  if (isNetworkError(error)) {
    return true;
  }

  // Check for retryable app errors
  if (error && typeof error === 'object') {
    const appError = error as AppError & { statusCode?: number; retryable?: boolean };

    // Explicitly marked as retryable
    if (appError.retryable === true) {
      return true;
    }

    // Retry on 5xx server errors
    if (appError.statusCode && appError.statusCode >= 500 && appError.statusCode < 600) {
      return true;
    }

    // Retry on rate limit (429)
    if (appError.statusCode === 429 || appError.code === 'RATE_LIMIT_EXCEEDED') {
      return true;
    }

    // Retry on database connection errors
    if (appError.category === 'DATABASE' || appError.category === 'NETWORK') {
      return true;
    }
  }

  // Fallback to error message checking
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error = new Error('Unknown error');
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    try {
      // Attempt the operation
      const result = await operation();

      // Log success if retries were performed
      if (attempt > 0 && options.operationName) {
        logger.info(`Operation succeeded after ${attempt} retries`, {
          operation: options.operationName,
          attempts: attempt,
        });
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= opts.maxRetries) {
        if (options.operationName) {
          logger.error(
            `Operation failed after ${opts.maxRetries} retries`,
            error,
            { operation: options.operationName, maxRetries: opts.maxRetries }
          );
        }
        throw lastError;
      }

      if (!isRetryableError(error, opts.retryableErrors)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.backoffFactor,
        opts.maxDelay
      );

      // Log retry attempt
      if (options.operationName) {
        logger.warn(
          `Retrying operation (attempt ${attempt + 1}/${opts.maxRetries}) after ${Math.round(delay)}ms`,
          {
            operation: options.operationName,
            attempt: attempt + 1,
            maxRetries: opts.maxRetries,
            delay: Math.round(delay),
          }
        );
      }

      // Notify about retry
      opts.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await sleep(delay);

      attempt++;
    }
  }

  throw lastError;
}

/**
 * Retry wrapper for fetch requests
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retry(
    async () => {
      const response = await fetch(url, init);

      // Retry on 5xx server errors and 429 rate limit
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      ...options,
      retryableErrors: [
        ...(options?.retryableErrors || DEFAULT_OPTIONS.retryableErrors),
        '500',
        '502',
        '503',
        '504',
        '429',
      ],
    }
  );
}

/**
 * Create a retryable version of an async function
 */
export function createRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    return retry(() => fn(...args), options);
  };
}
