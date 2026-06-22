import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Twilio webhook endpoint for SMS delivery status updates and TCPA-compliant opt-out handling.
 *
 * @access public (called by Twilio's webhook infrastructure)
 * @param request - Incoming webhook request with form-encoded body containing Twilio event data
 *   (MessageSid/SmsSid, MessageStatus/SmsStatus, Body, From, ErrorMessage, ErrorCode) and
 *   `x-twilio-signature` header for cryptographic verification. Body is parsed as URLSearchParams,
 *   not JSON.
 * @returns 501 `{ error: "Not configured" }` when required Twilio env vars are missing
 *   (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * @returns 400 `{ error: "No signature" }` when `x-twilio-signature` header is absent
 * @returns 400 `{ error: "Webhook verification failed" }` when signature validation fails
 * @returns 200 `{ success: true, action: "opted_out" }` when STOP command is processed
 * @returns 200 `{ success: true }` on successful status update or webhook acknowledgment
 * @throws 500 `{ error: "Webhook processing failed" }` when DB updates or signature validation throw
 * @see TCPA compliance: handles STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT by setting
 *   `smsOptIn: false` on matching UserProfile and Order records
 * @see SmsNotification status updates: maps Twilio MessageStatus to DB status field
 *   (sent → sent, delivered → delivered, failed/undelivered → failed with errorMsg)
 * @see Twilio webhook signature validation: {@link https://www.twilio.com/docs/usage/webhooks/webhooks-security}
 * @remarks This endpoint must be registered in Twilio console with the full public URL.
 *   Signature validation prevents replay attacks and unauthorized webhook submissions.
 *   DB failures during opt-out or status updates are logged but return 500 to trigger Twilio retry.
 */
export async function POST(request: NextRequest) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-twilio-signature");

  if (!signature) {
    logger.error("Twilio webhook missing signature", new Error("No signature header"), {
      operation: "twilioWebhook",
    });
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    // Parse form data from Twilio webhook
    const params = new URLSearchParams(body);
    const webhookData = Object.fromEntries(params.entries());

    // Validate signature using Twilio's webhook validator
    const twilio = await import("twilio");
    const validator = twilio.default.validateRequest;
    const url = request.url;

    const isValid = validator(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      webhookData
    );

    if (!isValid) {
      logger.error("Twilio webhook signature validation failed", new Error("Invalid signature"), {
        operation: "twilioWebhook",
        url,
      });
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    // Handle different webhook types
    const messageSid = webhookData.MessageSid || webhookData.SmsSid;
    const messageStatus = webhookData.MessageStatus || webhookData.SmsStatus;
    const messageBody = webhookData.Body;
    const fromNumber = webhookData.From;

    // Handle incoming STOP messages for TCPA compliance
    if (messageBody) {
      const normalizedBody = messageBody.trim().toUpperCase();
      const stopKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];

      if (stopKeywords.includes(normalizedBody)) {
        logger.info("Received STOP command", {
          operation: "twilioWebhook",
          from: fromNumber,
          command: normalizedBody,
        });

        // Find user profile by phone number and opt them out
        await prisma.userProfile.updateMany({
          where: { phone: fromNumber },
          data: { smsOptIn: false },
        });

        // Also opt out any orders with this phone number
        await prisma.order.updateMany({
          where: { phone: fromNumber },
          data: { smsOptIn: false },
        });

        logger.info("User opted out of SMS notifications", {
          operation: "twilioWebhook",
          phone: fromNumber,
        });

        return NextResponse.json({ success: true, action: "opted_out" });
      }
    }

    // Handle message status updates
    if (messageSid && messageStatus) {
      logger.info("Received message status update", {
        operation: "twilioWebhook",
        messageSid,
        status: messageStatus,
      });

      const updateData: {
        status: string;
        sentAt?: Date;
        errorMsg?: string;
      } = {
        status: messageStatus.toLowerCase(),
      };

      // Set sentAt timestamp for sent/delivered statuses
      if (messageStatus === "sent" || messageStatus === "delivered") {
        updateData.sentAt = new Date();
      }

      // Capture error message for failed statuses
      if (messageStatus === "failed" || messageStatus === "undelivered") {
        updateData.status = "failed";
        updateData.errorMsg = webhookData.ErrorMessage || webhookData.ErrorCode || "Delivery failed";
      }

      // Update SmsNotification record
      const updated = await prisma.smsNotification.updateMany({
        where: { providerId: messageSid },
        data: updateData,
      });

      logger.info("Updated SMS notification status", {
        operation: "twilioWebhook",
        messageSid,
        status: messageStatus,
        recordsUpdated: updated.count,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Webhook processing error", error, {
      operation: "twilioWebhook",
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
