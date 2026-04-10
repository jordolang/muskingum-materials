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
 * Start a performance span
 * @param name - Span name (e.g., 'checkout', 'api.chat')
 * @param operation - Operation type (e.g., 'http.request', 'db.query')
 * @param callback - Function to execute within the span
 * @returns Result of the callback function
 */
export function startTransaction<T>(
  name: string,
  operation: string,
  callback: () => T
): T {
  return Sentry.startSpan(
    { name, op: operation },
    callback
  );
}

/**
 * Capture a payment failure error with proper tagging for alerting
 * @param error - The payment error
 * @param context - Optional context (e.g., amount, currency, provider)
 */
export function capturePaymentFailure(
  error: Error | string,
  context?: MonitoringContext
): void {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'payment_failure');
    scope.setLevel('error');

    if (context) {
      scope.setContext('payment', context);
    }

    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error');
    } else {
      Sentry.captureException(error);
    }
  });
}

/**
 * Capture a database connection error with proper tagging for alerting
 * @param error - The database error
 * @param context - Optional context (e.g., query, table, operation)
 */
export function captureDatabaseError(
  error: Error | string,
  context?: MonitoringContext
): void {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'database_connection');
    scope.setLevel('error');

    if (context) {
      scope.setContext('database', context);
    }

    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error');
    } else {
      Sentry.captureException(error);
    }
  });
}

/**
 * Capture a rate limit warning with proper tagging for alerting
 * @param message - Warning message about rate limit
 * @param context - Optional context (e.g., current_usage, limit, endpoint)
 */
export function captureRateLimitWarning(
  message: string,
  context?: MonitoringContext
): void {
  Sentry.withScope((scope) => {
    scope.setTag('warning_type', 'rate_limit_approaching');
    scope.setLevel('warning');

    if (context) {
      scope.setContext('rate_limit', context);
    }

    Sentry.captureMessage(message, 'warning');
  });
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
  capturePaymentFailure,
  captureDatabaseError,
  captureRateLimitWarning,
};

/**
 * SENTRY ALERT CONFIGURATION GUIDE
 * =================================
 *
 * The following alerts should be configured in the Sentry web UI:
 * Sentry Dashboard > Alerts > Create Alert Rule
 *
 * ALERT 1: Payment Failure Alert
 * -------------------------------
 * Name: Payment Failure - Immediate Alert
 *
 * Conditions:
 *   - When: An event is captured
 *   - If: ALL of these filters match
 *     * The event's tags match: error_type equals payment_failure
 *     * The event's level is equal to error
 *
 * Actions:
 *   - Send a notification via Email (all project members)
 *   - Send a notification via Slack (#alerts channel)
 *
 * Alert Settings:
 *   - Frequency: On every new issue
 *   - Alert owner: Engineering team
 *
 * Usage in code:
 *   capturePaymentFailure(error, { amount: 99.99, provider: 'stripe' })
 *
 *
 * ALERT 2: Database Connection Alert
 * -----------------------------------
 * Name: Database Connection Error
 *
 * Conditions:
 *   - When: An event is captured
 *   - If: ALL of these filters match
 *     * The event's tags match: error_type equals database_connection
 *     * The event's level is equal to error
 *
 * Actions:
 *   - Send a notification via Email (on-call engineers)
 *   - Send a notification via Slack (#database-alerts channel)
 *
 * Alert Settings:
 *   - Frequency: At most once every 1 minute for an issue
 *   - Alert owner: Database team
 *
 * Usage in code:
 *   captureDatabaseError(error, { operation: 'query', table: 'users' })
 *
 *
 * ALERT 3: Rate Limit Threshold Alert
 * ------------------------------------
 * Name: Rate Limit Approaching Threshold
 *
 * Conditions:
 *   - When: An event is captured
 *   - If: ALL of these filters match
 *     * The event's tags match: warning_type equals rate_limit_approaching
 *     * The event's level is equal to warning
 *
 * Actions:
 *   - Send a notification via Email (engineering leads)
 *
 * Alert Settings:
 *   - Frequency: At most once every 1 hour for an issue
 *   - Alert owner: Infrastructure team
 *
 * Usage in code:
 *   captureRateLimitWarning('API rate limit at 80%', {
 *     current_usage: 800,
 *     limit: 1000,
 *     endpoint: '/api/chat'
 *   })
 *
 *
 * VERIFICATION STEPS
 * ------------------
 * After configuring these alerts in Sentry:
 *
 * 1. Test each alert by triggering the corresponding capture function in a
 *    development or staging environment with SENTRY_ENABLED=true
 *
 * 2. Verify that notifications are received via the configured channels
 *
 * 3. Check alert frequency throttling is working as expected
 *
 * 4. Review alert history in Sentry Dashboard > Alerts > Alert History
 */
