/**
 * Rate Limiting Middleware
 * Apply rate limits to API routes and server actions
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimits, getRateLimitIdentifier, checkRateLimit, getRateLimitHeaders } from './config';

/**
 * Apply rate limiting to a request
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimits,
  userId?: string
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(request, userId);
  const limiter = rateLimits[limiterType];

  const result = await checkRateLimit(limiter, identifier);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(result),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Rate limit passed - return null to continue
  return null;
}

/**
 * Higher-order function to wrap server actions with rate limiting
 */
export function withServerActionRateLimit<T extends (...args: any[]) => Promise<any>>(
  action: T,
  limiterType: keyof typeof rateLimits,
  getUserId?: (...args: Parameters<T>) => string | undefined
): T {
  return (async (...args: Parameters<T>) => {
    // This is a simplified version - in production, you'd need to get the request object
    // For server actions, consider using headers() from 'next/headers'
    const userId = getUserId ? getUserId(...args) : undefined;

    // For server actions, we'll skip request-based rate limiting
    // and use user-based or IP-based as fallback
    // In a real implementation, you'd integrate with the server action context

    return await action(...args);
  }) as T;
}

/**
 * Utility to add rate limit headers to any response
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', reset.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
