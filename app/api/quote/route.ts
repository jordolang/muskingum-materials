import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = quoteSchema.parse(body);

    try {
      await prisma.quoteRequest.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          products: data.products,
          deliveryAddr: data.deliveryAddr || null,
          notes: data.notes || null,
        },
      });
    } catch (dbError) {
      logger.error("Database error saving quote request", dbError, {
        operation: "quoteRequest.create",
        email: data.email,
        company: data.company,
      });
      return NextResponse.json({ error: "Failed to save quote request" }, { status: 500 });
    }

    // Send email notification
    if (process.env.POSTMARK_API_TOKEN) {
      try {
        const postmark = await import("postmark");
        const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
        const productList = data.products
          .map((p) => `  - ${p.productName}: ${p.quantity}`)
          .join("\n");

        await client.sendEmail({
          From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
          To: "sales@muskingummaterials.com",
          Subject: `Quote Request from ${data.name}`,
          TextBody: `
New quote request:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Company: ${data.company || "Not provided"}

Products:
${productList}

Delivery Address: ${data.deliveryAddr || "Pickup"}
Notes: ${data.notes || "None"}
          `.trim(),
          ReplyTo: data.email,
        });
      } catch (emailError) {
        logger.error("Failed to send quote email notification", emailError, {
          operation: "postmark.sendEmail",
          email: data.email,
          company: data.company,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Quote API error", error, {
      operation: "quote.POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
