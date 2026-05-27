import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/schemas";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * POST /api/quote
 * Submit a quote request for products and services
 *
 * Request body (validated against quoteSchema):
 * - name: string (min 2 chars, required)
 * - email: string (valid email, required)
 * - phone: string (optional)
 * - company: string (optional)
 * - products: Array<{ productName: string, quantity: string }> (required)
 * - deliveryAddr: string (optional)
 * - notes: string (optional)
 *
 * Response (200):
 * {
 *   success: true,
 *   analytics: {
 *     productCount: number,
 *     leadSource: "quote_form"
 *   }
 * }
 *
 * Response (400): Invalid data - returns Zod validation errors
 * {
 *   error: "Invalid data",
 *   details: ZodError[]
 * }
 *
 * Response (500): Database or email error
 * {
 *   error: "Failed to save quote request" | "Internal server error"
 * }
 *
 * Rate limit: 10 requests per hour (contact-quote tier)
 * Side effects: Persists QuoteRequest to database, sends email notification to sales team
 */
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
    const productList = data.products
      .map((p) => `  - ${p.productName}: ${p.quantity}`)
      .join("\n");

    await sendEmail({
      to: "sales@muskingummaterials.com",
      subject: `Quote Request from ${data.name}`,
      textBody: `
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
      replyTo: data.email,
    });

    return NextResponse.json({
      success: true,
      analytics: {
        productCount: data.products.length,
        leadSource: "quote_form",
      },
    });
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
