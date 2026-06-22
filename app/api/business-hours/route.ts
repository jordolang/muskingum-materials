import { NextResponse } from "next/server";
import { getBusinessHoursStatus } from "@/lib/business-hours";
import { logger } from "@/lib/logger";

/**
 * GET /api/business-hours
 *
 * Returns the current business hours status
 *
 * @response 200 - Business hours status
 * {
 *   isBusinessHours: boolean,
 *   isAfterHours: boolean,
 *   isWeekend: boolean,
 *   nextAvailable: string
 * }
 */
export async function GET() {
  try {
    const status = getBusinessHoursStatus();

    return NextResponse.json(status);
  } catch (error) {
    logger.error("Business hours API error", error, {
      operation: "business-hours.GET",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
