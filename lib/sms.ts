import { logger } from "@/lib/logger";

/**
 * SMS service using Twilio
 * Provides functionality to send SMS messages
 */

interface SendSMSParams {
  to: string;
  message: string;
  email?: string;
  subject?: string;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an SMS message using Twilio with email fallback
 * @param params - The SMS parameters (to phone number, message, optional email and subject)
 * @returns Result object with success status and message ID or error
 */
export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { to, message, email, subject } = params;

  // Check for required Twilio environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    logger.error("Missing Twilio configuration", new Error("Twilio environment variables not set"), {
      operation: "sendSMS",
      to,
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    });

    // Try email fallback if SMS is not configured
    if (email) {
      return await sendEmailFallback({ email, message, subject });
    }

    return {
      success: false,
      error: "SMS service not configured",
    };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    logger.error("Failed to send SMS", error, {
      operation: "sendSMS",
      to,
    });

    // Try email fallback if SMS fails and email is provided
    if (email) {
      logger.error("SMS failed, attempting email fallback", error, {
        operation: "sendSMS",
        to,
        email,
      });
      return await sendEmailFallback({ email, message, subject });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends an email as a fallback when SMS fails
 * @param params - Email parameters (email address, message, optional subject)
 * @returns Result object with success status
 */
async function sendEmailFallback(params: {
  email: string;
  message: string;
  subject?: string;
}): Promise<SendSMSResult> {
  const { email, message, subject } = params;

  // Check for Postmark configuration
  if (!process.env.POSTMARK_API_TOKEN) {
    logger.error("Email fallback failed: Missing Postmark configuration", new Error("Postmark API token not set"), {
      operation: "sendEmailFallback",
      email,
    });
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const postmark = await import("postmark");
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
      To: email,
      Subject: subject || "Order Update",
      TextBody: message,
    });

    logger.error("SMS failed but email fallback succeeded", new Error("SMS delivery failed, used email"), {
      operation: "sendEmailFallback",
      email,
    });

    return {
      success: true,
      messageId: "email-fallback",
    };
  } catch (error) {
    logger.error("Email fallback failed", error, {
      operation: "sendEmailFallback",
      email,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email fallback failed",
    };
  }
}

/**
 * Generates an SMS message for order status updates
 * @param status - The order status (e.g., 'confirmed', 'shipped', 'delivered')
 * @param orderId - The order ID
 * @returns Formatted SMS message string
 */
export function getOrderStatusMessage(status: string, orderId: string): string {
  const statusMessages: Record<string, string> = {
    confirmed: `Your order ${orderId} has been confirmed and is being prepared.`,
    shipped: `Your order ${orderId} has been shipped and is on its way!`,
    delivered: `Your order ${orderId} has been delivered. Thank you for your purchase!`,
    cancelled: `Your order ${orderId} has been cancelled.`,
  };

  return statusMessages[status] || `Your order ${orderId} status has been updated to: ${status}`;
}
