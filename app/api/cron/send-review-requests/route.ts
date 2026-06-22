import { NextRequest, NextResponse } from "next/server";
import { sendReviewRequests } from "@/lib/jobs/send-review-requests";

/**
 * Scheduled cron job endpoint for sending review request emails to customers with completed orders.
 *
 * @access public (requires Bearer token authorization)
 * @param request - Incoming GET request. Must include `Authorization: Bearer <CRON_SECRET>` header
 *   to authenticate the Vercel Cron scheduler.
 * @returns 200 `{ success: true, emailsSent: number, errors: string[], timestamp: string }` on success
 * @returns 401 `{ error: "Unauthorized" }` when authorization header is missing or invalid
 * @returns 500 `{ success: false, error: string, timestamp: string }` on internal errors
 * @see sendReviewRequests in lib/jobs/send-review-requests.ts — filters eligible orders (completed 7+ days ago,
 *   not already sent review request) and sends templated Postmark emails
 * @see vercel.json — cron schedule configuration (daily at 9 AM EST)
 * @remarks Authorization is enforced via Bearer token (`CRON_SECRET` env var). If `CRON_SECRET` is not set,
 *   all requests are allowed (unsafe in production). Vercel Cron automatically injects the correct
 *   authorization header when triggering scheduled jobs.
 */
export async function GET(request: NextRequest) {
  // Verify authorization (Vercel Cron sends a specific header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendReviewRequests();

    return NextResponse.json({
      success: true,
      emailsSent: result.emailsSent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
