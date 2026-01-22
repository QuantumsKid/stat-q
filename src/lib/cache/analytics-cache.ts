/**
 * Analytics Caching Layer
 * Uses Redis to cache computed statistics for better performance
 */

import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Cache key prefixes
 */
const CACHE_KEYS = {
  FORM_STATS: 'analytics:form-stats',
  QUESTION_STATS: 'analytics:question-stats',
  DAILY_TRENDS: 'analytics:daily-trends',
  ABANDONMENT: 'analytics:abandonment',
  ANSWER_FREQ: 'analytics:answer-frequency',
  QUALITY_METRICS: 'analytics:quality-metrics',
} as const;

/**
 * Cache TTLs (Time To Live) in seconds
 */
const CACHE_TTL = {
  FORM_STATS: 300, // 5 minutes
  QUESTION_STATS: 300, // 5 minutes
  DAILY_TRENDS: 600, // 10 minutes
  ABANDONMENT: 600, // 10 minutes
  ANSWER_FREQ: 300, // 5 minutes
  QUALITY_METRICS: 180, // 3 minutes
} as const;

/**
 * Generate cache key
 */
function getCacheKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

/**
 * Get cached data or compute and cache it
 */
export async function getCachedOrCompute<T>(
  cacheKey: string,
  ttl: number,
  computeFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(cacheKey);

    if (cached !== null) {
      console.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`Cache MISS: ${cacheKey}`);

    // Compute the value
    const computed = await computeFn();

    // Store in cache
    await redis.setex(cacheKey, ttl, computed);

    return computed;
  } catch (error) {
    console.error('Cache error:', error);
    // Fall back to computing without cache
    return await computeFn();
  }
}

/**
 * Cache form statistics
 */
export async function cacheFormStats(formId: string, data: unknown): Promise<void> {
  const key = getCacheKey(CACHE_KEYS.FORM_STATS, formId);
  try {
    await redis.setex(key, CACHE_TTL.FORM_STATS, data);
  } catch (error) {
    console.error('Error caching form stats:', error);
  }
}

/**
 * Get cached form statistics
 */
export async function getCachedFormStats<T>(formId: string): Promise<T | null> {
  const key = getCacheKey(CACHE_KEYS.FORM_STATS, formId);
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Error getting cached form stats:', error);
    return null;
  }
}

/**
 * Cache question statistics
 */
export async function cacheQuestionStats(formId: string, data: unknown): Promise<void> {
  const key = getCacheKey(CACHE_KEYS.QUESTION_STATS, formId);
  try {
    await redis.setex(key, CACHE_TTL.QUESTION_STATS, data);
  } catch (error) {
    console.error('Error caching question stats:', error);
  }
}

/**
 * Get cached question statistics
 */
export async function getCachedQuestionStats<T>(formId: string): Promise<T | null> {
  const key = getCacheKey(CACHE_KEYS.QUESTION_STATS, formId);
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Error getting cached question stats:', error);
    return null;
  }
}

/**
 * Cache daily trends
 */
export async function cacheDailyTrends(formId: string, days: number, data: unknown): Promise<void> {
  const key = getCacheKey(CACHE_KEYS.DAILY_TRENDS, `${formId}:${days}`);
  try {
    await redis.setex(key, CACHE_TTL.DAILY_TRENDS, data);
  } catch (error) {
    console.error('Error caching daily trends:', error);
  }
}

/**
 * Get cached daily trends
 */
export async function getCachedDailyTrends<T>(formId: string, days: number): Promise<T | null> {
  const key = getCacheKey(CACHE_KEYS.DAILY_TRENDS, `${formId}:${days}`);
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Error getting cached daily trends:', error);
    return null;
  }
}

/**
 * Cache answer frequency
 */
export async function cacheAnswerFrequency(questionId: string, data: unknown): Promise<void> {
  const key = getCacheKey(CACHE_KEYS.ANSWER_FREQ, questionId);
  try {
    await redis.setex(key, CACHE_TTL.ANSWER_FREQ, data);
  } catch (error) {
    console.error('Error caching answer frequency:', error);
  }
}

/**
 * Get cached answer frequency
 */
export async function getCachedAnswerFrequency<T>(questionId: string): Promise<T | null> {
  const key = getCacheKey(CACHE_KEYS.ANSWER_FREQ, questionId);
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Error getting cached answer frequency:', error);
    return null;
  }
}

/**
 * Invalidate all caches for a form
 * Call this when a new response is submitted or modified
 */
export async function invalidateFormCaches(formId: string): Promise<void> {
  try {
    const pattern = `*:${formId}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys for form ${formId}`);
    }
  } catch (error) {
    console.error('Error invalidating form caches:', error);
  }
}

/**
 * Invalidate cache for a specific question
 */
export async function invalidateQuestionCache(questionId: string): Promise<void> {
  const key = getCacheKey(CACHE_KEYS.ANSWER_FREQ, questionId);
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error invalidating question cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  analyticsKeys: number;
}> {
  try {
    const allKeys = await redis.keys('*');
    const analyticsKeys = await redis.keys('analytics:*');

    return {
      totalKeys: allKeys.length,
      analyticsKeys: analyticsKeys.length,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalKeys: 0,
      analyticsKeys: 0,
    };
  }
}

/**
 * Clear all analytics caches
 * Use sparingly - mainly for debugging
 */
export async function clearAllAnalyticsCaches(): Promise<number> {
  try {
    const keys = await redis.keys('analytics:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error('Error clearing analytics caches:', error);
    return 0;
  }
}
