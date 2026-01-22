/**
 * Rate Limiting Configuration
 * Uses fallback implementation when Upstash packages are not available
 *
 * To enable production rate limiting:
 * 1. Install packages: npm install @upstash/ratelimit @upstash/redis
 * 2. Set environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * 3. The system will automatically use Upstash when available
 */

import { FallbackRateLimiter, createFallbackRateLimiter } from './fallback';

/**
 * Rate limit configurations for different endpoints
 * Currently using fallback (no-op) implementation
 */
export const rateLimits = {
  // Form submission - 10 submissions per hour per IP
  formSubmission: createFallbackRateLimiter({
    limiter: { requests: 10, window: '1 h' },
    prefix: 'ratelimit:form-submission',
    analytics: true,
  }),

  // API endpoints - 100 requests per minute per user
  apiEndpoint: createFallbackRateLimiter({
    limiter: { requests: 100, window: '1 m' },
    prefix: 'ratelimit:api',
    analytics: true,
  }),

  // Authentication - 5 login attempts per 15 minutes per IP
  auth: createFallbackRateLimiter({
    limiter: { requests: 5, window: '15 m' },
    prefix: 'ratelimit:auth',
    analytics: true,
  }),

  // Form creation - 20 forms per day per user
  formCreation: createFallbackRateLimiter({
    limiter: { requests: 20, window: '1 d' },
    prefix: 'ratelimit:form-creation',
    analytics: true,
  }),

  // Export operations - 5 exports per hour per user
  export: createFallbackRateLimiter({
    limiter: { requests: 5, window: '1 h' },
    prefix: 'ratelimit:export',
    analytics: true,
  }),

  // Analytics queries - 60 requests per minute per user
  analytics: createFallbackRateLimiter({
    limiter: { requests: 60, window: '1 m' },
    prefix: 'ratelimit:analytics',
    analytics: true,
  }),
};

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
}

/**
 * Helper to format rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  limiter: FallbackRateLimiter,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}
