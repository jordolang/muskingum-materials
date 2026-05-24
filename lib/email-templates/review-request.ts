export interface ReviewRequestEmailParams {
  customerName: string;
  orderNumber: string;
  baseUrl?: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Generate review request email content
 * @param params - Customer information and order details
 * @returns Email template with subject and body content
 */
export function generateReviewRequestEmail(
  params: ReviewRequestEmailParams
): EmailTemplate {
  const { customerName, orderNumber, baseUrl = "https://www.muskingummaterials.com" } = params;

  const reviewUrl = `${baseUrl}/reviews/submit?orderNumber=${encodeURIComponent(orderNumber)}`;
  const unsubscribeUrl = `${baseUrl}/account/settings?section=notifications`;

  const subject = "How was your experience with Muskingum Materials?";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Hi ${customerName},</h2>

    <p style="font-size: 16px; margin: 20px 0;">
      Thank you for choosing Muskingum Materials for your recent order (#${orderNumber}).
      We hope you're satisfied with your purchase!
    </p>

    <p style="font-size: 16px; margin: 20px 0;">
      Your feedback helps us improve and helps other customers make informed decisions.
      Would you take a moment to share your experience?
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}"
         style="display: inline-block; background-color: #e67e22; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Leave a Review
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin: 20px 0;">
      Your review will help us continue to provide quality materials and excellent service
      to our community in Zanesville and beyond.
    </p>

    <p style="font-size: 16px; margin: 20px 0;">
      Thank you for your business!
    </p>

    <p style="font-size: 16px; margin: 20px 0;">
      <strong>The Muskingum Materials Team</strong><br>
      1133 Ellis Dam Rd, Zanesville, OH 43701<br>
      (740) 452-9124
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      Don't want to receive review requests?
      <a href="${unsubscribeUrl}" style="color: #e67e22; text-decoration: underline;">
        Update your email preferences
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const textBody = `
Hi ${customerName},

Thank you for choosing Muskingum Materials for your recent order (#${orderNumber}). We hope you're satisfied with your purchase!

Your feedback helps us improve and helps other customers make informed decisions. Would you take a moment to share your experience?

Leave a review here:
${reviewUrl}

Your review will help us continue to provide quality materials and excellent service to our community in Zanesville and beyond.

Thank you for your business!

The Muskingum Materials Team
1133 Ellis Dam Rd, Zanesville, OH 43701
(740) 452-9124

---
Don't want to receive review requests? Update your email preferences:
${unsubscribeUrl}
  `.trim();

  return {
    subject,
    htmlBody,
    textBody,
  };
}
