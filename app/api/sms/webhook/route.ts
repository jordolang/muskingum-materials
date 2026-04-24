import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Twilio webhook endpoint for SMS delivery status updates and STOP command handling
 * Handles:
 * - MessageStatus events to update SmsNotification records
 * - Incoming STOP messages for TCPA compliance opt-out
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
