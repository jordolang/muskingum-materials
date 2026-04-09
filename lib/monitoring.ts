/**
 * Production monitoring and error tracking with Sentry
 * Provides error tracking, performance monitoring, and alerting capabilities
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Environment configuration for monitoring
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize Sentry monitoring
 * Should be called once at application startup
 */
export function initMonitoring(): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (isProduction) {
      console.warn('NEXT_PUBLIC_SENTRY_DSN not set - monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring - sample 10% of transactions in production
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Session replay - sample 10% of sessions in production
    replaysSessionSampleRate: isProduction ? 0.1 : 0,

    // Session replay on error - capture 100% of sessions with errors
    replaysOnErrorSampleRate: 1.0,

    // Don't send events in development unless explicitly enabled
    enabled: isProduction || process.env.SENTRY_ENABLED === 'true',

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

/**
 * Context metadata for monitoring events
 */
export interface MonitoringContext {
  userId?: string;
  requestId?: string;
  route?: string;
  [key: string]: unknown;
}

/**
 * Capture an error with Sentry and additional context
 * @param error - The error object or message
 * @param context - Optional context metadata
 */
export function captureError(
  error: Error | string,
  context?: MonitoringContext
): void {
  if (context) {
    Sentry.setContext('additional', context);
  }

  if (typeof error === 'string') {
    Sentry.captureMessage(error, 'error');
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a warning message with context
 * @param message - Warning message
 * @param context - Optional context metadata
 */
export function captureWarning(
  message: string,
  context?: MonitoringContext
): void {
  if (context) {
    Sentry.setContext('additional', context);
  }

  Sentry.captureMessage(message, 'warning');
}

/**
 * Set user context for monitoring
 * @param userId - User identifier
 */
export function setUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging context
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'payment', 'database', 'api')
 * @param data - Optional additional data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start a performance transaction
 * @param name - Transaction name (e.g., 'checkout', 'api.chat')
 * @param operation - Operation type (e.g., 'http.request', 'db.query')
 * @returns Transaction object that should be finished when done
 */
export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({ name, op: operation });
}

/**
 * Monitoring utility object with common methods
 */
export const monitoring = {
  init: initMonitoring,
  captureError,
  captureWarning,
  setUser,
  addBreadcrumb,
  startTransaction,
};

/**
 * Alert configuration (to be configured in Sentry web UI):
 *
 * 1. Payment Failure Alert
 *    - Trigger: Events with tag "error_type:payment_failure"
 *    - Notification: Email + Slack
 *    - Frequency: Immediate
 *
 * 2. Database Connection Alert
 *    - Trigger: Events with tag "error_type:database_connection"
 *    - Notification: Email + Slack
 *    - Frequency: Within 1 minute
 *
 * 3. Rate Limit Threshold Alert
 *    - Trigger: Events with tag "warning_type:rate_limit_approaching"
 *    - Notification: Email
 *    - Frequency: Once per hour
 */
