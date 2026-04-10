import { logger } from "@/lib/logger";

/**
 * SMS service using Twilio
 * Provides functionality to send SMS messages
 */

interface SendSMSParams {
  to: string;
  message: string;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an SMS message using Twilio
 * @param params - The SMS parameters (to phone number and message)
 * @returns Result object with success status and message ID or error
 */
export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { to, message } = params;

  // Check for required Twilio environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    logger.error("Missing Twilio configuration", new Error("Twilio environment variables not set"), {
      operation: "sendSMS",
      to,
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    });
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
