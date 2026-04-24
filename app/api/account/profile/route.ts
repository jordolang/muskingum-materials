import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export async function GET() {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
      include: { addresses: { orderBy: { isDefault: "desc" } } },
    });

    logger.info("Profile fetched successfully", {
      userId: session.userId,
      hasProfile: !!profile,
      addressCount: profile?.addresses?.length || 0,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error("Failed to fetch user profile", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = profileUpdateSchema.parse(body);

    const profile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      update: data,
      create: {
        userId: session.userId,
        ...data,
      },
      include: { addresses: true },
    });

    logger.info("Profile updated successfully", {
      userId: session.userId,
      profileId: profile.id,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Profile update validation failed", {
        userId: session?.userId,
        errors: error.errors,
      });
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    logger.error("Failed to update user profile", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
