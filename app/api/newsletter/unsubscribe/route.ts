import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = newsletterSchema.parse(body);

    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: data.email },
      });

      if (!subscriber) {
        return NextResponse.json(
          { error: "Email not found in subscriber list" },
          { status: 404 }
        );
      }

      await prisma.newsletterSubscriber.update({
        where: { email: data.email },
        data: { active: false },
      });
    } catch (error) {
      logger.error("Newsletter unsubscribe error", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe from newsletter" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    logger.error("Newsletter unsubscribe API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
