import { prisma } from "@/lib/prisma";
import * as postmark from "postmark";

interface SendReviewRequestsResult {
  emailsSent: number;
  errors: number;
}

export async function sendReviewRequests(): Promise<SendReviewRequestsResult> {
  const result: SendReviewRequestsResult = {
    emailsSent: 0,
    errors: 0,
  };

  // Get delay from env var (defaults to 7 days, can be set to 1 minute for testing)
  const delayMinutes = process.env.REVIEW_REQUEST_DELAY_MINUTES
    ? parseInt(process.env.REVIEW_REQUEST_DELAY_MINUTES)
    : 7 * 24 * 60; // 7 days in minutes

  const delayMs = delayMinutes * 60 * 1000;
  const cutoffDate = new Date(Date.now() - delayMs);

  // Process at most this many eligible orders per run to keep the job bounded.
  const BATCH_SIZE = 100;

  try {
    // Order and ReviewSubmission are linked only by the orderNumber string
    // (there is no Prisma relation between them), so we exclude already-tracked
    // orders directly in the Order query's `where` clause rather than filtering
    // in memory after the fact.
    //
    // This ordering is critical: the batch limit must be applied AFTER
    // excluding already-reviewed orders. If we limited first and filtered in
    // memory afterwards, once the oldest BATCH_SIZE completed orders all had
    // review-tracking rows the job would keep selecting that same
    // already-reviewed batch every run, filter them all out, and never reach
    // newer eligible orders that still need a review email.
    const trackedSubmissions = await prisma.reviewSubmission.findMany({
      where: { orderNumber: { not: null } },
      select: { orderNumber: true },
    });

    const reviewedOrderNumbers = trackedSubmissions
      .map((submission) => submission.orderNumber)
      .filter(
        (orderNumber): orderNumber is string => orderNumber !== null
      );

    // Find completed orders that:
    // 1. Were completed before the cutoff date
    // 2. Don't already have a review submission (excluded in the query)
    // Oldest-first so the longest-waiting customers are contacted first, and
    // bounded to BATCH_SIZE so each run does a predictable amount of work.
    const ordersWithoutReviews = await prisma.order.findMany({
      where: {
        status: "completed",
        completedAt: {
          lte: cutoffDate,
          not: null,
        },
        orderNumber: { notIn: reviewedOrderNumbers },
      },
      orderBy: { completedAt: "asc" }, // Oldest first
      take: BATCH_SIZE,
    });

    // Send review request emails
    if (process.env.POSTMARK_API_TOKEN && ordersWithoutReviews.length > 0) {
      const client = new postmark.ServerClient(
        process.env.POSTMARK_API_TOKEN
      );

      for (const order of ordersWithoutReviews) {
        try {
          const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://muskingummaterials.com"}/reviews/submit?order=${order.orderNumber}`;

          await client.sendEmail({
            From:
              process.env.POSTMARK_FROM_EMAIL ||
              "noreply@muskingummaterials.com",
            To: order.email,
            Subject: "How was your experience with Muskingum Materials?",
            HtmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c5282; margin-top: 0;">Thanks for your order!</h1>
    <p style="font-size: 16px; margin-bottom: 0;">Hi ${order.name},</p>
  </div>

  <div style="padding: 20px 0;">
    <p style="font-size: 16px;">
      We hope you're enjoying your recent order from Muskingum Materials (Order #${order.orderNumber}).
    </p>

    <p style="font-size: 16px;">
      We'd love to hear about your experience! Your feedback helps us improve and helps other customers make informed decisions.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #2c5282; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Leave a Review
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Your review will help us continue to provide quality materials and excellent service to our community.
    </p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
    <p>
      Muskingum Materials<br>
      Quality Landscape Materials in Zanesville, OH
    </p>
  </div>
</body>
</html>
            `.trim(),
            TextBody: `
Hi ${order.name},

We hope you're enjoying your recent order from Muskingum Materials (Order #${order.orderNumber}).

We'd love to hear about your experience! Your feedback helps us improve and helps other customers make informed decisions.

Leave a review here: ${reviewUrl}

Your review will help us continue to provide quality materials and excellent service to our community.

Thanks,
Muskingum Materials
Quality Landscape Materials in Zanesville, OH
            `.trim(),
          });

          // Track that we sent a review request for this order
          await prisma.reviewSubmission.create({
            data: {
              userId: order.userId || undefined,
              orderNumber: order.orderNumber,
            },
          });

          result.emailsSent++;
        } catch (error) {
          console.error(
            `Failed to send review request for order ${order.orderNumber}:`,
            error
          );
          result.errors++;
        }
      }
    }
  } catch (error) {
    console.error("Error in sendReviewRequests job:", error);
    throw error;
  }

  return result;
}
