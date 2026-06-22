import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { sendNotificationEmail } from "@/lib/email-service";

/**
 * Handle contact form submissions from the website.
 *
 * @access public
 * @param request - Incoming request with body validated against {@link contactSchema} in lib/schemas.ts
 * @returns 200 `{ success: true, analytics: { subject: string } }`
 * @throws 400 `{ error: "Invalid form data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Failed to save contact submission" }` on database error
 * @throws 500 `{ error: "Internal server error" }` on unexpected error
 * @see contactSchema in lib/schemas.ts for request body shape
 * @see rateLimitedEndpoints in middleware.ts — contact-quote tier (10 req/hr)
 * @see {@link https://postmarkapp.com} — email notification sent to sales team on success
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Save to database
    try {
      await prisma.contactSubmission.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject,
          message: data.message,
        },
      });
    } catch (dbError) {
      logger.error("Database error saving contact submission", dbError, {
        operation: "contactSubmission.create",
        email: data.email,
        subject: data.subject,
      });
      return NextResponse.json(
        { error: "Failed to save contact submission" },
        { status: 500 }
      );
    }

    // Send email notification to sales team
    await sendNotificationEmail(
      `Website Contact: ${data.subject}`,
      `
New contact form submission:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Subject: ${data.subject}

Message:
${data.message}
      `.trim(),
      {
        replyTo: data.email,
        tag: "contact-form",
        metadata: {
          contactName: data.name,
          contactEmail: data.email,
          subject: data.subject,
        },
      }
    );

    return NextResponse.json({
      success: true,
      analytics: {
        subject: data.subject,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Contact API error", error, {
      operation: "contact.POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
