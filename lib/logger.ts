/**
 * Structured error logging utility
 * Provides better error formatting and context for debugging
 */

interface LogContext {
  [key: string]: unknown;
}

/**
 * Formats an error object for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Formats context object for logging
 */
function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  try {
    return `\nContext: ${JSON.stringify(context, null, 2)}`;
  } catch {
    return '\nContext: [Unable to serialize]';
  }
}

/**
 * Logs an error with structured formatting and optional context
 * @param message - Descriptive message about the error
 * @param error - The error object or value
 * @param context - Optional context object with additional debugging information
 */
export function logError(
  message: string,
  error: unknown,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const formattedError = formatError(error);
  const formattedContext = formatContext(context);

  console.error(
    `[${timestamp}] ERROR: ${message}\n${formattedError}${formattedContext}`
  );
}

/**
 * Logger object with error method for compatibility with existing patterns
 */
export const logger = {
  error: logError,
};
