/**
 * Error handling utilities for logging and user-friendly error messages
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface LoggedError {
  message: string;
  userMessage: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
}

/**
 * Converts technical error messages to user-friendly messages
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (typeof error === "string") {
    return convertErrorMessage(error);
  }

  if (error instanceof Error) {
    return convertErrorMessage(error.message);
  }

  // Handle fetch/network errors
  if (error && typeof error === "object") {
    if ("status" in error) {
      const status = (error as { status: number }).status;
      return getHttpErrorMessage(status);
    }
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      return convertErrorMessage((error as { message: string }).message);
    }
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Converts technical error messages to user-friendly ones
 */
function convertErrorMessage(technicalMessage: string): string {
  const lowerMessage = technicalMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch failed")) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  // Timeout errors
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "The request took too long. Please try again.";
  }

  // Authentication errors
  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("authentication")) {
    return "You need to be logged in to perform this action.";
  }

  // Permission errors
  if (lowerMessage.includes("forbidden") || lowerMessage.includes("permission")) {
    return "You don't have permission to perform this action.";
  }

  // Validation errors
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "Please check your input and try again.";
  }

  // Not found errors
  if (lowerMessage.includes("not found")) {
    return "The requested resource was not found.";
  }

  // Server errors
  if (lowerMessage.includes("server error") || lowerMessage.includes("internal")) {
    return "Something went wrong on our end. Please try again later.";
  }

  // Rate limiting
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Default fallback
  return "An error occurred. Please try again.";
}

/**
 * Maps HTTP status codes to user-friendly messages
 */
function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "You need to be logged in to perform this action.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 408:
      return "The request took too long. Please try again.";
    case 409:
      return "This action conflicts with existing data.";
    case 422:
      return "Please check your input and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on our end. Please try again later.";
    case 502:
    case 503:
      return "Service temporarily unavailable. Please try again in a few moments.";
    case 504:
      return "The request took too long. Please try again.";
    default:
      if (status >= 500) {
        return "Something went wrong on our end. Please try again later.";
      }
      if (status >= 400) {
        return "An error occurred. Please try again.";
      }
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Logs an error with context for debugging
 */
export function logError(error: unknown, context?: ErrorContext): LoggedError {
  const userMessage = getUserFriendlyMessage(error);
  const technicalMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const timestamp = new Date().toISOString();

  const loggedError: LoggedError = {
    message: technicalMessage,
    userMessage,
    stack,
    context,
    timestamp,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", {
      message: technicalMessage,
      userMessage,
      context,
      timestamp,
    });
    if (stack) {
      console.error("Stack trace:", stack);
    }
  }

  // In production, you might send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.

  return loggedError;
}

/**
 * Handles an error by logging it and returning a user-friendly message
 */
export function handleError(error: unknown, context?: ErrorContext): string {
  logError(error, context);
  return getUserFriendlyMessage(error);
}

/**
 * Type guard to check if an error is an API error with a status code
 */
export function isApiError(error: unknown): error is { status: number; message: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === "string") {
    return error.toLowerCase().includes("network") || error.toLowerCase().includes("fetch failed");
  }
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("fetch failed") ||
      error.name === "NetworkError"
    );
  }
  return false;
}
