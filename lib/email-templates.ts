/**
 * Email template library for marketing automation
 * Provides reusable email templates for newsletters, promotions, and engagement
 */

import { BUSINESS_INFO } from "@/data/business";

/**
 * Email template content structure
 */
export interface EmailTemplateContent {
  subject: string;
  textBody: string;
  htmlBody: string;
}

/**
 * Newsletter welcome email template variables
 */
export interface WelcomeEmailVars {
  subscriberName?: string;
  subscriberEmail: string;
}

/**
 * Product promotion email template variables
 */
export interface PromotionEmailVars {
  subscriberName?: string;
  productName: string;
  productDescription: string;
  productPrice?: string;
  ctaUrl: string;
  ctaText?: string;
}

/**
 * Engagement follow-up email template variables
 */
export interface EngagementEmailVars {
  subscriberName?: string;
  lastInteractionDays?: number;
}

/**
 * Generates a welcome email for new newsletter subscribers
 *
 * @param vars - Template variables for personalization
 * @returns Email content with subject, text body, and HTML body
 */
export function generateWelcomeEmail(vars: WelcomeEmailVars): EmailTemplateContent {
  const greeting = vars.subscriberName ? `Hi ${vars.subscriberName}` : "Hello";

  const subject = `Welcome to ${BUSINESS_INFO.name}!`;

  const textBody = `
${greeting},

Thank you for subscribing to ${BUSINESS_INFO.name}!

We're excited to have you join our community. You'll receive updates about:
- New products and materials
- Special offers and promotions
- Industry tips and best practices
- Company news and updates

${BUSINESS_INFO.tagline}

${BUSINESS_INFO.name}
${BUSINESS_INFO.address}
${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
Phone: ${BUSINESS_INFO.phone}
Email: ${BUSINESS_INFO.email}
Website: ${BUSINESS_INFO.website}

Hours: ${BUSINESS_INFO.hours}

To unsubscribe, reply to this email with "unsubscribe" in the subject line.
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #1e3a8a; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px;">${BUSINESS_INFO.name}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">${BUSINESS_INFO.tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e3a8a;">${greeting}!</h2>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                Thank you for subscribing to ${BUSINESS_INFO.name}!
              </p>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                We're excited to have you join our community. You'll receive updates about:
              </p>
              <ul style="margin: 0 0 20px 20px; line-height: 1.8; color: #333333;">
                <li>New products and materials</li>
                <li>Special offers and promotions</li>
                <li>Industry tips and best practices</li>
                <li>Company news and updates</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong>${BUSINESS_INFO.name}</strong><br>
                ${BUSINESS_INFO.address}<br>
                ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Phone: ${BUSINESS_INFO.phone}<br>
                Email: <a href="mailto:${BUSINESS_INFO.email}" style="color: #1e3a8a;">${BUSINESS_INFO.email}</a><br>
                Website: <a href="${BUSINESS_INFO.website}" style="color: #1e3a8a;">${BUSINESS_INFO.website}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Hours: ${BUSINESS_INFO.hours}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0;">
                To unsubscribe, reply to this email with "unsubscribe" in the subject line.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, textBody, htmlBody };
}

/**
 * Generates a product promotion email
 *
 * @param vars - Template variables for product details and CTA
 * @returns Email content with subject, text body, and HTML body
 */
export function generatePromotionEmail(vars: PromotionEmailVars): EmailTemplateContent {
  const greeting = vars.subscriberName ? `Hi ${vars.subscriberName}` : "Hello";
  const ctaText = vars.ctaText || "Learn More";
  const priceInfo = vars.productPrice ? `\nPrice: ${vars.productPrice}` : "";

  const subject = `Check out ${vars.productName} at ${BUSINESS_INFO.name}`;

  const textBody = `
${greeting},

We wanted to let you know about ${vars.productName}!

${vars.productDescription}${priceInfo}

${ctaText}: ${vars.ctaUrl}

${BUSINESS_INFO.name}
${BUSINESS_INFO.phone}
${BUSINESS_INFO.email}
${BUSINESS_INFO.website}

To unsubscribe, reply to this email with "unsubscribe" in the subject line.
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #1e3a8a; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px;">${BUSINESS_INFO.name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e3a8a;">${greeting}!</h2>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                We wanted to let you know about <strong>${vars.productName}</strong>!
              </p>
              <p style="margin: 0 0 20px 0; line-height: 1.6; color: #333333;">
                ${vars.productDescription}
              </p>
              ${vars.productPrice ? `<p style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #1e3a8a;">${vars.productPrice}</p>` : ""}
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #1e3a8a;">
                    <a href="${vars.ctaUrl}" style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-align: center;">
                <strong>${BUSINESS_INFO.name}</strong><br>
                Phone: ${BUSINESS_INFO.phone} | Email: <a href="mailto:${BUSINESS_INFO.email}" style="color: #1e3a8a;">${BUSINESS_INFO.email}</a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                <a href="${BUSINESS_INFO.website}" style="color: #1e3a8a;">${BUSINESS_INFO.website}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0;">
                To unsubscribe, reply to this email with "unsubscribe" in the subject line.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, textBody, htmlBody };
}

