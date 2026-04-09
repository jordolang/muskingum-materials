import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const newsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

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
    } catch {
      // Database not configured yet
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
