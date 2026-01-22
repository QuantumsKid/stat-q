/**
 * Global error handler for server actions
 * Provides consistent error handling, logging, and user-friendly messages
 */

import { PostgrestError } from '@supabase/supabase-js';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ServerActionError {
  message: string;
  code: ErrorCode;
  field?: string;
  details?: unknown;
  timestamp: string;
}

export interface ServerActionResult<T = unknown> {
  data?: T;
  error?: ServerActionError;
}

/**
 * Format a user-friendly error message based on error code
 */
function getUserFriendlyMessage(code: ErrorCode, originalMessage?: string): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'You need to be logged in to perform this action.',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_INPUT]: 'The provided information is invalid.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.ALREADY_EXISTS]: 'This item already exists.',
    [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
    [ErrorCode.CONSTRAINT_VIOLATION]: 'This action violates a database constraint.',
    [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
    [ErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
    [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please try again later.',
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  };

  return originalMessage || messages[code];
}

/**
 * Determine error code from Supabase error
 */
function getErrorCodeFromSupabaseError(error: PostgrestError): ErrorCode {
  // Check for specific error codes
  if (error.code === '23505') return ErrorCode.ALREADY_EXISTS;
  if (error.code === '23503') return ErrorCode.CONSTRAINT_VIOLATION;
  if (error.code === '42501') return ErrorCode.FORBIDDEN;

  // Check error message patterns
  if (error.message.includes('not found')) return ErrorCode.NOT_FOUND;
  if (error.message.includes('permission')) return ErrorCode.FORBIDDEN;
  if (error.message.includes('violates')) return ErrorCode.CONSTRAINT_VIOLATION;

  return ErrorCode.DATABASE_ERROR;
}

/**
 * Log error with structured format
 */
function logError(
  action: string,
  error: Error | PostgrestError | unknown,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    action,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
  };

  // In production, send to monitoring service (e.g., Sentry)
  console.error('[SERVER ACTION ERROR]', JSON.stringify(errorDetails, null, 2));
}

/**
 * Main error handler function
 */
export function handleServerError(
  error: Error | PostgrestError | unknown,
  action: string,
  context?: Record<string, unknown>
): ServerActionError {
  // Log the error
  logError(action, error, context);

  let code: ErrorCode = ErrorCode.UNKNOWN_ERROR;
  let message = 'An unexpected error occurred';
  let field: string | undefined;
  let details: unknown;

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    code = getErrorCodeFromSupabaseError(pgError);
    message = getUserFriendlyMessage(code);
    details = {
      code: pgError.code,
      details: pgError.details,
      hint: pgError.hint,
    };
  }
  // Handle standard JavaScript errors
  else if (error instanceof Error) {
    message = error.message;

    // Detect error type from message
    if (message.includes('Unauthorized') || message.includes('not logged in')) {
      code = ErrorCode.UNAUTHORIZED;
      message = getUserFriendlyMessage(code);
    } else if (message.includes('permission') || message.includes('forbidden')) {
      code = ErrorCode.FORBIDDEN;
      message = getUserFriendlyMessage(code);
    } else if (message.includes('not found')) {
      code = ErrorCode.NOT_FOUND;
      message = getUserFriendlyMessage(code);
    } else if (message.includes('network') || message.includes('fetch')) {
      code = ErrorCode.NETWORK_ERROR;
      message = getUserFriendlyMessage(code);
    } else {
      code = ErrorCode.INTERNAL_ERROR;
      // Keep original message for internal errors if it's informative
      if (message.length > 100) {
        message = getUserFriendlyMessage(code);
      }
    }

    details = {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    message,
    code,
    field,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a success result
 */
export function createSuccessResult<T>(data: T): ServerActionResult<T> {
  return { data };
}

/**
 * Create an error result
 */
export function createErrorResult<T = unknown>(
  error: Error | PostgrestError | unknown,
  action: string,
  context?: Record<string, unknown>
): ServerActionResult<T> {
  return {
    error: handleServerError(error, action, context),
  };
}

/**
 * Wrapper for server actions with automatic error handling
 */
export async function withErrorHandling<T>(
  action: string,
  handler: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<ServerActionResult<T>> {
  try {
    const data = await handler();
    return createSuccessResult(data);
  } catch (error) {
    return createErrorResult(error, action, context);
  }
}
