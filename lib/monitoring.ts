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

/**
 * SENTRY DASHBOARD CONFIGURATION GUIDE
 * =====================================
 *
 * The following dashboards should be configured in the Sentry web UI:
 * Sentry Dashboard > Dashboards > Create Dashboard
 *
 * DASHBOARD: Production Monitoring Overview
 * ------------------------------------------
 * Name: Production Monitoring - Error Rates & Performance
 * Description: Real-time monitoring of application health, error rates, and performance metrics
 *
 * WIDGET 1: Error Rate by Route
 * ------------------------------
 * Type: Line Chart
 * Title: Error Rate by Route (Last 7 Days)
 *
 * Query:
 *   - Metric: Events
 *   - Filters:
 *     * event.type equals error
 *     * environment equals production
 *   - Group by: transaction (this shows the route/endpoint)
 *   - Time Range: Last 7 days
 *   - Display: Line chart with multiple series (one per route)
 *
 * Purpose: Identify which API routes have the highest error rates
 *
 *
 * WIDGET 2: Response Time Percentiles
 * ------------------------------------
 * Type: Line Chart
 * Title: API Response Time Percentiles (Last 7 Days)
 *
 * Query:
 *   - Metric: transaction.duration
 *   - Filters:
 *     * environment equals production
 *     * transaction.op equals http.server
 *   - Aggregations:
 *     * p50 (median)
 *     * p75 (75th percentile)
 *     * p95 (95th percentile)
 *     * p99 (99th percentile)
 *   - Time Range: Last 7 days
 *   - Display: Line chart with multiple percentile lines
 *
 * Purpose: Monitor API response time distribution and identify performance degradation
 *
 *
 * WIDGET 3: Payment Success/Failure Rate
 * ---------------------------------------
 * Type: Big Number + Line Chart (2 widgets side by side)
 *
 * Widget 3a - Payment Failure Count:
 *   - Type: Big Number
 *   - Title: Payment Failures (Last 24 Hours)
 *   - Metric: Events
 *   - Filters:
 *     * error_type equals payment_failure
 *     * environment equals production
 *   - Time Range: Last 24 hours
 *   - Display: Large number with trend indicator
 *
 * Widget 3b - Payment Failure Trend:
 *   - Type: Line Chart
 *   - Title: Payment Failure Trend (Last 7 Days)
 *   - Metric: Events
 *   - Filters:
 *     * error_type equals payment_failure
 *     * environment equals production
 *   - Time Range: Last 7 days
 *   - Display: Line chart showing failures over time
 *
 * Purpose: Track payment processing health and identify payment provider issues
 *
 *
 * WIDGET 4: Rate Limit Violations
 * --------------------------------
 * Type: Table + Line Chart (2 widgets)
 *
 * Widget 4a - Rate Limit Warning Count:
 *   - Type: Big Number
 *   - Title: Rate Limit Warnings (Last 24 Hours)
 *   - Metric: Events
 *   - Filters:
 *     * warning_type equals rate_limit_approaching
 *     * environment equals production
 *   - Time Range: Last 24 hours
 *   - Display: Large number with trend indicator
 *
 * Widget 4b - Rate Limit Warnings by Endpoint:
 *   - Type: Table
 *   - Title: Rate Limit Warnings by Endpoint (Last 7 Days)
 *   - Metric: Events
 *   - Filters:
 *     * warning_type equals rate_limit_approaching
 *     * environment equals production
 *   - Group by: transaction
 *   - Sort by: Count (descending)
 *   - Time Range: Last 7 days
 *   - Limit: Top 10 endpoints
 *
 * Purpose: Identify endpoints approaching rate limits and prevent service degradation
 *
 *
 * WIDGET 5: Overall Error Rate Trend
 * -----------------------------------
 * Type: Area Chart
 * Title: Total Error Events (Last 7 Days)
 *
 * Query:
 *   - Metric: Events
 *   - Filters:
 *     * event.type equals error
 *     * environment equals production
 *   - Time Range: Last 7 days
 *   - Display: Area chart with hourly buckets
 *
 * Purpose: Monitor overall application health and detect error spikes
 *
 *
 * WIDGET 6: Database Error Rate
 * ------------------------------
 * Type: Line Chart
 * Title: Database Connection Errors (Last 7 Days)
 *
 * Query:
 *   - Metric: Events
 *   - Filters:
 *     * error_type equals database_connection
 *     * environment equals production
 *   - Time Range: Last 7 days
 *   - Display: Line chart
 *
 * Purpose: Monitor database health and connection pool issues
 *
 *
 * DASHBOARD LAYOUT
 * ----------------
 * Recommended widget arrangement (2-column grid):
 *
 * Row 1: [Widget 1: Error Rate by Route - Full Width]
 * Row 2: [Widget 2: Response Time Percentiles - Full Width]
 * Row 3: [Widget 3a: Payment Failures Count | Widget 3b: Payment Failure Trend]
 * Row 4: [Widget 4a: Rate Limit Count | Widget 4b: Rate Limit by Endpoint]
 * Row 5: [Widget 5: Overall Error Trend - Full Width]
 * Row 6: [Widget 6: Database Error Rate - Full Width]
 *
 *
 * DASHBOARD SETUP STEPS
 * ---------------------
 * 1. Navigate to Sentry Dashboard > Dashboards
 * 2. Click "Create Dashboard"
 * 3. Name: "Production Monitoring - Error Rates & Performance"
 * 4. Add each widget using the "Add Widget" button
 * 5. Configure each widget according to the specifications above
 * 6. Arrange widgets in the recommended layout
 * 7. Click "Save Dashboard"
 * 8. Set as default dashboard (optional)
 *
 *
 * VERIFICATION CHECKLIST
 * ----------------------
 * After dashboard configuration:
 *
 * ✓ Widget 1 shows error counts grouped by API route
 * ✓ Widget 2 displays response time percentiles (p50, p75, p95, p99)
 * ✓ Widget 3a/3b show payment failure metrics with trend data
 * ✓ Widget 4a/4b display rate limit warnings and top affected endpoints
 * ✓ Widget 5 shows overall error event trend over time
 * ✓ Widget 6 tracks database connection errors
 * ✓ All widgets display data for production environment only
 * ✓ Time ranges are set correctly (24h for big numbers, 7d for trends)
 * ✓ Dashboard loads within 2-3 seconds
 * ✓ Dashboard is accessible to all team members
 *
 *
 * DASHBOARD SCREENSHOT
 * --------------------
 * After configuring the dashboard:
 * 1. Navigate to the dashboard in Sentry
 * 2. Take a full-page screenshot showing all widgets
 * 3. Save screenshot to: .auto-claude/specs/028-structured-logging-production-monitoring/dashboard-screenshot.png
 * 4. Verify all widgets are visible and displaying data
 *
 *
 * MONITORING BEST PRACTICES
 * --------------------------
 * - Review dashboard daily during business hours
 * - Set up alerts for anomalies (covered in Alert Configuration above)
 * - Correlate error spikes with deployment times
 * - Monitor response time percentiles for performance regressions
 * - Track payment failure trends for business impact
 * - Review rate limit warnings before they become violations
 * - Export dashboard data weekly for long-term trend analysis
 */
