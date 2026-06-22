import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/delivery-scheduling";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/delivery/availability
 *
 * Returns available delivery slots within a date range, respecting configured
 * business rules (lead time, blackout dates, capacity limits, business days).
 *
 * Used by the customer checkout flow to display a calendar of bookable delivery
 * dates and time windows.
 *
 * Query params:
 * - startDate (optional): ISO date string (YYYY-MM-DD). Defaults to today.
 * - endDate (optional): ISO date string (YYYY-MM-DD). Defaults to 30 days from startDate.
 *
 * Response shape: {
 *   slots: Array<{
 *     date: string,              // ISO date string (YYYY-MM-DD)
 *     dateDisplay: string,        // Human-readable date (e.g., "Fri, Jun 27")
 *     windows: Array<{
 *       key: string,              // Time window identifier (e.g., "morning", "afternoon")
 *       label: string,            // Display label (e.g., "Morning (8am-12pm)")
 *       available: number,        // Remaining capacity
 *       total: number,            // Total capacity
 *       disabled: boolean         // True if slot is full or unavailable
 *     }>
 *   }>
 * }
 *
 * Example: GET /api/delivery/availability?startDate=2026-06-25
 *
 * Status codes:
 * - 200: Success
 * - 400: Invalid date format
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse({
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  try {
    // Parse start date or default to today
    let startDate: Date;
    if (parsed.data.startDate) {
      startDate = new Date(parsed.data.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid startDate format. Expected YYYY-MM-DD." },
          { status: 400 }
        );
      }
    } else {
      startDate = new Date();
    }

    // Parse end date or default to 30 days from start
    let endDate: Date;
    if (parsed.data.endDate) {
      endDate = new Date(parsed.data.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid endDate format. Expected YYYY-MM-DD." },
          { status: 400 }
        );
      }
    } else {
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Validate date range
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "endDate must be after startDate" },
        { status: 400 }
      );
    }

    // Fetch available slots
    const slots = await getAvailableSlots(startDate, endDate);

    return NextResponse.json({ slots });
  } catch (error) {
    logger.error("Failed to fetch delivery availability", error, {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });

    return NextResponse.json(
      { error: "Failed to load delivery availability" },
      { status: 500 }
    );
  }
}
