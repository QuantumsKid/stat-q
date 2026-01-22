/**
 * Centralized error handling utilities
 * Provides functions to create, categorize, and handle errors consistently
 */

import type {
  AppError,
  ErrorCategory,
  ErrorCode,
  ErrorContext,
  ActionResult,
} from '@/lib/types/error.types';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Create a structured error object
 */
export function createError(
  message: string,
  code: ErrorCode,
  category: ErrorCategory,
  options?: {
    context?: ErrorContext;
    retryable?: boolean;
    recovery?: string[];
    statusCode?: number;
    originalError?: unknown;
  }
): AppError {
  return {
    message,
    code,
    category,
    context: options?.context,
    retryable: options?.retryable ?? false,
    recovery: options?.recovery,
    statusCode: options?.statusCode,
    originalError: options?.originalError,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an ActionResult with an error
 */
export function errorResult<T = unknown>(error: AppError): ActionResult<T> {
  return { error, success: false };
}

/**
 * Create an ActionResult with data
 */
export function successResult<T>(data: T): ActionResult<T> {
  return { data, success: true };
}

/**
 * Determine if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const err = error as { name?: string; message?: string };
    if (
      err.name === 'NetworkError' ||
      err.message?.includes('network') ||
      err.message?.includes('timeout') ||
      err.message?.includes('connection')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Determine if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { code?: string; category?: string };
    return !!(
      err.category === 'VALIDATION' ||
      err.code?.includes('INVALID_') ||
      err.code?.includes('REQUIRED_')
    );
  }
  return false;
}

/**
 * Determine if an error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as { code?: string; category?: string; message?: string };
    return !!(
      err.category === 'AUTH' ||
      err.code === 'UNAUTHORIZED' ||
      err.code === 'UNAUTHENTICATED' ||
      err.message?.toLowerCase().includes('unauthorized') ||
      err.message?.toLowerCase().includes('authentication')
    );
  }
  return false;
}

/**
 * Convert a Supabase PostgrestError to AppError
 */
export function fromSupabaseError(
  error: PostgrestError,
  context?: ErrorContext
): AppError {
  // Map Supabase error codes to our error categories
  let category: ErrorCategory = 'DATABASE';
  let code: ErrorCode = 'DATABASE_ERROR';
  let retryable = false;
  let recovery: string[] = [];

  // Detect error type from Supabase error
  if (error.code === 'PGRST116' || error.message.includes('not found')) {
    category = 'NOT_FOUND';
    code = 'NOT_FOUND';
    recovery = ['Check that the resource exists', 'Refresh the page'];
  } else if (error.code === '23505' || error.message.includes('duplicate')) {
    category = 'CONFLICT';
    code = 'DUPLICATE_ENTRY';
    recovery = ['Use a different value', 'Update the existing entry'];
  } else if (error.code === '23503' || error.message.includes('foreign key')) {
    category = 'VALIDATION';
    code = 'INVALID_TYPE';
    recovery = ['Ensure all related records exist'];
  } else if (
    error.message.includes('timeout') ||
    error.message.includes('connection')
  ) {
    category = 'NETWORK';
    code = 'CONNECTION_TIMEOUT';
    retryable = true;
    recovery = ['Check your internet connection', 'Try again'];
  } else if (error.message.includes('permission')) {
    category = 'PERMISSION';
    code = 'UNAUTHORIZED';
    recovery = ['Check your permissions', 'Contact an administrator'];
  }

  return createError(
    error.message || 'A database error occurred',
    code,
    category,
    {
      context,
      retryable,
      recovery,
      statusCode: getStatusCodeFromCategory(category),
      originalError: error,
    }
  );
}

/**
 * Convert any error to AppError
 */
export function normalizeError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  context?: ErrorContext
): AppError {
  // Already an AppError
  if (error && typeof error === 'object' && 'category' in error) {
    return error as AppError;
  }

  // Supabase PostgrestError
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return fromSupabaseError(error as PostgrestError, context);
  }

  // Network error
  if (isNetworkError(error)) {
    return createError('Network connection error', 'NETWORK_ERROR', 'NETWORK', {
      context,
      retryable: true,
      recovery: ['Check your internet connection', 'Try again'],
      statusCode: 0,
      originalError: error,
    });
  }

  // Generic error with message
  if (error instanceof Error) {
    return createError(error.message || defaultMessage, 'UNKNOWN_ERROR', 'UNKNOWN', {
      context,
      retryable: false,
      statusCode: 500,
      originalError: error,
    });
  }

  // String error
  if (typeof error === 'string') {
    return createError(error, 'UNKNOWN_ERROR', 'UNKNOWN', {
      context,
      retryable: false,
      statusCode: 500,
      originalError: error,
    });
  }

  // Unknown error
  return createError(defaultMessage, 'UNKNOWN_ERROR', 'UNKNOWN', {
    context,
    retryable: false,
    statusCode: 500,
    originalError: error,
  });
}

/**
 * Get HTTP status code from error category
 */
function getStatusCodeFromCategory(category: ErrorCategory): number {
  switch (category) {
    case 'VALIDATION':
      return 400;
    case 'AUTH':
      return 401;
    case 'PERMISSION':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    case 'RATE_LIMIT':
      return 429;
    case 'SERVER':
    case 'DATABASE':
      return 500;
    case 'NETWORK':
      return 0; // Network errors don't have HTTP status
    default:
      return 500;
  }
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: AppError): string {
  const parts: string[] = [error.message];

  if (error.context?.field) {
    parts.push(`(Field: ${error.context.field})`);
  }

  if (error.context?.resource && error.context?.resourceId) {
    parts.push(`(${error.context.resource}: ${error.context.resourceId})`);
  }

  return parts.join(' ');
}

/**
 * Get recovery suggestions for an error
 */
export function getRecoverySuggestions(error: AppError): string[] {
  if (error.recovery && error.recovery.length > 0) {
    return error.recovery;
  }

  // Default suggestions based on category
  switch (error.category) {
    case 'NETWORK':
      return ['Check your internet connection', 'Try again in a moment'];
    case 'AUTH':
      return ['Sign in again', 'Check your credentials'];
    case 'VALIDATION':
      return ['Check your input', 'Ensure all required fields are filled'];
    case 'NOT_FOUND':
      return ['Refresh the page', 'Check that the item exists'];
    case 'PERMISSION':
      return ['Contact an administrator', 'Check your account permissions'];
    case 'RATE_LIMIT':
      return ['Wait a moment before trying again', 'Reduce request frequency'];
    default:
      return ['Try again', 'Contact support if the problem persists'];
  }
}

/**
 * Log error for monitoring/debugging
 */
export function logError(error: AppError, additionalContext?: Record<string, unknown>): void {
  // In production, this would send to error monitoring service (e.g., Sentry)
  console.error('[AppError]', {
    message: error.message,
    code: error.code,
    category: error.category,
    context: error.context,
    timestamp: error.timestamp,
    ...additionalContext,
  });

  if (error.originalError) {
    console.error('[Original Error]', error.originalError);
  }
}
