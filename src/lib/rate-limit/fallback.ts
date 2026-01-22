/**
 * Fallback rate limiter when Upstash packages are not available
 * Provides no-op implementation for development/testing
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

/**
 * No-op rate limiter that always allows requests
 * Used when @upstash/ratelimit is not installed
 */
export class FallbackRateLimiter {
  async limit(identifier: string): Promise<RateLimitResult> {
    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Rate Limit] Using fallback rate limiter - install @upstash/ratelimit for production use'
      );
    }

    // Always allow in fallback mode
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    };
  }
}

/**
 * Create a fallback rate limiter instance
 */
export function createFallbackRateLimiter(config: {
  limiter: unknown;
  prefix: string;
  analytics?: boolean;
}): FallbackRateLimiter {
  return new FallbackRateLimiter();
}

// Export a warning message
export const RATE_LIMIT_UNAVAILABLE =
  'Rate limiting is unavailable. Install @upstash/ratelimit and @upstash/redis for production use.';