/**
 * Generates an engagement follow-up email for inactive subscribers
 *
 * @param vars - Template variables for personalization
 * @returns Email content with subject, text body, and HTML body
 */
export function generateEngagementEmail(vars: EngagementEmailVars): EmailTemplateContent {
  const greeting = vars.subscriberName ? `Hi ${vars.subscriberName}` : "Hello";
  const daysText = vars.lastInteractionDays
    ? `It's been ${vars.lastInteractionDays} days since we last heard from you, and we wanted to check in.`
    : "We wanted to check in and see how we can help with your next project.";

  const subject = "We're here to help with your next project";

  const textBody = `
${greeting},

${daysText}

At ${BUSINESS_INFO.name}, we're committed to providing Southeast Ohio with quality sand, soil, and gravel products at fair prices.

Whether you're planning a landscaping project, construction job, or need materials for maintenance, we're here to help.

What we offer:
- Family-owned service you can trust
- Large-quantity pricing for big projects
- On-site state-approved scales
- Delivery available (up to 20 tons per load)

Have a project in mind? Give us a call at ${BUSINESS_INFO.phone} or visit our website at ${BUSINESS_INFO.website}

We look forward to hearing from you!

${BUSINESS_INFO.name}
${BUSINESS_INFO.address}
${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
Phone: ${BUSINESS_INFO.phone}
Email: ${BUSINESS_INFO.email}

Hours: ${BUSINESS_INFO.hours}

To unsubscribe, reply to this email with "unsubscribe" in the subject line.
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #1e3a8a; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px;">${BUSINESS_INFO.name}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">${BUSINESS_INFO.tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e3a8a;">${greeting}!</h2>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                ${daysText}
              </p>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                At ${BUSINESS_INFO.name}, we're committed to providing Southeast Ohio with quality sand, soil, and gravel products at fair prices.
              </p>
              <p style="margin: 0 0 15px 0; line-height: 1.6; color: #333333;">
                Whether you're planning a landscaping project, construction job, or need materials for maintenance, we're here to help.
              </p>
              <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid #1e3a8a;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e3a8a;">What we offer:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #333333;">
                  <li>Family-owned service you can trust</li>
                  <li>Large-quantity pricing for big projects</li>
                  <li>On-site state-approved scales</li>
                  <li>Delivery available (up to 20 tons per load)</li>
                </ul>
              </div>
              <p style="margin: 20px 0 15px 0; line-height: 1.6; color: #333333;">
                Have a project in mind? Give us a call at <a href="tel:${BUSINESS_INFO.phone}" style="color: #1e3a8a; text-decoration: none;">${BUSINESS_INFO.phone}</a> or visit our website.
              </p>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #1e3a8a;">
                    <a href="${BUSINESS_INFO.website}" style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">
                      Visit Our Website
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; line-height: 1.6; color: #333333;">
                We look forward to hearing from you!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong>${BUSINESS_INFO.name}</strong><br>
                ${BUSINESS_INFO.address}<br>
                ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Phone: <a href="tel:${BUSINESS_INFO.phone}" style="color: #1e3a8a;">${BUSINESS_INFO.phone}</a><br>
                Email: <a href="mailto:${BUSINESS_INFO.email}" style="color: #1e3a8a;">${BUSINESS_INFO.email}</a><br>
                Website: <a href="${BUSINESS_INFO.website}" style="color: #1e3a8a;">${BUSINESS_INFO.website}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Hours: ${BUSINESS_INFO.hours}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0;">
                To unsubscribe, reply to this email with "unsubscribe" in the subject line.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, textBody, htmlBody };
}
