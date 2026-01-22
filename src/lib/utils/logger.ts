/**
 * Structured logging utility for server actions
 * Provides consistent logging with context, severity levels, and monitoring integration
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  // User context
  userId?: string;
  userEmail?: string;

  // Resource context
  formId?: string;
  questionId?: string;
  responseId?: string;
  answerId?: string;

  // Operation context
  action?: string;
  operation?: string;
  method?: string;

  // Request context
  requestId?: string;
  userAgent?: string;
  ip?: string;

  // Performance
  duration?: number;
  startTime?: number;

  // Additional metadata
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private env: string;
  private enableConsole: boolean;

  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.enableConsole = this.env === 'development' || process.env.ENABLE_CONSOLE_LOGS === 'true';
  }

  /**
   * Log a debug message (verbose information for development)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message (general informational messages)
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning (potentially harmful situations)
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error (error events that might still allow the app to continue)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = this.serializeError(error);
    this.log('error', message, { ...context, error: errorDetails });
  }

  /**
   * Log a fatal error (severe errors that cause premature termination)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = this.serializeError(error);
    this.log('fatal', message, { ...context, error: errorDetails });
  }

  /**
   * Log a server action (convenience method for tracking actions)
   */
  action(actionName: string, context?: LogContext): void {
    this.info(`Server action: ${actionName}`, {
      ...context,
      action: actionName,
    });
  }

  /**
   * Log the start of an operation (returns a function to log completion)
   */
  startOperation(operation: string, context?: LogContext): () => void {
    const startTime = Date.now();
    this.debug(`Starting: ${operation}`, { ...context, operation });

    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Completed: ${operation}`, {
        ...context,
        operation,
        duration,
      });
    };
  }

  /**
   * Log with performance timing
   */
  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operation}`, {
        ...context,
        operation,
        duration,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operation}`, error, {
        ...context,
        operation,
        duration,
        success: false,
      });
      throw error;
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext & { error?: unknown }): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
    };

    // Add error details if present
    if (context?.error) {
      entry.error = context.error as LogEntry['error'];
    }

    // Console logging (development)
    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    // Send to external logging service in production
    if (this.env === 'production') {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Serialize error for logging
   */
  private serializeError(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as { code?: string }).code,
      };
    }

    if (typeof error === 'object') {
      const err = error as { message?: string; code?: string; name?: string };
      return {
        name: err.name || 'UnknownError',
        message: err.message || String(error),
        code: err.code,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
    };
  }

  /**
   * Remove sensitive data from context before logging
   */
  private sanitizeContext(context?: LogContext & { error?: unknown }): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Mask email partially
    if (sanitized.userEmail) {
      const [username, domain] = sanitized.userEmail.split('@');
      if (username && domain) {
        sanitized.userEmail = `${username.slice(0, 2)}***@${domain}`;
      }
    }

    // Remove error from context (it's handled separately)
    delete sanitized.error;

    return sanitized;
  }

  /**
   * Log to console with color coding
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level];
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
    const timestamp = new Date(entry.timestamp).toISOString();

    console.log(`${prefix} ${timestamp} - ${entry.message}`);

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  Context:', entry.context);
    }

    if (entry.error) {
      console.error('  Error:', entry.error);
      if (entry.error.stack) {
        console.error('  Stack:', entry.error.stack);
      }
    }
  }

  /**
   * Send logs to external monitoring service (placeholder)
   * In production, integrate with services like:
   * - Sentry
   * - Datadog
   * - LogRocket
   * - CloudWatch
   * - Custom logging endpoint
   */
  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Implement integration with monitoring service
    // Example for Sentry:
    // if (entry.level === 'error' || entry.level === 'fatal') {
    //   Sentry.captureException(entry.error, {
    //     level: entry.level,
    //     tags: {
    //       action: entry.context?.action,
    //       userId: entry.context?.userId,
    //     },
    //     extra: entry.context,
    //   });
    // }

    // For now, just track errors in console even in production
    if ((entry.level === 'error' || entry.level === 'fatal') && !this.enableConsole) {
      console.error('[Production Error]', entry);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a logger with default context (useful for specific modules)
 */
export function createLogger(defaultContext: LogContext): {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
  fatal: (message: string, error?: Error | unknown, context?: LogContext) => void;
  action: (actionName: string, context?: LogContext) => void;
} {
  return {
    debug: (message, context) => logger.debug(message, { ...defaultContext, ...context }),
    info: (message, context) => logger.info(message, { ...defaultContext, ...context }),
    warn: (message, context) => logger.warn(message, { ...defaultContext, ...context }),
    error: (message, error, context) => logger.error(message, error, { ...defaultContext, ...context }),
    fatal: (message, error, context) => logger.fatal(message, error, { ...defaultContext, ...context }),
    action: (actionName, context) => logger.action(actionName, { ...defaultContext, ...context }),
  };
}
