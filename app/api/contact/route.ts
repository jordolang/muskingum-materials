import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/schemas";

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
    } catch {
      // Database not configured yet
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
        console.error("Email send error:", emailError);
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
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
