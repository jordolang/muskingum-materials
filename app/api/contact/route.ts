import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";

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
    await sendEmail({
      to: "sales@muskingummaterials.com",
      subject: `Website Contact: ${data.subject}`,
      textBody: `
New contact form submission:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Subject: ${data.subject}

Message:
${data.message}
      `.trim(),
      replyTo: data.email,
    });

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
