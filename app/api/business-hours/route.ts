import { NextResponse } from "next/server";
import { getBusinessHoursStatus } from "@/lib/business-hours";

/**
 * Business hours status endpoint.
 *
 * @access public
 * @returns 200 `{ isBusinessHours: boolean, isAfterHours: boolean, isWeekend: boolean, nextAvailable: string }` with current business hours status
 * @throws 500 `{ error: "Internal server error" }` when status check fails
 * @see getBusinessHoursStatus in lib/business-hours.ts — hardcoded configuration (Mon-Fri 7:30 AM – 4:00 PM ET)
 * @remarks This endpoint has no rate limiting and accepts no parameters.
 *   Used by client-side components to adjust messaging during after-hours periods.
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
