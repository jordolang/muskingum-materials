/**
 * Request logging middleware utility with structured JSON logging
 * Provides HTTP request/response logging for monitoring and debugging
 */

import type { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Request log context interface
 */
interface RequestLogContext {
  method: string;
  path: string;
  userAgent?: string;
  clientIp?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * Extracts client IP address from request headers
 * @param request - Next.js request object
 * @returns Client IP address or 'unknown'
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for cases where headers are not available
  return 'unknown';
}

/**
 * Logs an incoming HTTP request
 * @param request - Next.js request object
 * @param additionalContext - Optional additional context to include in log
 */
export function logRequest(
  request: NextRequest,
  additionalContext?: Record<string, unknown>
): void {
  const context: RequestLogContext = {
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    clientIp: getClientIp(request),
    ...additionalContext,
  };

  logger.info('Incoming HTTP request', context);
}

/**
 * Logs an HTTP response
 * @param request - Next.js request object
 * @param response - Next.js response object
 * @param duration - Request duration in milliseconds
 * @param additionalContext - Optional additional context to include in log
 */
export function logResponse(
  request: NextRequest,
  response: NextResponse,
  duration: number,
  additionalContext?: Record<string, unknown>
): void {
  const context: RequestLogContext = {
    method: request.method,
    path: request.nextUrl.pathname,
    statusCode: response.status,
    duration,
    clientIp: getClientIp(request),
    ...additionalContext,
  };

  const message = `HTTP ${request.method} ${request.nextUrl.pathname} - ${response.status}`;

  // Log at different levels based on status code
  if (response.status >= 500) {
    logger.error(message, new Error(`Server error: ${response.status}`), context);
  } else if (response.status >= 400) {
    logger.warn(message, context);
  } else {
    logger.info(message, context);
  }
}

/**
 * Creates a middleware wrapper that logs requests and responses
 * @param handler - The middleware handler function to wrap
 * @returns Wrapped middleware handler with logging
 */
export function withRequestLogging(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    // Log incoming request
    logRequest(request);

    try {
      // Execute the handler
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Log the response
      logResponse(request, response, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error(
        `HTTP ${request.method} ${request.nextUrl.pathname} - Error`,
        error,
        {
          method: request.method,
          path: request.nextUrl.pathname,
          duration,
          clientIp: getClientIp(request),
        }
      );

      throw error;
    }
  };
}

/**
 * Logs an API route request/response for Next.js API routes
 * @param method - HTTP method
 * @param path - Request path
 * @param statusCode - Response status code
 * @param duration - Request duration in milliseconds
 * @param additionalContext - Optional additional context to include in log
 */
export function logApiRoute(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  additionalContext?: Record<string, unknown>
): void {
  const context: RequestLogContext = {
    method,
    path,
    statusCode,
    duration,
    ...additionalContext,
  };

  const message = `API ${method} ${path} - ${statusCode}`;

  // Log at different levels based on status code
  if (statusCode >= 500) {
    logger.error(message, new Error(`Server error: ${statusCode}`), context);
  } else if (statusCode >= 400) {
    logger.warn(message, context);
  } else {
    logger.info(message, context);
  }
}
