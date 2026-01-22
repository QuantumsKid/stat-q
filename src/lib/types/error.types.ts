/**
 * Comprehensive error handling types
 * Provides structured error responses with codes, context, and categorization
 */

export type ErrorCategory =
  | 'VALIDATION'
  | 'NETWORK'
  | 'AUTH'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER'
  | 'DATABASE'
  | 'PERMISSION'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export type ErrorCode =
  // Validation errors
  | 'REQUIRED_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_EMAIL'
  | 'INVALID_URL'
  | 'INVALID_NUMBER'
  | 'MAX_LENGTH_EXCEEDED'
  | 'MIN_LENGTH_NOT_MET'
  | 'OUT_OF_RANGE'
  | 'INVALID_CHOICE'
  | 'TOO_MANY_FILES'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'

  // Auth errors
  | 'UNAUTHORIZED'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'

  // Resource errors
  | 'NOT_FOUND'
  | 'FORM_NOT_FOUND'
  | 'QUESTION_NOT_FOUND'
  | 'RESPONSE_NOT_FOUND'
  | 'USER_NOT_FOUND'

  // Database/Server errors
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'CONNECTION_TIMEOUT'
  | 'SERVER_ERROR'
  | 'TRANSACTION_FAILED'

  // Business logic errors
  | 'FORM_LOCKED'
  | 'FORM_NOT_PUBLISHED'
  | 'RESPONSE_LIMIT_REACHED'
  | 'CIRCULAR_LOGIC'
  | 'DUPLICATE_ENTRY'
  | 'CONFLICT'

  // Rate limiting
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOO_MANY_REQUESTS'

  // Generic
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  /**
   * The resource being operated on (e.g., "question", "form", "response")
   */
  resource?: string;

  /**
   * The ID of the resource (e.g., question ID, form ID)
   */
  resourceId?: string;

  /**
   * The field that caused the error (for validation errors)
   */
  field?: string;

  /**
   * The operation being performed (e.g., "create", "update", "delete")
   */
  operation?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

export interface AppError {
  /**
   * User-friendly error message
   */
  message: string;

  /**
   * Machine-readable error code
   */
  code: ErrorCode;

  /**
   * Error category for grouping and handling
   */
  category: ErrorCategory;

  /**
   * Additional context about the error
   */
  context?: ErrorContext;

  /**
   * Whether this error is retryable
   */
  retryable?: boolean;

  /**
   * Suggested recovery actions for the user
   */
  recovery?: string[];

  /**
   * HTTP status code (for API responses)
   */
  statusCode?: number;

  /**
   * Original error (for debugging)
   */
  originalError?: unknown;

  /**
   * Timestamp when error occurred
   */
  timestamp?: string;
}

export interface ActionResult<T = unknown> {
  data?: T;
  error?: AppError;
  success?: boolean;
}

/**
 * Legacy format for backward compatibility
 * @deprecated Use ActionResult<T> instead
 */
export interface LegacyActionResult<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}
