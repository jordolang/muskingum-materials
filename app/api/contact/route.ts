import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

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

    // Send email via Postmark
    if (process.env.POSTMARK_API_TOKEN) {
      try {
        const postmark = await import("postmark");
        const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
        await client.sendEmail({
          From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
          To: "sales@muskingummaterials.com",
          Subject: `Website Contact: ${data.subject}`,
          TextBody: `
New contact form submission:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Subject: ${data.subject}

Message:
${data.message}
          `.trim(),
          ReplyTo: data.email,
        });
      } catch (emailError) {
        logger.error("Failed to send contact email notification", emailError, {
          operation: "postmark.sendEmail",
          email: data.email,
          subject: data.subject,
        });
      }
    }

    return NextResponse.json({ success: true });
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
