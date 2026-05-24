/**
 * Email service utility with Postmark integration
 * Provides reusable email sending functionality with graceful degradation
 */

import { logger } from "@/lib/logger";

/**
 * Email message structure for sending emails
 */
export interface EmailMessage {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  from?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

/**
 * Result of email send operation
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template types for tracking and categorization
 */
export type EmailTemplate =
  | "contact-form"
  | "quote-request"
  | "order-confirmation"
  | "newsletter-welcome"
  | "newsletter-broadcast"
  | "lead-notification";

/**
 * Gets or creates a Postmark client instance
 * Returns null if POSTMARK_API_TOKEN is not configured
 */
async function getPostmarkClient() {
  if (!process.env.POSTMARK_API_TOKEN) {
    return null;
  }

  try {
    const postmark = await import("postmark");
    return new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
  } catch (error) {
    logger.error("Failed to initialize Postmark client", error);
    return null;
  }
}

/**
 * Gets the default "From" email address
 */
function getDefaultFromEmail(): string {
  return process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com";
}

/**
 * Gets the default recipient email for notifications
 */
function getDefaultToEmail(): string {
  return process.env.POSTMARK_TO_EMAIL || "sales@muskingummaterials.com";
}

/**
 * Sends an email via Postmark
 * Falls back gracefully if Postmark is not configured
 *
 * @param message - Email message to send
 * @returns Result indicating success or failure
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const client = await getPostmarkClient();

  if (!client) {
    logger.error("Email service not configured - POSTMARK_API_TOKEN missing", null, {
      to: message.to,
      subject: message.subject,
    });
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const response = await client.sendEmail({
      From: message.from || getDefaultFromEmail(),
      To: message.to,
      Subject: message.subject,
      TextBody: message.textBody,
      HtmlBody: message.htmlBody,
      ReplyTo: message.replyTo,
      Tag: message.tag,
      Metadata: message.metadata,
    });

    return {
      success: true,
      messageId: response.MessageID,
    };
  } catch (error) {
    logger.error("Failed to send email via Postmark", error, {
      to: message.to,
      subject: message.subject,
      tag: message.tag,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends a notification email to the default recipient (sales team)
 * Useful for contact forms, quote requests, etc.
 *
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendNotificationEmail(
  subject: string,
  textBody: string,
  options?: {
    replyTo?: string;
    tag?: EmailTemplate;
    metadata?: Record<string, string>;
    htmlBody?: string;
  }
): Promise<EmailSendResult> {
  return sendEmail({
    to: getDefaultToEmail(),
    subject,
    textBody,
    htmlBody: options?.htmlBody,
    replyTo: options?.replyTo,
    tag: options?.tag,
    metadata: options?.metadata,
  });
}

/**
 * Sends a transactional email to a customer
 * Used for order confirmations, account notifications, etc.
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  textBody: string,
  options?: {
    htmlBody?: string;
    tag?: EmailTemplate;
    metadata?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  return sendEmail({
    to,
    subject,
    textBody,
    htmlBody: options?.htmlBody,
    tag: options?.tag,
    metadata: options?.metadata,
  });
}

/**
 * Sends a marketing email (newsletter, promotional)
 * Includes tracking metadata for campaign management
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param htmlBody - Email body (HTML)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendMarketingEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  options?: {
    campaignId?: string;
    tag?: string;
    metadata?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  const metadata: Record<string, string> = {
    ...options?.metadata,
    type: "marketing",
  };

  if (options?.campaignId) {
    metadata.campaignId = options.campaignId;
  }

  return sendEmail({
    to,
    subject,
    textBody,
    htmlBody,
    tag: options?.tag || "newsletter-broadcast",
    metadata,
  });
}

/**
 * Validates email configuration
 * Useful for health checks and startup validation
 *
 * @returns True if email service is properly configured
 */
export async function isEmailServiceConfigured(): Promise<boolean> {
  const client = await getPostmarkClient();
  return client !== null;
}
