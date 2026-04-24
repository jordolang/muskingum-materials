/**
 * Structured JSON logging utility with monitoring integration
 * Provides JSON-formatted logs and optional Sentry integration
 */

import { captureError, captureWarning, addBreadcrumb } from './monitoring';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log levels for structured logging
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry format
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Formats an error object for structured logging
 */
function formatErrorForLog(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

/**
 * Outputs a structured JSON log entry
 */
function outputLog(entry: LogEntry): void {
  const output = JSON.stringify(entry);

  switch (entry.level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'info':
      console.info(output);
      break;
    case 'debug':
      console.debug(output);
      break;
  }
}

/**
 * Logs a debug message with optional context
 * @param message - Log message
 * @param context - Optional context data
 */
function logDebug(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'debug',
    message,
    context,
  };

  outputLog(entry);

  // Add breadcrumb for debugging
  if (context) {
    addBreadcrumb(message, 'debug', context);
  }
}

/**
 * Logs an info message with optional context
 * @param message - Log message
 * @param context - Optional context data
 */
function logInfo(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context,
  };

  outputLog(entry);

  // Add breadcrumb for tracking
  if (context) {
    addBreadcrumb(message, 'info', context);
  }
}

/**
 * Logs a warning message with optional context
 * @param message - Warning message
 * @param context - Optional context data
 */
function logWarn(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context,
  };

  outputLog(entry);

  // Send to monitoring in production
  captureWarning(message, context);
}

/**
 * Logs an error with structured formatting and optional context
 * @param message - Descriptive message about the error
 * @param error - The error object or value
 * @param context - Optional context object with additional debugging information
 */
function logError(
  message: string,
  error: unknown,
  context?: LogContext
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    error: formatErrorForLog(error),
    context,
  };

  outputLog(entry);

  // Send to monitoring in production
  const errorObj = error instanceof Error ? error : new Error(message);
  captureError(errorObj, context);
}

/**
 * Logger object with structured JSON logging methods
 */
export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};

/**
 * Legacy export for backward compatibility
 */
export { logError };
