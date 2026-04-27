import { NextRequest, NextResponse } from "next/server";
import { sendReviewRequests } from "@/lib/jobs/send-review-requests";

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
