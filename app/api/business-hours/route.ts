import { NextResponse } from "next/server";
import { getBusinessHoursStatus } from "@/lib/business-hours";

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
