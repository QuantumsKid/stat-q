/**
 * Custom error message components
 * Displays structured errors with context, recovery suggestions, and proper styling
 */

'use client';

import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { AppError } from '@/lib/types/error.types';
import { formatErrorMessage, getRecoverySuggestions } from '@/lib/utils/error-handler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  error: AppError | string;
  className?: string;
  showRecovery?: boolean;
  showContext?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
}

/**
 * Display a structured error message with icon and optional recovery suggestions
 */
export function ErrorMessage({
  error,
  className,
  showRecovery = true,
  showContext = false,
  variant,
}: ErrorMessageProps) {
  // Handle string errors
  if (typeof error === 'string') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Determine variant based on error category if not specified
  const effectiveVariant = variant || getVariantFromCategory(error.category);
  const Icon = getIconFromCategory(error.category);

  const recoverySuggestions = showRecovery ? getRecoverySuggestions(error) : [];

  return (
    <Alert variant={effectiveVariant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{getCategoryTitle(error.category)}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{formatErrorMessage(error)}</p>

        {showContext && error.context && (
          <div className="text-xs opacity-75 space-y-1">
            {error.context.resource && (
              <p>Resource: {error.context.resource}</p>
            )}
            {error.context.field && (
              <p>Field: {error.context.field}</p>
            )}
            {error.context.operation && (
              <p>Operation: {error.context.operation}</p>
            )}
          </div>
        )}

        {recoverySuggestions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-current/20">
            <p className="text-sm font-medium mb-1">What you can do:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {recoverySuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline field error message (for form fields)
 */
interface FieldErrorProps {
  error?: AppError | string;
  fieldName?: string;
  className?: string;
}

export function FieldError({ error, fieldName, className }: FieldErrorProps) {
  if (!error) return null;

  const message = typeof error === 'string'
    ? error
    : formatErrorMessage(error);

  return (
    <p
      className={cn(
        'text-sm font-medium text-destructive flex items-center gap-1',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-3 w-3" />
      {fieldName && <span className="sr-only">{fieldName} error: </span>}
      {message}
    </p>
  );
}

/**
 * Error summary for multiple validation errors
 */
interface ErrorSummaryProps {
  errors: Array<AppError | string>;
  title?: string;
  className?: string;
}

export function ErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className,
}: ErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {errors.map((error, index) => (
            <li key={index}>
              {typeof error === 'string' ? error : formatErrorMessage(error)}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Retry prompt for retryable errors
 */
interface RetryPromptProps {
  error: AppError;
  onRetry: () => void;
  loading?: boolean;
  className?: string;
}

export function RetryPrompt({
  error,
  onRetry,
  loading = false,
  className,
}: RetryPromptProps) {
  if (!error.retryable) return null;

  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Connection Issue</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{formatErrorMessage(error)}</p>
        <button
          onClick={onRetry}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Retrying...' : 'Try Again'}
        </button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty state with action (for NOT_FOUND errors)
 */
interface NotFoundMessageProps {
  resourceType: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function NotFoundMessage({
  resourceType,
  message,
  actionLabel,
  onAction,
  className,
}: NotFoundMessageProps) {
  return (
    <Alert variant="default" className={className}>
      <Info className="h-4 w-4" />
      <AlertTitle>{resourceType} Not Found</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {message ||
            `The ${resourceType.toLowerCase()} you're looking for doesn't exist or you don't have permission to view it.`}
        </p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            {actionLabel}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Helper functions

function getVariantFromCategory(
  category: string
): 'default' | 'destructive' | 'warning' {
  switch (category) {
    case 'VALIDATION':
      return 'warning';
    case 'AUTH':
    case 'PERMISSION':
      return 'destructive';
    case 'NETWORK':
    case 'RATE_LIMIT':
      return 'warning';
    case 'NOT_FOUND':
      return 'default';
    default:
      return 'destructive';
  }
}

function getIconFromCategory(category: string) {
  switch (category) {
    case 'VALIDATION':
      return AlertTriangle;
    case 'AUTH':
    case 'PERMISSION':
      return XCircle;
    case 'NETWORK':
    case 'RATE_LIMIT':
      return AlertCircle;
    case 'NOT_FOUND':
      return Info;
    default:
      return AlertCircle;
  }
}

function getCategoryTitle(category: string): string {
  switch (category) {
    case 'VALIDATION':
      return 'Validation Error';
    case 'AUTH':
      return 'Authentication Required';
    case 'PERMISSION':
      return 'Permission Denied';
    case 'NETWORK':
      return 'Connection Error';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'RATE_LIMIT':
      return 'Too Many Requests';
    case 'DATABASE':
    case 'SERVER':
      return 'Server Error';
    default:
      return 'Error';
  }
}
