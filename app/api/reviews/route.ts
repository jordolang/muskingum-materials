import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { previewClient } from "@/lib/sanity/client";
import { reviewSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID if available (optional for guest submissions)
    const session = await auth();
    const userId = session?.userId || null;

    const body = await request.json();
    const data = reviewSchema.parse(body);

    // Create testimonial document in Sanity with approved: false
    let sanityDocumentId: string;
    try {
      const sanityDoc = await previewClient.create({
        _type: "testimonial",
        name: data.name,
        rating: data.rating,
        text: data.text,
        projectType: data.projectType,
        approved: false,
      });
      sanityDocumentId = sanityDoc._id;
    } catch (sanityError) {
      logger.error("Sanity error creating testimonial", sanityError, {
        operation: "testimonial.create",
        name: data.name,
        rating: data.rating,
      });
      return NextResponse.json(
        { error: "Failed to save review" },
        { status: 500 }
      );
    }

    // Save tracking record to database
    try {
      await prisma.reviewSubmission.create({
        data: {
          userId,
          sanityDocumentId,
          orderNumber: data.orderNumber || null,
        },
      });
    } catch (dbError) {
      logger.error("Database error saving review submission", dbError, {
        operation: "reviewSubmission.create",
        sanityDocumentId,
        orderNumber: data.orderNumber,
      });
      // Review is already in Sanity, so we don't return error here
      // Just log it for manual reconciliation
    }

    // Send notification email to business owner via Postmark
    if (process.env.POSTMARK_API_TOKEN) {
      try {
        const postmark = await import("postmark");
        const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
        await client.sendEmail({
          From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
          To: "sales@muskingummaterials.com",
          Subject: "New Customer Review Submitted",
          TextBody: `
A new customer review has been submitted and is pending approval in Sanity Studio.

Customer: ${data.name}
${data.email ? `Email: ${data.email}` : ""}
Rating: ${"⭐".repeat(data.rating)} (${data.rating}/5)
Project Type: ${data.projectType}
${data.orderNumber ? `Order Number: ${data.orderNumber}` : ""}

Review:
${data.text}

To approve or reject this review, visit:
${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/studio

Sanity Document ID: ${sanityDocumentId}
          `.trim(),
          ReplyTo: data.email,
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, id: sanityDocumentId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Review API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
