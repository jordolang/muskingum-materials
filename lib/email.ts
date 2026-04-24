/**
 * Email sending utility using Postmark
 * Provides graceful degradation when Postmark is not configured
 */

import { logger } from "./logger";

interface SendEmailParams {
  to: string;
  subject: string;
  textBody: string;
  replyTo?: string;
}

/**
 * Sends an email using Postmark
 * @param params - Email parameters (to, subject, textBody, replyTo)
 * @returns true on success, false on failure or if Postmark is not configured
 */
export async function sendEmail({
  to,
  subject,
  textBody,
  replyTo,
}: SendEmailParams): Promise<boolean> {
  // Check if Postmark is configured
  if (!process.env.POSTMARK_API_TOKEN) {
    return false;
  }

  try {
    // Dynamic import for Postmark client
    const postmark = await import("postmark");
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    // Send email
    await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
      To: to,
      Subject: subject,
      TextBody: textBody,
      ReplyTo: replyTo,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send email", error, {
      to,
      subject,
      hasReplyTo: !!replyTo,
    });
    return false;
  }
}
