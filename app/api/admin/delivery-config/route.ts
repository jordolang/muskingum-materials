import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deliveryConfigSchema } from "@/lib/schemas";

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = user.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

/**
 * GET /api/admin/delivery-config
 * Returns the delivery configuration settings
 * Requires: Admin authentication (Clerk role: admin)
 * Returns: Single DeliveryConfig object or default if none exists
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const config = await prisma.deliveryConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        config: {
          availableDays: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
          },
          blackoutDates: [],
          slotsPerDay: 2,
          capacityPerSlot: 5,
          leadTimeDays: 2,
          timeWindows: [
            {
              key: "morning",
              label: "Morning (8am-12pm)",
              start: "08:00",
              end: "12:00",
            },
            {
              key: "afternoon",
              label: "Afternoon (1pm-5pm)",
              start: "13:00",
              end: "17:00",
            },
          ],
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch delivery config" }, { status: 500 });
  }
}

/**
 * POST /api/admin/delivery-config
 * Creates or updates the delivery configuration settings
 * Requires: Admin authentication (Clerk role: admin)
 * Validates: deliveryConfigSchema
 * Body: { availableDays, blackoutDates, slotsPerDay, capacityPerSlot, leadTimeDays, timeWindows }
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await request.json();
    const data = deliveryConfigSchema.parse(body);

    // Delete any existing configs first (there should only be one)
    await prisma.deliveryConfig.deleteMany({});

    // Create new config
    const config = await prisma.deliveryConfig.create({
      data: {
        availableDays: data.availableDays,
        blackoutDates: data.blackoutDates,
        slotsPerDay: data.slotsPerDay,
        capacityPerSlot: data.capacityPerSlot,
        leadTimeDays: data.leadTimeDays,
        timeWindows: data.timeWindows,
      },
    });

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update delivery config" },
      { status: 500 }
    );
  }
}
