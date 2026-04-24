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
      await prisma.newsletterSubscriber.upsert({
        where: { email: data.email },
        update: { active: true, name: data.name || undefined },
        create: {
          email: data.email,
          name: data.name || null,
        },
      });
    } catch (error) {
      logger.error("Newsletter subscription error", error);
      return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    logger.error("Newsletter API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
