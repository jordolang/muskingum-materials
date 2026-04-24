import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const restockNotifySchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = restockNotifySchema.parse(body);

    await prisma.restockNotification.create({
      data: {
        email: data.email,
        productId: data.productId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Log database errors for monitoring
    console.error('[restock-notify] Database error:', error);

    return NextResponse.json(
      { error: "Failed to save notification request. Please try again." },
      { status: 500 }
    );
  }
}
