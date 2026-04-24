import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    if (!data.email && !data.phone && !data.name) {
      return NextResponse.json(
        { error: "At least one contact field is required" },
        { status: 400 }
      );
    }

    try {
      await prisma.lead.create({
        data: {
          name: data.name || "Anonymous",
          email: data.email || "",
          phone: data.phone || null,
          source: data.source,
          message: data.visitorId ? `Chat visitor: ${data.visitorId}` : null,
        },
      });
    } catch (error) {
      logger.error("Lead creation error", error);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Lead API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
